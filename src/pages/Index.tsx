import { useState } from "react";
import { motion } from "framer-motion";
import { Sidebar } from "@/components/layout/Sidebar";
import { EcosystemMap } from "@/components/ecosystem/EcosystemMap";
import { BasicsModule } from "@/components/modules/BasicsModule";
import { TechnologyModule } from "@/components/modules/TechnologyModule";
import { RTBModule } from "@/components/modules/RTBModule";
import { AdServingModule } from "@/components/modules/AdServingModule";
import { TargetingModule } from "@/components/modules/TargetingModule";
import { ChannelsModule } from "@/components/modules/ChannelsModule";
import { TrackingModule } from "@/components/modules/TrackingModule";
import { IdentityModule } from "@/components/modules/IdentityModule";
import { DataModule } from "@/components/modules/DataModule";
import { AIModule } from "@/components/modules/AIModule";
import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { FileUploadPanel } from "@/components/ai/FileUploadPanel";
import { Rocket, BookOpen, Zap } from "lucide-react";

const Index = () => {
  const [activeModule, setActiveModule] = useState("home");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const handleNodeClick = (nodeId: string) => {
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

  const renderModule = () => {
    switch (activeModule) {
      case "basics": return <BasicsModule />;
      case "technology": return <TechnologyModule />;
      case "mediabuying": return <RTBModule />;
      case "adserving": return <AdServingModule />;
      case "targeting": return <TargetingModule />;
      case "channels": return <ChannelsModule />;
      case "tracking": return <TrackingModule />;
      case "identity": return <IdentityModule />;
      case "data": return <DataModule />;
      case "ai": return <AIModule />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onOpenChat={() => setIsChatOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
      />

      <main className="ml-[280px] min-h-screen">
        {activeModule === "home" ? (
          <HomeView onNodeClick={handleNodeClick} />
        ) : (
          <div className="p-8 max-w-7xl mx-auto">
            {renderModule()}
          </div>
        )}
      </main>

      <AIChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
      <FileUploadPanel isOpen={isUploadOpen} onClose={() => setIsUploadOpen(false)} />
    </div>
  );
};

function HomeView({ onNodeClick }: { onNodeClick: (nodeId: string) => void }) {
  return (
    <div className="p-8">
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
          Explore how digital advertising works end-to-end. Click any component to dive deep.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <EcosystemMap onNodeClick={onNodeClick} />
      </motion.div>

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

export default Index;
