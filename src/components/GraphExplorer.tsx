// src/components/Graph.js
import { useEffect, useState } from "react";
import cytoscape from "cytoscape";
import API_BASE_URL from "./config"; // Adjust the import based on your project structure

const Graph = () => {
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });

  // Color map based on the type value
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
        const apiBaseUrl = API_BASE_URL;
        const response = await fetch(`${apiBaseUrl}/graph2`);
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
            data: { id: node.id, label: node.label, type: node.type },
          })),
          edges: graphData.edges.map((edge) => ({
            data: { source: edge.from, target: edge.to, type: edge.type },
          })),
        },

        style: [
          {
            selector: "node",
            style: {
              content: "data(label)",
              color: "#000000", // Text color set to black
              label: "data(label)",
              "font-size": "12px",
              "text-halign": "center", // center-align the text horizontally
              "text-valign": "center", // center-align the text vertically
              // Set node background color based on the type
              "background-color": (node) => {
                const type = node.data("type");
                return typeColorMap[type] || "#AAAAAA"; // Default to grey if type is not in map
              },
            },
          },
          {
            selector: "edge",
            style: {
              width: 2,
              "line-color": "#cccccc",
              "target-arrow-color": "#cccccc",
              "target-arrow-shape": "triangle",
              label: "data(type)",
              "font-size": "8px",
            },
          },
        ],

        layout: {
          name: "circle",
        },
      });

      cy.zoom(1);
      cy.pan({ x: 50, y: 50 });
    }
  }, [graphData]);

  return (
    <div>
      <h2>Graph Visualization for Task</h2>
      <div
        id="cy"
        style={{ width: "100%", height: "500px", border: "1px solid #ccc" }}
      ></div>
    </div>
  );
};

export default Graph;
