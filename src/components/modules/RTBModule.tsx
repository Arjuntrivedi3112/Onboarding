import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Pause, RotateCcw, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuctionStep {
  id: number;
  title: string;
  description: string;
  duration: number;
  actors: string[];
}

const auctionSteps: AuctionStep[] = [
  {
    id: 1,
    title: "User Visits Page",
    description: "A user loads a webpage with an ad slot available",
    duration: 10,
    actors: ["user", "publisher"],
  },
  {
    id: 2,
    title: "Ad Request Sent",
    description: "Publisher's SSP sends bid request to ad exchange",
    duration: 5,
    actors: ["publisher", "ssp", "exchange"],
  },
  {
    id: 3,
    title: "DSPs Receive Request",
    description: "Multiple DSPs receive the bid request simultaneously",
    duration: 10,
    actors: ["exchange", "dsp1", "dsp2", "dsp3"],
  },
  {
    id: 4,
    title: "DSPs Evaluate & Bid",
    description: "Each DSP checks audience data and submits a bid",
    duration: 25,
    actors: ["dsp1", "dsp2", "dsp3"],
  },
  {
    id: 5,
    title: "Auction Conducted",
    description: "Exchange runs second-price auction, picks winner",
    duration: 5,
    actors: ["exchange"],
  },
  {
    id: 6,
    title: "Winner Notified",
    description: "Winning DSP receives notification with clearing price",
    duration: 5,
    actors: ["exchange", "dsp1"],
  },
  {
    id: 7,
    title: "Creative Served",
    description: "Ad server delivers the creative to user's browser",
    duration: 20,
    actors: ["dsp1", "adserver", "user"],
  },
  {
    id: 8,
    title: "Impression Logged",
    description: "Tracking pixel fires, impression counted",
    duration: 20,
    actors: ["user", "tracking"],
  },
];

interface Bid {
  dsp: string;
  bid: number;
  color: string;
}

const dspBids: Bid[] = [
  { dsp: "DSP Alpha", bid: 4.50, color: "from-cyan-400 to-blue-500" },
  { dsp: "DSP Beta", bid: 3.80, color: "from-purple-400 to-pink-500" },
  { dsp: "DSP Gamma", bid: 2.90, color: "from-green-400 to-emerald-500" },
];

export function RTBModule() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [showBids, setShowBids] = useState(false);

  const totalDuration = auctionSteps.reduce((acc, step) => acc + step.duration, 0);

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setElapsedMs((prev) => {
        const next = prev + 1;
        
        // Calculate which step we should be on
        let accumulated = 0;
        for (let i = 0; i < auctionSteps.length; i++) {
          accumulated += auctionSteps[i].duration;
          if (next <= accumulated) {
            setCurrentStep(i);
            break;
          }
        }

        // Show bids during step 4
        if (currentStep === 3) {
          setShowBids(true);
        }

        if (next >= totalDuration) {
          setIsPlaying(false);
          return totalDuration;
        }
        return next;
      });
    }, 10); // 10ms intervals for smooth animation

    return () => clearInterval(interval);
  }, [isPlaying, currentStep, totalDuration]);

  const reset = () => {
    setCurrentStep(0);
    setElapsedMs(0);
    setIsPlaying(false);
    setShowBids(false);
  };

  const winningBid = dspBids.reduce((a, b) => (a.bid > b.bid ? a : b));
  const secondHighest = dspBids.filter(b => b.dsp !== winningBid.dsp).reduce((a, b) => (a.bid > b.bid ? a : b));

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-foreground mb-2"
        >
          Real-Time Bidding (RTB)
        </motion.h2>
        <p className="text-muted-foreground">
          Watch an entire ad auction happen in under 100 milliseconds
        </p>
      </div>

      {/* Timer and Controls */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={reset}
            className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-muted/80"
          >
            <RotateCcw className="w-4 h-4" />
          </motion.button>
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Auction Progress</span>
            <span className="font-mono text-lg font-bold text-primary">
              {elapsedMs}ms <span className="text-muted-foreground">/ {totalDuration}ms</span>
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              style={{ width: `${(elapsedMs / totalDuration) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30">
          <Zap className="w-4 h-4 text-green-500" />
          <span className="text-sm text-green-500 font-medium">Under 100ms</span>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Timeline */}
        <div className="bg-card border border-border rounded-2xl p-6 overflow-y-auto">
          <h3 className="font-display font-semibold text-lg mb-4">Auction Timeline</h3>
          <div className="space-y-3">
            {auctionSteps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0.5, x: -10 }}
                animate={{
                  opacity: i <= currentStep ? 1 : 0.5,
                  x: 0,
                }}
                className={cn(
                  "flex gap-4 p-3 rounded-lg transition-all",
                  i === currentStep && "bg-primary/10 border border-primary/30",
                  i < currentStep && "opacity-70"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  i < currentStep && "bg-green-500 text-white",
                  i === currentStep && "bg-primary text-primary-foreground animate-pulse",
                  i > currentStep && "bg-muted text-muted-foreground"
                )}>
                  {i < currentStep ? "✓" : step.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium",
                    i === currentStep ? "text-primary" : "text-foreground"
                  )}>
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground">{step.description}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  +{step.duration}ms
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Auction Visualization */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h3 className="font-display font-semibold text-lg mb-4">Live Auction</h3>
          
          {/* DSP Bids */}
          <AnimatePresence>
            {showBids && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3 mb-6"
              >
                {dspBids.map((bid, i) => (
                  <motion.div
                    key={bid.dsp}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.2 }}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-xl border",
                      currentStep >= 5 && bid.dsp === winningBid.dsp
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold",
                      bid.color
                    )}>
                      {bid.dsp.charAt(4)}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{bid.dsp}</p>
                      {currentStep >= 5 && bid.dsp === winningBid.dsp && (
                        <span className="text-xs text-green-500 font-medium">WINNER</span>
                      )}
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: i * 0.2 + 0.3, type: "spring" }}
                      className="text-right"
                    >
                      <p className="text-xl font-bold text-foreground">${bid.bid.toFixed(2)}</p>
                      <p className="text-xs text-muted-foreground">CPM Bid</p>
                    </motion.div>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Auction Result */}
          <AnimatePresence>
            {currentStep >= 5 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30"
              >
                <h4 className="text-sm text-muted-foreground mb-2">Second-Price Auction Result</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Winning Bid</p>
                    <p className="text-2xl font-bold text-foreground">${winningBid.bid.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Clearing Price</p>
                    <p className="text-2xl font-bold text-primary">${(secondHighest.bid + 0.01).toFixed(2)}</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Winner pays second-highest bid + $0.01 = <span className="text-primary font-medium">${(secondHighest.bid + 0.01).toFixed(2)}</span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {!showBids && (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <p>Press play to start the auction simulation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
