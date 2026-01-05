import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight,
  Server,
  Database,
  Globe,
  Users,
  Building2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TechComponent {
  id: string;
  name: string;
  fullName: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  whatIs: string;
  whyExists: string;
  dataFlow: string;
}

const techComponents: TechComponent[] = [
  {
    id: "dsp",
    name: "DSP",
    fullName: "Demand-Side Platform",
    icon: <Building2 className="w-6 h-6" />,
    color: "from-cyan-400 to-blue-500",
    description: "Buy ad inventory programmatically",
    whatIs: "A DSP is software that allows advertisers and agencies to purchase display, video, mobile, and search ads automatically. It connects to multiple ad exchanges and SSPs.",
    whyExists: "Before DSPs, media buyers had to manually negotiate with each publisher. DSPs automate this, enabling real-time bidding on millions of impressions per second.",
    dataFlow: "Receives bid requests → Checks audience data from DMP → Calculates optimal bid → Submits bid to exchange → Receives win notification → Serves creative",
  },
  {
    id: "ssp",
    name: "SSP",
    fullName: "Supply-Side Platform",
    icon: <Layers className="w-6 h-6" />,
    color: "from-emerald-400 to-green-500",
    description: "Sell ad inventory efficiently",
    whatIs: "An SSP helps publishers manage, sell, and optimize their ad inventory. It connects to multiple ad exchanges and DSPs to maximize revenue.",
    whyExists: "Publishers needed a way to sell remnant inventory programmatically and get the best price. SSPs create competition among buyers and set floor prices.",
    dataFlow: "Receives ad request from publisher → Creates bid request → Sends to exchanges → Collects bids → Runs auction → Returns winning ad to publisher",
  },
  {
    id: "exchange",
    name: "Ad Exchange",
    fullName: "Ad Exchange",
    icon: <Globe className="w-6 h-6" />,
    color: "from-purple-400 to-pink-500",
    description: "Marketplace for real-time trading",
    whatIs: "An ad exchange is a technology platform that facilitates the buying and selling of ad inventory from multiple ad networks. It operates like a stock exchange for ads.",
    whyExists: "Creates liquidity and transparency. Connects thousands of buyers and sellers in real-time, ensuring fair market pricing through auction mechanisms.",
    dataFlow: "Receives bid requests from SSPs → Broadcasts to connected DSPs → Collects bids → Determines winner via auction → Notifies winner → Facilitates creative delivery",
  },
  {
    id: "dmp",
    name: "DMP",
    fullName: "Data Management Platform",
    icon: <Database className="w-6 h-6" />,
    color: "from-amber-400 to-orange-500",
    description: "Collect and segment audience data",
    whatIs: "A DMP collects, organizes, and activates first, second, and third-party audience data. It creates segments that can be used for targeting.",
    whyExists: "Advertisers need to understand their audience. DMPs unify data from multiple sources to create actionable segments for precise targeting.",
    dataFlow: "Collects user data → Normalizes and enriches → Creates segments → Syncs with DSPs → Enables targeted bidding → Measures and optimizes",
  },
  {
    id: "adserver",
    name: "Ad Server",
    fullName: "Ad Server",
    icon: <Server className="w-6 h-6" />,
    color: "from-rose-400 to-red-500",
    description: "Store and deliver creatives",
    whatIs: "An ad server stores advertising content and delivers it to users. It tracks impressions, clicks, and conversions while managing ad rotation and targeting.",
    whyExists: "Centralizes creative management, enables A/B testing, provides unified reporting, and ensures ads are served correctly across all campaigns.",
    dataFlow: "Stores creatives → Receives ad call → Applies targeting rules → Selects best creative → Delivers to user → Logs impression/click data",
  },
  {
    id: "adnetwork",
    name: "Ad Network",
    fullName: "Ad Network",
    icon: <Users className="w-6 h-6" />,
    color: "from-indigo-400 to-violet-500",
    description: "Aggregate inventory from publishers",
    whatIs: "An ad network aggregates ad space from multiple publishers and sells it to advertisers. It acts as an intermediary, often focusing on specific verticals or formats.",
    whyExists: "Small publishers can't attract direct advertisers. Ad networks bundle their inventory and sell at scale, providing access to larger ad budgets.",
    dataFlow: "Collects inventory from publishers → Categorizes and packages → Sells to advertisers → Distributes campaigns → Reports performance",
  },
];

export function TechnologyModule() {
  const [selectedTech, setSelectedTech] = useState<string>("dsp");

  const current = techComponents.find(t => t.id === selectedTech) || techComponents[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-foreground mb-2"
        >
          Core Technology Stack
        </motion.h2>
        <p className="text-muted-foreground">
          Explore the platforms that power programmatic advertising
        </p>
      </div>

      {/* Technology Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {techComponents.map((tech, i) => (
          <motion.button
            key={tech.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedTech(tech.id)}
            className={cn(
              "p-4 rounded-xl text-center transition-all duration-300 border",
              selectedTech === tech.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              tech.color
            )}>
              {tech.icon}
            </div>
            <p className={cn(
              "font-bold text-lg",
              selectedTech === tech.id ? "text-primary" : "text-foreground"
            )}>
              {tech.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {tech.description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Detail View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* What Is It */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                current.color
              )}>
                {current.icon}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{current.fullName}</h3>
                <p className="text-xs text-muted-foreground">{current.name}</p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-primary mb-2">What Is It?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.whatIs}
            </p>
          </div>

          {/* Why It Exists */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-accent mb-2">Why Does It Exist?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {current.whyExists}
            </p>
            <h4 className="text-sm font-semibold text-green-500 mb-2">Data Flow</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.dataFlow}
            </p>
          </div>

          {/* Visual Flow */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <h4 className="text-sm font-semibold text-foreground mb-4">In The Ecosystem</h4>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                {current.id === "dsp" && (
                  <>
                    <FlowNode label="Advertiser" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DSP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" small />
                  </>
                )}
                {current.id === "ssp" && (
                  <>
                    <FlowNode label="Publisher" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="SSP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" small />
                  </>
                )}
                {current.id === "exchange" && (
                  <>
                    <FlowNode label="DSPs" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="SSPs" small />
                  </>
                )}
                {current.id === "dmp" && (
                  <>
                    <FlowNode label="Data Sources" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DMP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DSP" small />
                  </>
                )}
                {current.id === "adserver" && (
                  <>
                    <FlowNode label="Creatives" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Ad Server" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="User" small />
                  </>
                )}
                {current.id === "adnetwork" && (
                  <>
                    <FlowNode label="Publishers" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Network" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Advertisers" small />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function FlowNode({ 
  label, 
  active = false, 
  small = false,
  color = "from-muted to-muted"
}: { 
  label: string; 
  active?: boolean; 
  small?: boolean;
  color?: string;
}) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-xl flex items-center justify-center text-center",
        small ? "w-16 h-16 bg-muted border border-border" : "w-20 h-20",
        active && `bg-gradient-to-br ${color} text-white shadow-lg`
      )}
    >
      <span className={cn(
        "font-medium",
        small ? "text-xs text-muted-foreground" : "text-sm"
      )}>
        {label}
      </span>
    </motion.div>
  );
}
