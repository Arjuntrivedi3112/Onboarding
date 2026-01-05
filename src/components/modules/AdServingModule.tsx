import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, Server, Zap, Send, Eye, BarChart3, 
  ChevronRight, Play, RotateCcw, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ServingStep {
  id: number;
  title: string;
  description: string;
  detail: string;
  icon: React.ReactNode;
  duration: number; // ms to complete
}

const servingSteps: ServingStep[] = [
  {
    id: 1,
    title: "User Visits Page",
    description: "Browser loads webpage with ad slots",
    detail: "When a user opens a website or app containing ad space, the page begins loading. The ad slot's code (JavaScript or iframe tag) prepares to request an ad.",
    icon: <Globe className="w-5 h-5" />,
    duration: 10,
  },
  {
    id: 2,
    title: "Ad Request Sent",
    description: "Ad tag fires request to ad server",
    detail: "The ad tag sends an ad request to the publisher's ad server. This request contains contextual data: user's location, device type, browser, page content, and any available user identifiers.",
    icon: <Send className="w-5 h-5" />,
    duration: 15,
  },
  {
    id: 3,
    title: "Campaign Matching",
    description: "Ad server evaluates eligible campaigns",
    detail: "The ad server compiles a list of all campaigns assigned to the requested placement. It filters out ineligible campaigns based on targeting criteria, flight dates, and budget caps.",
    icon: <Server className="w-5 h-5" />,
    duration: 20,
  },
  {
    id: 4,
    title: "RTB Auction (Optional)",
    description: "Real-time bidding if programmatic",
    detail: "For programmatic inventory, the SSP sends bid requests to connected DSPs via the ad exchange. Each DSP evaluates the impression and submits a bid. The auction completes in ~50-100ms.",
    icon: <Zap className="w-5 h-5" />,
    duration: 50,
  },
  {
    id: 5,
    title: "Ad Selection",
    description: "Winning creative is chosen",
    detail: "The ad server selects the winning ad based on bid price, targeting match, and priority rules. The selection can be random, weight-based, or auction-determined.",
    icon: <BarChart3 className="w-5 h-5" />,
    duration: 10,
  },
  {
    id: 6,
    title: "Creative Delivery",
    description: "Ad markup returned to browser",
    detail: "The ad server returns ad markup (HTML/JavaScript) containing the link to the creative file on a CDN. The browser renders the ad in the designated ad slot.",
    icon: <Eye className="w-5 h-5" />,
    duration: 20,
  },
  {
    id: 7,
    title: "Impression Tracked",
    description: "Tracking pixels fire for measurement",
    detail: "A 1×1 transparent impression pixel fires, recording the impression. Additional third-party pixels may fire for verification, viewability measurement, and cross-platform tracking.",
    icon: <BarChart3 className="w-5 h-5" />,
    duration: 5,
  },
];

const adServerComponents = [
  {
    name: "Ad Decision Engine",
    description: "Determines which ad gets shown based on targeting, budget, and rules",
    icon: "🧠",
  },
  {
    name: "Inventory Management",
    description: "Tracks available ad spaces across websites, apps, and devices",
    icon: "📦",
  },
  {
    name: "Creative Repository",
    description: "Stores HTML5 banners, video ads, and image assets",
    icon: "🎨",
  },
  {
    name: "Targeting Module",
    description: "Matches user data to campaign criteria for personalization",
    icon: "🎯",
  },
  {
    name: "Delivery Engine",
    description: "Delivers ads via CDN in milliseconds",
    icon: "🚀",
  },
  {
    name: "Tracking System",
    description: "Logs impressions, clicks, viewability, and conversions",
    icon: "📊",
  },
];

export function AdServingModule() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  const totalTime = servingSteps.reduce((acc, step) => acc + step.duration, 0);

  const startSimulation = () => {
    setIsPlaying(true);
    setCurrentStep(0);
    setElapsedTime(0);
    runSteps(0, 0);
  };

  const runSteps = (stepIndex: number, time: number) => {
    if (stepIndex >= servingSteps.length) {
      setIsPlaying(false);
      return;
    }

    setCurrentStep(stepIndex + 1);
    const stepDuration = servingSteps[stepIndex].duration;
    
    // Animate elapsed time
    const startTime = time;
    const endTime = time + stepDuration;
    const animationDuration = Math.max(stepDuration * 20, 300); // Min 300ms for visibility
    const startTs = Date.now();

    const animate = () => {
      const progress = Math.min((Date.now() - startTs) / animationDuration, 1);
      setElapsedTime(startTime + (endTime - startTime) * progress);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setTimeout(() => runSteps(stepIndex + 1, endTime), 200);
      }
    };
    
    requestAnimationFrame(animate);
  };

  const reset = () => {
    setIsPlaying(false);
    setCurrentStep(0);
    setElapsedTime(0);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Ad Serving
        </h1>
        <p className="text-muted-foreground">
          Ad servers are the backbone of digital advertising — determining which ad appears, where, when, and to whom. Follow the journey of an ad from request to display.
        </p>
      </motion.div>

      {/* Simulation Controls */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display text-xl font-semibold mb-1">Ad Serving Simulator</h2>
            <p className="text-sm text-muted-foreground">Watch how ads are served in real-time</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
              <Clock className="w-4 h-4 text-primary" />
              <span className="font-mono text-lg font-bold text-primary">
                {elapsedTime.toFixed(0)}ms
              </span>
              <span className="text-xs text-muted-foreground">/ {totalTime}ms</span>
            </div>
            {!isPlaying ? (
              <button
                onClick={startSimulation}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                <Play className="w-4 h-4" />
                Start
              </button>
            ) : (
              <button
                onClick={reset}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-foreground hover:bg-muted/80 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-muted rounded-full overflow-hidden mb-8">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            style={{ width: `${(elapsedTime / totalTime) * 100}%` }}
          />
        </div>

        {/* Steps Timeline */}
        <div className="space-y-4">
          {servingSteps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isComplete = currentStep > step.id;
            
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={cn(
                  "flex items-start gap-4 p-4 rounded-xl transition-all duration-300",
                  isActive ? "bg-primary/10 border border-primary/30" :
                  isComplete ? "bg-muted/50" : "bg-transparent"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isActive ? "bg-primary text-primary-foreground" :
                  isComplete ? "bg-green-500/20 text-green-500" : "bg-muted text-muted-foreground"
                )}>
                  {step.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-muted-foreground">Step {step.id}</span>
                    <span className="text-xs text-muted-foreground">• {step.duration}ms</span>
                    {isActive && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary-foreground"
                      >
                        Active
                      </motion.span>
                    )}
                  </div>
                  <h3 className={cn(
                    "font-semibold mb-1 transition-colors",
                    isActive ? "text-primary" : isComplete ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <AnimatePresence>
                    {isActive && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-sm text-foreground/80 mt-2 leading-relaxed"
                      >
                        {step.detail}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>
                {index < servingSteps.length - 1 && (
                  <ChevronRight className={cn(
                    "w-5 h-5 shrink-0 transition-colors",
                    isComplete ? "text-green-500" : "text-muted-foreground/30"
                  )} />
                )}
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Ad Server Components */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">The Anatomy of an Ad Server</h2>
        <p className="text-muted-foreground mb-6">
          An ad server runs on a set of tightly integrated systems. Each has a specific job, but together, they power the entire ad delivery process.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {adServerComponents.map((component, index) => (
            <motion.div
              key={component.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              onClick={() => setSelectedComponent(
                selectedComponent === component.name ? null : component.name
              )}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                selectedComponent === component.name
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl">{component.icon}</span>
                <div>
                  <h3 className="font-semibold text-foreground">{component.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{component.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* First-Party vs Third-Party */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="glass rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold mb-3 text-primary">
            First-Party Ad Server
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Used by <strong>publishers</strong> to manage their own ad inventory
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Fills ad slots from direct campaigns and RTB auctions</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Forecasts future inventory availability</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span>Provides billing reports and earnings tracking</span>
            </li>
          </ul>
        </div>

        <div className="glass rounded-xl p-6">
          <h3 className="font-display text-lg font-semibold mb-3 text-accent">
            Third-Party Ad Server
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Used by <strong>advertisers</strong> to track campaigns across publishers
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Tracks performance across all publishers in one system</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Measures campaign reach and co-viewership</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span>Verifies publisher-reported data for billing</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
