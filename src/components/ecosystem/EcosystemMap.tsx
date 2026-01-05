import { useState } from "react";
import { motion } from "framer-motion";
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

// Better spaced layout to prevent overlapping
const nodes: NodeData[] = [
  { id: "advertiser", label: "Advertiser", description: "Brands wanting ads", x: 8, y: 18, color: "advertiser" },
  { id: "agency", label: "Agency / ATD", description: "Media buying experts", x: 8, y: 42, color: "advertiser" },
  { id: "dsp", label: "DSP", description: "Demand-Side Platform", x: 28, y: 30, color: "dsp" },
  { id: "dmp", label: "DMP / CDP", description: "Data Management", x: 28, y: 58, color: "dsp" },
  { id: "exchange", label: "Ad Exchange", description: "RTB Marketplace", x: 50, y: 30, color: "exchange" },
  { id: "ssp", label: "SSP", description: "Supply-Side Platform", x: 72, y: 30, color: "ssp" },
  { id: "adserver", label: "Ad Server", description: "Creative delivery", x: 72, y: 58, color: "ssp" },
  { id: "publisher", label: "Publisher", description: "Website/App", x: 92, y: 18, color: "publisher" },
  { id: "user", label: "User", description: "Person viewing ads", x: 92, y: 42, color: "user" },
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

export function EcosystemMap({ onNodeClick }: EcosystemMapProps) {
  const [activeNode, setActiveNode] = useState<string | null>(null);

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    return node ? { x: node.x, y: node.y } : { x: 0, y: 0 };
  };

  return (
    <div className="relative w-full h-full min-h-[550px] bg-grid-pattern bg-grid rounded-2xl overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-radial from-primary/5 via-transparent to-transparent pointer-events-none" />
      
      {/* SVG for connection lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }}>
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
            <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        
        {connections.map((conn, i) => {
          const from = getNodePosition(conn.from);
          const to = getNodePosition(conn.to);
          const isActive = activeNode === conn.from || activeNode === conn.to;
          
          return (
            <DataFlowLine
              key={`${conn.from}-${conn.to}`}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              label={conn.label}
              isActive={isActive}
              dashed={conn.dashed}
              delay={i * 0.2}
            />
          );
        })}
      </svg>

      {/* Nodes */}
      <div className="relative z-10 w-full h-full">
        {nodes.map((node, i) => (
          <EcosystemNode
            key={node.id}
            {...node}
            isActive={activeNode === node.id}
            onHover={(id) => setActiveNode(id)}
            onClick={() => onNodeClick(node.id)}
            delay={i * 0.1}
          />
        ))}
      </div>

      {/* Legend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
        className="absolute bottom-4 left-4 glass rounded-xl p-3"
      >
        <p className="text-xs text-muted-foreground mb-2">Click any component to learn more</p>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-node-advertiser" />
            <span className="text-xs">Demand Side</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-node-exchange" />
            <span className="text-xs">Marketplace</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-node-ssp" />
            <span className="text-xs">Supply Side</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
