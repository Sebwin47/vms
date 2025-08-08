import React, { useEffect, useRef, useState } from "react";
import cytoscape from "cytoscape";
import coseBilkent from "cytoscape-cose-bilkent";
import klay from "cytoscape-klay";
import cytoscapePopper from "cytoscape-popper";
import { computePosition, flip, shift, limitShift } from "@floating-ui/dom";
import API_BASE_URL from "./config";

// Plugins registrieren
cytoscape.use(coseBilkent);
cytoscape.use(klay);

// Popper factory anpassen an floating ui
function popperFactory(ref, content, opts) {
  const popperOptions = {
    middleware: [flip(), shift({ limiter: limitShift() })],
    ...opts,
  };

  // update muss die Position des Content Elements setzen
  async function update() {
    try {
      const { x, y } = await computePosition(ref, content, popperOptions);
      Object.assign(content.style, {
        left: `${Math.round(x)}px`,
        top: `${Math.round(y)}px`,
        position: "absolute",
        transform: "translate3d(0,0,0)",
        zIndex: 9999,
      });
    } catch (e) {
      // ignore
    }
  }

  // initial run
  update();

  return { update };
}

// cytoscape popper registrieren
cytoscape.use(cytoscapePopper(popperFactory));

// Typen
type NodeType = {
  id: string;
  label: string;
  type: string;
  properties?: Record<string, any>;
};
type EdgeType = { from: string; to: string; type: string; weight?: number };

const TYPE_COLOR_MAP: Record<string, string> = {
  volunteer: "#F16667",
  skill: "#8DCC93",
  task: "#D9C8AE",
  group: "#569480",
  place: "#A5ABB6",
  coordinator: "#DA7194",
  taskcategory: "#FFC454",
};

const LAYOUTS: Record<string, any> = {
  force: { name: "cose-bilkent", animate: true, fit: true, padding: 40 },
  grid: { name: "grid", fit: true, padding: 40 },
  circle: { name: "circle", fit: true, padding: 40 },
  hierarchy: {
    name: "klay",
    klay: { direction: "DOWN" },
    fit: true,
    padding: 40,
  },
};

function computeNodeSize(degree: number) {
  const minSize = 28;
  const maxSize = 92;
  const size = minSize + Math.log2((degree || 0) + 1) * 14;
  return Math.max(minSize, Math.min(maxSize, Math.round(size)));
}

export default function InteractiveNetworkPro() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);

  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<EdgeType[]>([]);
  const [layoutName, setLayoutName] = useState<string>(
    () => localStorage.getItem("graph_layout") || "force"
  );
  const [filterType, setFilterType] = useState<string>(
    () => localStorage.getItem("graph_filter") || "all"
  );
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [activeNode, setActiveNode] = useState<NodeType | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const popperStore = useRef<Record<string, { popper: any; el: HTMLElement }>>(
    {}
  );

  // initial laden
  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/graph`);
        const data = await res.json();
        if (!mounted) return;

        setNodes(
          (data.nodes || []).map((n: any) => ({
            ...n,
            type: (n.type || "unknown").toLowerCase(),
          }))
        );
        setEdges(
          (data.edges || []).map((e: any) => ({ ...e, weight: e.weight || 1 }))
        );
      } catch (err) {
        console.error("Fehler beim Laden des Graphen", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  // persist settings
  useEffect(() => {
    localStorage.setItem("graph_layout", layoutName);
  }, [layoutName]);
  useEffect(() => {
    localStorage.setItem("graph_filter", filterType);
  }, [filterType]);

  // helper grade map
  function buildDegreeMap(visibleNodes: NodeType[], visibleEdges: EdgeType[]) {
    const map: Record<string, number> = {};
    visibleNodes.forEach((n) => (map[n.id] = 0));
    visibleEdges.forEach((e) => {
      map[e.from] = (map[e.from] || 0) + 1;
      map[e.to] = (map[e.to] || 0) + 1;
    });
    return map;
  }

  // cytoscape init und aktualisierung
  useEffect(() => {
    if (!containerRef.current) return;
    if (nodes.length === 0) return;

    // anwenden filter
    const visibleNodes =
      filterType === "all" ? nodes : nodes.filter((n) => n.type === filterType);
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));
    const visibleEdges = edges.filter(
      (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
    );

    const degreeMap = buildDegreeMap(visibleNodes, visibleEdges);

    const elements: any[] = [
      ...visibleNodes.map((n) => ({
        data: {
          id: n.id,
          label: n.label,
          type: n.type,
          properties: n.properties,
        },
      })),
      ...visibleEdges.map((e) => ({
        data: {
          id: `${e.from}__${e.to}__${e.type}`,
          source: e.from,
          target: e.to,
          type: e.type,
          weight: e.weight,
        },
      })),
    ];

    // cleanup vorherige instanz
    if (cyRef.current) {
      // destroy stored poppers
      Object.values(popperStore.current).forEach((p) => {
        try {
          if (p.popper && typeof p.popper.destroy === "function")
            p.popper.destroy();
        } catch (e) {}
        try {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        } catch (e) {}
      });
      popperStore.current = {};

      cyRef.current.destroy();
      cyRef.current = null;
    }

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      style: [
        {
          selector: "node",
          style: {
            label: "data(label)",
            "text-wrap": "wrap",
            "text-max-width": "140",
            "font-size": 12,
            "text-valign": "center",
            "text-halign": "center",
            color: "#111",
            "text-outline-width": 6,
            "text-outline-color": "rgba(255,255,255,0.92)",
            "overlay-padding": 6,
            "overlay-opacity": 0,
            "background-color": (ele: any) =>
              TYPE_COLOR_MAP[ele.data("type")] || "#BDBDBD",
            "border-width": 2,
            "border-color": "#222",
            width: (ele: any) => computeNodeSize(degreeMap[ele.id()] || 0),
            height: (ele: any) => computeNodeSize(degreeMap[ele.id()] || 0),
          },
        },
        {
          selector: "edge",
          style: {
            width: "mapData(weight, 1, 10, 1, 6)",
            "line-color": "#BDBDBD",
            "target-arrow-color": "#BDBDBD",
            "target-arrow-shape": "triangle",
            "curve-style": "bezier",
            label: "data(type)",
            "font-size": 10,
            "text-rotation": "autorotate",
            opacity: 0.95,
          },
        },
        { selector: ".faded", style: { opacity: 0.08, "text-opacity": 0 } },
        {
          selector: ".searchMatch",
          style: {
            "border-color": "#111",
            "border-width": 4,
            "transition-property": "border-width",
            "transition-duration": "150ms",
          },
        },
      ],
      layout: LAYOUTS[layoutName],
      wheelSensitivity: 0.2,
      motionBlur: true,
    });

    cyRef.current = cy;

    // update function for poppers on pan zoom resize
    function updateAllPoppers() {
      Object.entries(popperStore.current).forEach(([id, entry]) => {
        try {
          if (entry.popper && typeof entry.popper.update === "function")
            entry.popper.update();
        } catch (e) {}
      });
    }

    cy.on("pan zoom resize", updateAllPoppers);

    // hover fokus
    cy.on("mouseover", "node", (evt) => {
      const node = evt.target;
      cy.elements().addClass("faded");
      node.removeClass("faded");
      node.connectedEdges().removeClass("faded");
      node.connectedEdges().connectedNodes().removeClass("faded");
    });
    cy.on("mouseout", "node", () => cy.elements().removeClass("faded"));

    // tap show popper und set active node
    cy.on("tap", "node", (evt) => {
      const node = evt.target;
      const data = node.data();

      // set detail panel
      setActiveNode({
        id: data.id,
        label: data.label,
        type: data.type,
        properties: data.properties,
      });

      // create or reuse popper
      const id = data.id;

      // destroy existing popper for this node
      if (popperStore.current[id]) {
        try {
          if (
            popperStore.current[id].popper &&
            typeof popperStore.current[id].popper.destroy === "function"
          )
            popperStore.current[id].popper.destroy();
        } catch (e) {}
        try {
          if (
            popperStore.current[id].el &&
            popperStore.current[id].el.parentNode
          )
            popperStore.current[id].el.parentNode.removeChild(
              popperStore.current[id].el
            );
        } catch (e) {}
        delete popperStore.current[id];
      }

      const content = () => {
        const div = document.createElement("div");
        div.className = "cy-popper-card";
        div.style.padding = "10px 12px";
        div.style.background = "white";
        div.style.border = "1px solid rgba(0,0,0,0.08)";
        div.style.borderRadius = "8px";
        div.style.boxShadow = "0 8px 20px rgba(15,23,42,0.08)";
        div.style.fontSize = "13px";
        div.innerHTML = `
          <div style=\"font-weight:600;margin-bottom:6px;\">${escapeHtml(
            String(data.label || "")
          )}</div>
          <div style=\"font-size:12px;color:#555;\">Typ: ${escapeHtml(
            String(data.type || "")
          )}</div>
          <div style=\"margin-top:8px;font-size:12px;color:#333;\">${escapeHtml(
            String(
              (data.properties && data.properties.summary) ||
                "Keine Beschreibung"
            )
          )}</div>
          <div style=\"margin-top:8px;display:flex;gap:8px;\">
            <button data-action=\"expand\" style=\"padding:6px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.06);background:#fff;cursor:pointer\">Nachbarschaft</button>
            <button data-action=\"details\" style=\"padding:6px 8px;border-radius:6px;border:1px solid rgba(0,0,0,0.06);background:#f6f8fb;cursor:pointer\">Details</button>
          </div>
        `;

        // event delegation for buttons
        div.addEventListener("click", (e) => {
          const target = e.target as HTMLElement;
          const action =
            target.getAttribute("data-action") ||
            (target.parentElement &&
              target.parentElement.getAttribute("data-action"));
          if (action === "expand") {
            expandNeighborhood(id, 1);
          } else if (action === "details") {
            // just focus detail panel
            setActiveNode({
              id: data.id,
              label: data.label,
              type: data.type,
              properties: data.properties,
            });
          }
        });

        document.body.appendChild(div);
        return div;
      };

      const popperInstance = node.popper({ content });

      // store for later update and destroy
      const el = document.body.lastElementChild as HTMLElement;
      popperStore.current[id] = { popper: popperInstance, el };

      // show if instance provides show
      try {
        if (popperInstance && typeof popperInstance.show === "function")
          popperInstance.show();
      } catch (e) {}

      // keep popper updated on node moves
      const onPos = () => {
        try {
          if (
            popperStore.current[id] &&
            popperStore.current[id].popper &&
            typeof popperStore.current[id].popper.update === "function"
          )
            popperStore.current[id].popper.update();
        } catch (e) {}
      };
      node.on("position", onPos);

      // remove on deselect
      const cleanupOnDeselect = () => {
        try {
          if (
            popperStore.current[id] &&
            popperStore.current[id].popper &&
            typeof popperStore.current[id].popper.destroy === "function"
          )
            popperStore.current[id].popper.destroy();
        } catch (e) {}
        try {
          if (
            popperStore.current[id] &&
            popperStore.current[id].el &&
            popperStore.current[id].el.parentNode
          )
            popperStore.current[id].el.parentNode.removeChild(
              popperStore.current[id].el
            );
        } catch (e) {}
        delete popperStore.current[id];
        node.removeListener("position", onPos);
      };

      // close popper if user clicks outside
      const onDocClick = (ev: MouseEvent) => {
        const path = ev.composedPath
          ? ev.composedPath()
          : (ev as any).path || [];
        if (
          popperStore.current[id] &&
          popperStore.current[id].el &&
          !path.includes(popperStore.current[id].el)
        ) {
          cleanupOnDeselect();
          document.removeEventListener("click", onDocClick);
        }
      };
      setTimeout(() => document.addEventListener("click", onDocClick), 10);
    });

    // search highlight
    if (searchTerm.trim().length > 0) {
      const q = searchTerm.toLowerCase();
      cy.nodes().forEach((n) => {
        const lab = String(n.data("label") || "").toLowerCase();
        if (lab.includes(q)) n.addClass("searchMatch");
        else n.removeClass("searchMatch");
      });
    } else {
      cy.nodes().removeClass("searchMatch");
    }

    return () => {
      try {
        cy.off();
      } catch (e) {}
      try {
        cy.destroy();
      } catch (e) {}
      cyRef.current = null;

      // destroy poppers
      Object.values(popperStore.current).forEach((p) => {
        try {
          if (p.popper && typeof p.popper.destroy === "function")
            p.popper.destroy();
        } catch (e) {}
        try {
          if (p.el && p.el.parentNode) p.el.parentNode.removeChild(p.el);
        } catch (e) {}
      });
      popperStore.current = {};
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodes, edges, layoutName, filterType, searchTerm]);

  // nutzer aktionen
  function resetView() {
    if (!cyRef.current) return;
    cyRef.current.fit();
    cyRef.current.center();
  }

  function exportPNG() {
    if (!cyRef.current) return;
    const png = cyRef.current.png({ full: true, scale: 1 });
    const link = document.createElement("a");
    link.href = png;
    link.download = "network.png";
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  function exportJSON() {
    const payload = { nodes, edges };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "network.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  async function expandNeighborhood(nodeId: string, depth = 1) {
    try {
      const res = await fetch(
        `${API_BASE_URL}/neighborhood?id=${encodeURIComponent(
          nodeId
        )}&depth=${depth}`
      );
      const data = await res.json();
      if (!data) return;

      setNodes((prev) => {
        const map = new Map(prev.map((n) => [n.id, n]));
        (data.nodes || []).forEach((n: any) =>
          map.set(n.id, { ...n, type: (n.type || "unknown").toLowerCase() })
        );
        return Array.from(map.values());
      });

      setEdges((prev) => {
        const set = new Set(prev.map((e) => `${e.from}__${e.to}__${e.type}`));
        const arr = [...prev];
        (data.edges || []).forEach((e: any) => {
          const key = `${e.from}__${e.to}__${e.type}`;
          if (!set.has(key)) {
            set.add(key);
            arr.push({
              from: e.from,
              to: e.to,
              type: e.type,
              weight: e.weight || 1,
            });
          }
        });
        return arr;
      });
    } catch (e) {
      console.error("Fehler beim Laden der Nachbarschaft", e);
    }
  }

  async function runCommunityDetection() {
    try {
      const res = await fetch(`${API_BASE_URL}/communities`);
      const data = await res.json();
      if (!cyRef.current) return;
      cyRef.current.batch(() => {
        Object.entries(data || {}).forEach(([nodeId, community]) => {
          const n = cyRef.current!.getElementById(String(nodeId));
          if (n) n.data("community", community);
        });
      });
      alert("Community Daten geladen");
    } catch (e) {
      console.error(e);
      alert("Fehler bei Community Detection");
    }
  }

  function topDegreeNodes(limit = 10) {
    const map: Record<string, number> = {};
    edges.forEach((e) => {
      map[e.from] = (map[e.from] || 0) + 1;
      map[e.to] = (map[e.to] || 0) + 1;
    });
    return Object.entries(map)
      .map(([id, val]) => ({ id, val }))
      .sort((a, b) => b.val - a.val)
      .slice(0, limit);
  }

  return (
    <div style={{ display: "flex", gap: 16, height: "760px" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <div>
            {Object.keys(LAYOUTS).map((l) => (
              <button
                key={l}
                onClick={() => setLayoutName(l)}
                style={{
                  marginRight: 8,
                  padding: "8px 12px",
                  borderRadius: 8,
                  border: "1px solid rgba(0,0,0,0.06)",
                  background: layoutName === l ? "#1f6feb" : "white",
                  color: layoutName === l ? "white" : "#111",
                }}
              >
                {l}
              </button>
            ))}
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            <option value="all">Alle Typen</option>
            {Object.keys(TYPE_COLOR_MAP).map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Suche"
            style={{ padding: "8px 10px", borderRadius: 8, flex: 1 }}
          />

          <button
            onClick={resetView}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            Zur Ansicht
          </button>
          <button
            onClick={exportPNG}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            Export PNG
          </button>
          <button
            onClick={exportJSON}
            style={{ padding: "8px 10px", borderRadius: 8 }}
          >
            Export JSON
          </button>
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            border: "1px solid rgba(0,0,0,0.06)",
            borderRadius: 10,
            background: "linear-gradient(180deg,#FBFBFD,#FFFFFF)",
          }}
        />

        <div
          style={{
            marginTop: 8,
            display: "flex",
            gap: 8,
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <strong>Legende</strong>
            {Object.entries(TYPE_COLOR_MAP).map(([key, color]) => (
              <div
                key={key}
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  padding: "4px 6px",
                  borderRadius: 6,
                  background: "white",
                  border: "1px solid rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 4,
                    background: color,
                  }}
                />
                <div>{key}</div>
              </div>
            ))}
          </div>

          <div style={{ marginLeft: "auto", color: "#666" }}>
            {loading ? "Lade" : `${nodes.length} Knoten ${edges.length} Kanten`}
          </div>
        </div>
      </div>

      <aside
        style={{
          width: 380,
          borderLeft: "1px solid rgba(0,0,0,0.04)",
          padding: 16,
          background: "#FBFBFC",
          borderRadius: 8,
        }}
      >
        <h3 style={{ marginTop: 0 }}>Details</h3>
        {activeNode ? (
          <div>
            <h4 style={{ marginBottom: 8 }}>{activeNode.label}</h4>
            <div>Typ: {activeNode.type}</div>
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => expandNeighborhood(activeNode.id, 1)}
                style={{ padding: "8px 10px", borderRadius: 8 }}
              >
                Nachbarschaft laden
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              <strong>Eigenschaften</strong>
              <pre
                style={{
                  maxHeight: 260,
                  overflow: "auto",
                  background: "white",
                  padding: 8,
                  borderRadius: 8,
                }}
              >
                {JSON.stringify(activeNode.properties || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div>Kein Knoten ausgewählt</div>
        )}

        <div style={{ marginTop: 16 }}>
          <h4>Analyse Werkzeuge</h4>
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button
              style={{ padding: "8px 10px", borderRadius: 8 }}
              onClick={() => {
                const top = topDegreeNodes(10);
                alert(
                  "Top Knoten nach Grad\n" +
                    top.map((t) => `${t.id} ${t.val}`).join("\n")
                );
              }}
            >
              Grad Zentralitaet
            </button>

            <button
              style={{ padding: "8px 10px", borderRadius: 8 }}
              onClick={runCommunityDetection}
            >
              Community Detection
            </button>

            <button
              style={{ padding: "8px 10px", borderRadius: 8 }}
              onClick={() => {
                // fokussiere top 5
                const top = topDegreeNodes(5);
                if (!cyRef.current) return;
                const eles = top
                  .map((t) => cyRef.current!.getElementById(t.id))
                  .filter(Boolean);
                cyRef.current.animate({
                  fit: { eles, padding: 40 },
                  duration: 600,
                });
              }}
            >
              Zoom Top
            </button>
          </div>
        </div>

        <div style={{ marginTop: 18, color: "#777" }}>
          Hinweis
          <div style={{ fontSize: 13, marginTop: 6 }}>
            Diese Ansicht ist optimiert fuer interaktive Entdeckung und
            Erklaerung von Netzwerken. Bei sehr grossen Netzen sollten
            Teilgraphen geladen werden um Performance zu sichern.
          </div>
        </div>
      </aside>
    </div>
  );
}

// einfache escaping helper fuer innerHTML usage
function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
