import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

import { EcosystemNode } from "./EcosystemNode";
import { DataFlowLine } from "./DataFlowLine";

interface NodeData {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  color: string;
}

// Positions are percentages of the map canvas. On a narrow canvas the layout is
// transposed (x↔y) so the chain reads top to bottom instead of overlapping.
const nodes: NodeData[] = [
  { id: "advertiser", label: "Advertiser", description: "Brands", x: 10, y: 18, color: "advertiser" },
  { id: "agency", label: "Agency", description: "Media buyers", x: 10, y: 56, color: "advertiser" },
  { id: "dsp", label: "DSP", description: "Demand-Side", x: 30, y: 37, color: "dsp" },
  { id: "dmp", label: "DMP", description: "Data Mgmt", x: 30, y: 80, color: "dsp" },
  { id: "exchange", label: "Exchange", description: "RTB Market", x: 50, y: 37, color: "exchange" },
  { id: "ssp", label: "SSP", description: "Supply-Side", x: 70, y: 37, color: "ssp" },
  { id: "adserver", label: "Ad Server", description: "Delivery", x: 70, y: 80, color: "ssp" },
  { id: "publisher", label: "Publisher", description: "Site/App", x: 90, y: 18, color: "publisher" },
  { id: "user", label: "User", description: "Viewer", x: 90, y: 56, color: "user" },
];

const connections = [
  { from: "advertiser", to: "agency", label: "Budget" },
  { from: "agency", to: "dsp", label: "Campaign" },
  { from: "dsp", to: "exchange", label: "Bid Request" },
  { from: "dmp", to: "dsp", label: "Audience Data" },
  { from: "exchange", to: "ssp", label: "Win Notification" },
  { from: "ssp", to: "publisher", label: "Ad Tag" },
  { from: "adserver", to: "ssp", label: "Creative" },
  { from: "publisher", to: "user", label: "Ad Display" },
  { from: "user", to: "dmp", label: "Behavior Data", dashed: true },
];

interface EcosystemMapProps {
  onNodeClick: (nodeId: string) => void;
}

/** Below this canvas width the map switches to the vertical layout. */
const NARROW = 560;

/** Track the canvas size so lines are drawn in real pixels (round packets, crisp strokes). */
function useSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 800, height: 500 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ width: r.width, height: r.height });
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

export function EcosystemMap({ onNodeClick }: EcosystemMapProps) {
  const reduce = useReducedMotion();
  const [activeNode, setActiveNode] = useState<string | null>(null);
  const [outerRef, outer] = useSize<HTMLDivElement>();
  const narrow = outer.width < NARROW;
  const [canvasRef, canvas] = useSize<HTMLDivElement>();

  const placed = nodes.map((n) => (narrow ? { ...n, x: n.y, y: n.x } : n));
  const getNodePosition = (nodeId: string) => {
    const node = placed.find((n) => n.id === nodeId);
    return node ? { x: (node.x / 100) * canvas.width, y: (node.y / 100) * canvas.height } : { x: 0, y: 0 };
  };

  const linkedTo = (id: string) =>
    activeNode !== null && connections.some((c) => (c.from === activeNode && c.to === id) || (c.to === activeNode && c.from === id));

  return (
    <div ref={outerRef} className="relative w-full overflow-hidden rounded-2xl border border-border bg-card/50">
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(ellipse at 50% 40%, hsl(var(--primary) / 0.08), transparent 65%)" }}
      />
      {!reduce && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[40%] h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{ background: "radial-gradient(circle, hsl(var(--chain-exchange) / 0.18), transparent 70%)" }}
          animate={{ scale: [1, 1.25, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div className={narrow ? "relative h-[620px]" : "relative h-[460px]"}>
        <div ref={canvasRef} className={narrow ? "absolute inset-x-6 inset-y-8" : "absolute inset-x-12 inset-y-8"}>
          {/* Connection lines, in the canvas's pixel space */}
          <svg
            className="absolute inset-0 h-full w-full overflow-visible"
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            aria-hidden="true"
            focusable="false"
            style={{ zIndex: 0 }}
          >
            {connections.map((conn, i) => {
              const from = getNodePosition(conn.from);
              const to = getNodePosition(conn.to);
              const isActive = activeNode === conn.from || activeNode === conn.to;
              const source = nodes.find((n) => n.id === conn.from);
              return (
                <DataFlowLine
                  key={`${conn.from}-${conn.to}`}
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  label={conn.label}
                  isActive={isActive}
                  dimmed={activeNode !== null && !isActive}
                  dashed={conn.dashed}
                  delay={i * 0.15}
                  tone={source ? `var(--chain-${source.color})` : undefined}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {placed.map((node, i) => (
            <EcosystemNode
              key={node.id}
              {...node}
              isActive={activeNode === node.id}
              linked={linkedTo(node.id)}
              dimmed={activeNode !== null && activeNode !== node.id && !linkedTo(node.id)}
              onHover={(id) => setActiveNode(id)}
              onClick={() => onNodeClick(node.id)}
              delay={i * 0.08}
            />
          ))}

          {/* Labels for the highlighted lines, above the nodes */}
          <svg
            className="pointer-events-none absolute inset-0 z-20 h-full w-full overflow-visible"
            viewBox={`0 0 ${canvas.width} ${canvas.height}`}
            aria-hidden="true"
            focusable="false"
          >
            {connections.map((conn, i) => {
              const from = getNodePosition(conn.from);
              const to = getNodePosition(conn.to);
              return (
                <DataFlowLine
                  key={`${conn.from}-${conn.to}`}
                  layer="label"
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  label={conn.label}
                  isActive={activeNode === conn.from || activeNode === conn.to}
                  delay={i * 0.15}
                />
              );
            })}
          </svg>
        </div>
      </div>

      {/* Legend */}
      <motion.div
        initial={reduce ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 1 }}
        className="relative border-t border-border bg-card px-4 py-3"
      >
        <p className="mb-2 text-sm text-muted-foreground">
          Select any part to open the section that explains it. Hover or focus one to see what flows in and out.
        </p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chain-advertiser" />
            <span className="text-xs">Demand Side</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chain-exchange" />
            <span className="text-xs">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-chain-ssp" />
            <span className="text-xs">Supply Side</span>
          </div>
          <div className="flex items-center gap-2">
            <svg width="22" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="22" y2="3" stroke="hsl(var(--muted-foreground))" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
            <span className="text-xs">Data feedback</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
