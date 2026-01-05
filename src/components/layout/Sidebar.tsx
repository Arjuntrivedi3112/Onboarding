import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Cpu,
  Target,
  DollarSign,
  Users,
  Database,
  BarChart3,
  Tv,
  Brain,
  ChevronRight,
  Zap,
  MessageSquare,
  Upload,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Topic {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const topics: Topic[] = [
  { id: "home", label: "Ecosystem Map", icon: <Home className="w-4 h-4" />, description: "Interactive overview" },
  { id: "basics", label: "AdTech Basics", icon: <BookOpen className="w-4 h-4" />, description: "Core concepts" },
  { id: "technology", label: "Technology Stack", icon: <Cpu className="w-4 h-4" />, description: "DSP, SSP, Exchange" },
  { id: "adserving", label: "Ad Serving", icon: <Zap className="w-4 h-4" />, description: "Step-by-step flow" },
  { id: "targeting", label: "Targeting & Budget", icon: <Target className="w-4 h-4" />, description: "Precision delivery" },
  { id: "mediabuying", label: "Media Buying & RTB", icon: <DollarSign className="w-4 h-4" />, description: "Real-time bidding" },
  { id: "tracking", label: "Tracking & Attribution", icon: <BarChart3 className="w-4 h-4" />, description: "Measuring success" },
  { id: "channels", label: "Channels & Formats", icon: <Tv className="w-4 h-4" />, description: "Display, video, CTV" },
  { id: "identity", label: "User Identity", icon: <Users className="w-4 h-4" />, description: "Privacy & tracking" },
  { id: "data", label: "Data & DMP", icon: <Database className="w-4 h-4" />, description: "Audience segments" },
  { id: "ai", label: "AI in AdTech", icon: <Brain className="w-4 h-4" />, description: "Smart optimization" },
];

interface SidebarProps {
  activeModule: string;
  onModuleChange: (id: string) => void;
  onOpenChat: () => void;
  onOpenUpload: () => void;
}

export function Sidebar({ activeModule, onModuleChange, onOpenChat, onOpenUpload }: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <motion.aside
      initial={{ width: 280 }}
      animate={{ width: isExpanded ? 280 : 72 }}
      className="h-screen bg-sidebar border-r border-sidebar-border flex flex-col fixed left-0 top-0 z-50"
    >
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center glow-primary">
            <Zap className="w-5 h-5 text-primary-foreground" />
          </div>
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <h1 className="font-display font-bold text-lg text-foreground">AdTech</h1>
                <p className="text-xs text-muted-foreground">Visual Explorer</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-2">
        <div className="space-y-1">
          {topics.map((topic) => (
            <motion.button
              key={topic.id}
              onClick={() => onModuleChange(topic.id)}
              whileHover={{ x: 4 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                activeModule === topic.id
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : "text-muted-foreground hover:text-foreground hover:bg-sidebar-accent"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-md transition-colors",
                activeModule === topic.id ? "bg-primary/20" : "bg-sidebar-accent group-hover:bg-muted"
              )}>
                {topic.icon}
              </div>
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium">{topic.label}</p>
                    <p className="text-xs text-muted-foreground">{topic.description}</p>
                  </motion.div>
                )}
              </AnimatePresence>
              {isExpanded && activeModule === topic.id && (
                <ChevronRight className="w-4 h-4 text-primary" />
              )}
            </motion.button>
          ))}
        </div>
      </nav>

      {/* AI Actions */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <motion.button
          onClick={onOpenChat}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-gradient-to-r from-primary/20 to-accent/20 text-foreground border border-primary/30 hover:border-primary/50 transition-all"
        >
          <MessageSquare className="w-4 h-4 text-primary" />
          {isExpanded && <span className="text-sm font-medium">AI Explainer</span>}
        </motion.button>
        <motion.button
          onClick={onOpenUpload}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all"
        >
          <Upload className="w-4 h-4" />
          {isExpanded && <span className="text-sm font-medium">Upload Docs</span>}
        </motion.button>
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border flex items-center justify-center hover:bg-muted transition-colors"
      >
        <ChevronRight className={cn("w-3 h-3 transition-transform", !isExpanded && "rotate-180")} />
      </button>
    </motion.aside>
  );
}
