// src/components/Graph.js
import { useEffect, useState } from "react";
import cytoscape from "cytoscape";
import API_BASE_URL from "./config";

const Graph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  const typeColorMap = {
    volunteer: "#F16667",
    skill: "#8DCC93",
    task: "#D9C8AE",
    group: "#569480",
    place: "#A5ABB6",
    coordinator: "#DA7194",
    taskcategory: "#FFC454",
  };

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/graph`);
        const data = await response.json();
        setGraphData(data);
      } catch (error) {
        console.error("Error fetching graph data:", error);
      }
    };

    fetchGraphData();
  }, []);

  useEffect(() => {
    if (graphData.nodes.length > 0) {
      const cy = cytoscape({
        container: document.getElementById("cy"),
        elements: {
          nodes: graphData.nodes.map((node) => ({
            data: {
              id: node.id,
              label: node.label,
              type: node.type.toLowerCase(),
            },
          })),
          edges: graphData.edges.map((edge) => ({
            data: {
              source: edge.from,
              target: edge.to,
              type: edge.type,
            },
          })),
        },
        style: [
          {
            selector: "node",
            style: {
              width: 100,
              height: 100,
              label: "data(label)",
              "text-valign": "center",
              "text-halign": "center",
              "font-size": "16px",
              color: "#000",
              "background-color": (ele) =>
                typeColorMap[ele.data("type")] || "#AAA",
              "border-width": 2,
              "border-color": "#333",
              "text-outline-width": 2,
              "text-outline-color": "#fff",
            },
          },

          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "#999",
              "target-arrow-color": "#999",
              "target-arrow-shape": "triangle",
              label: "data(type)",
              "font-size": "8px",
              "text-rotation": "autorotate",
              "curve-style": "bezier",
              "arrow-scale": 1.5,
            },
          },
        ],
        layout: {
          name: "cose",
          animate: true,
          padding: 30,
          nodeRepulsion: 80000,
          idealEdgeLength: 100,
          edgeElasticity: 100,
        },
      });

      // Hover highlight
      cy.on("mouseover", "node", (event) => {
        const node = event.target;
        node.animate({
          style: { "background-color": "#0d00ff" },
        });

        node.connectedEdges().animate({ style: { "line-color": "#00E5FF" } });
        node
          .connectedEdges()
          .connectedNodes()
          .not(node)
          .animate({ style: { "background-color": "#29bfff" } });
      });

      cy.on("mouseout", "node", () => {
        cy.elements().removeStyle();
      });

      // Zoom to node on click
      cy.on("tap", "node", (event) => {
        const node = event.target;
        cy.animate({
          fit: {
            eles: node.closedNeighborhood(),
            padding: 40,
          },
          duration: 500,
        });
      });
    }
  }, [graphData]);

  return (
    <div>
      <h2>Graph Visualization</h2>
      <div
        id="cy"
        style={{
          width: "100%",
          height: "600px",
          border: "1px solid #ccc",
          borderRadius: "8px",
        }}
      ></div>
    </div>
  );
};

export default Graph;
