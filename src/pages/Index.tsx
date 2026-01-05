import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { EcosystemMap } from "@/components/ecosystem/EcosystemMap";
import { BasicsModule } from "@/components/modules/BasicsModule";
import { TechnologyModule } from "@/components/modules/TechnologyModule";
import { RTBModule } from "@/components/modules/RTBModule";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { FileUploadPanel } from "@/components/ai/FileUploadPanel";
import { Rocket, BookOpen, Zap } from "lucide-react";

const Index = () => {
  const [activeModule, setActiveModule] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleNodeClick = (nodeId: string) => {
    // Map node IDs to module IDs
    const nodeToModule: Record<string, string> = {
      advertiser: "basics",
      agency: "basics",
      dsp: "technology",
      dmp: "data",
      exchange: "technology",
      ssp: "technology",
      adserver: "adserving",
      publisher: "basics",
      user: "identity",
    };
    setActiveModule(nodeToModule[nodeId] || "technology");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      {/* Main Content */}
      <main className="ml-[280px] min-h-screen">
        {activeModule === "home" ? (
          <HomeView onNodeClick={handleNodeClick} />
        ) : (
          <div className="p-8 max-w-7xl mx-auto">
            {activeModule === "basics" && <BasicsModule />}
            {activeModule === "technology" && <TechnologyModule />}
            {activeModule === "mediabuying" && <RTBModule />}
            {!["basics", "technology", "mediabuying"].includes(activeModule) && (
              <ComingSoonModule moduleId={activeModule} />
            )}
          </div>
        )}
      </main>

      {/* AI Panels */}
      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <FileUploadPanel isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

function HomeView({ onNodeClick }: { onNodeClick: (nodeId: string) => void }) {
  return (
    <div className="p-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm mb-4">
          <Zap className="w-4 h-4" />
          Interactive Learning Platform
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
          The AdTech{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
            Universe
          </span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore how digital advertising works end-to-end. Click any component to dive deep into its workings.
        </p>
      </motion.div>

      {/* Ecosystem Map */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        className="relative"
      >
        <EcosystemMap onNodeClick={onNodeClick} />
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div className="glass rounded-xl p-6 text-center">
          <Rocket className="w-8 h-8 mx-auto mb-3 text-primary" />
          <p className="text-2xl font-bold text-foreground">100ms</p>
          <p className="text-sm text-muted-foreground">RTB Auction Speed</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <BookOpen className="w-8 h-8 mx-auto mb-3 text-accent" />
          <p className="text-2xl font-bold text-foreground">10+</p>
          <p className="text-sm text-muted-foreground">Learning Modules</p>
        </div>
        <div className="glass rounded-xl p-6 text-center">
          <Zap className="w-8 h-8 mx-auto mb-3 text-green-500" />
          <p className="text-2xl font-bold text-foreground">$600B+</p>
          <p className="text-sm text-muted-foreground">Global Ad Spend 2025</p>
        </div>
      </motion.div>
    </div>
  );
}

function ComingSoonModule({ moduleId }: { moduleId: string }) {
  const titles: Record<string, string> = {
    adserving: "Ad Serving",
    targeting: "Targeting & Budget Control",
    identity: "User Identity & Privacy",
    data: "Data & DMP",
    attribution: "Attribution Models",
    channels: "Channels & Formats",
    ai: "AI in AdTech",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[60vh] flex flex-col items-center justify-center text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6">
        <BookOpen className="w-10 h-10 text-primary" />
      </div>
      <h2 className="font-display text-3xl font-bold text-foreground mb-2">
        {titles[moduleId] || moduleId}
      </h2>
      <p className="text-muted-foreground max-w-md">
        This interactive learning module is being built. Check out AdTech Basics, Technology Stack, or Media Buying & RTB for now!
      </p>
    </motion.div>
  );
}

export default Index;
