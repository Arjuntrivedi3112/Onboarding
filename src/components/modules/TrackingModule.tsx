import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, MousePointer, Target, BarChart3, 
  Shield, Clock, Database, Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

type TrackingType = "impression" | "click" | "conversion" | "viewability";

interface TrackingMethod {
  id: TrackingType;
  title: string;
  icon: React.ReactNode;
  definition: string;
  howItWorks: string[];
  example: string;
  color: string;
}

const trackingMethods: TrackingMethod[] = [
  {
    id: "impression",
    title: "Impression Tracking",
    icon: <Eye className="w-5 h-5" />,
    definition: "An impression is recorded each time an ad is displayed to a user. If a user refreshes and sees the same ad, that's two impressions.",
    color: "from-blue-500 to-cyan-500",
    howItWorks: [
      "Ad server returns ad markup with a 1×1 transparent pixel",
      "Browser renders the ad and loads the impression pixel",
      "Pixel request is logged by the ad server",
      "Impression is counted and attributed to the campaign",
    ],
    example: "Impression pixels ensure ads are counted when actually displayed, not just when selected by the server.",
  },
  {
    id: "click",
    title: "Click Tracking",
    icon: <MousePointer className="w-5 h-5" />,
    definition: "A click is counted when someone clicks on an ad, even if they don't reach the advertiser's website.",
    color: "from-green-500 to-emerald-500",
    howItWorks: [
      "User clicks on the ad creative",
      "Click is routed through a redirect URL (click tracker)",
      "Click tracker logs the event and records metadata",
      "User is redirected to the landing page",
    ],
    example: "Click trackers often chain: Publisher tracker → Advertiser tracker → Landing page. Each logs the click independently.",
  },
  {
    id: "conversion",
    title: "Conversion Tracking",
    icon: <Target className="w-5 h-5" />,
    definition: "A conversion occurs when a user completes a predefined goal like a purchase, signup, or download after interacting with an ad.",
    color: "from-purple-500 to-pink-500",
    howItWorks: [
      "User clicks ad and is cookied with a unique identifier",
      "User completes goal action on advertiser's site",
      "Conversion pixel fires on the success/thank-you page",
      "Pixel links conversion back to the original ad click/view",
    ],
    example: "CTC (Click-Through Conversion) = user clicked ad then converted. VTC (View-Through Conversion) = user saw ad but didn't click, then converted later.",
  },
  {
    id: "viewability",
    title: "Viewability & Verification",
    icon: <Shield className="w-5 h-5" />,
    definition: "Viewability measures whether an ad was actually visible to a human (not hidden or seen by bots).",
    color: "from-amber-500 to-orange-500",
    howItWorks: [
      "Verification vendor JavaScript runs alongside the ad",
      "Script measures if ad is in viewport (above the fold)",
      "Checks for bot traffic and fraudulent activity",
      "Reports brand safety (appropriate content context)",
    ],
    example: "IAB standard: Display ad is viewable if 50% of pixels are visible for 1 second. Video requires 50% visible for 2 seconds.",
  },
];

const attributionModels = [
  { name: "Last Click", description: "100% credit to final touchpoint", visual: [0, 0, 0, 100] },
  { name: "First Click", description: "100% credit to first touchpoint", visual: [100, 0, 0, 0] },
  { name: "Linear", description: "Equal credit to all touchpoints", visual: [25, 25, 25, 25] },
  { name: "Time Decay", description: "More credit to recent touches", visual: [10, 20, 30, 40] },
  { name: "Position-Based", description: "40% first, 40% last, 20% middle", visual: [40, 10, 10, 40] },
];

const reportingMetrics = [
  { metric: "Impressions", description: "Total times ad was displayed" },
  { metric: "Clicks", description: "Total clicks on the ad" },
  { metric: "CTR", description: "Click-through rate (Clicks ÷ Impressions × 100)" },
  { metric: "Conversions", description: "Goal completions attributed to the ad" },
  { metric: "CVR", description: "Conversion rate (Conversions ÷ Clicks × 100)" },
  { metric: "CPA", description: "Cost per acquisition (Spend ÷ Conversions)" },
  { metric: "ROAS", description: "Return on ad spend (Revenue ÷ Spend)" },
  { metric: "Viewability Rate", description: "% of impressions that were viewable" },
];

export function TrackingModule() {
  const [selectedTracking, setSelectedTracking] = useState<TrackingType>("impression");
  const [selectedAttribution, setSelectedAttribution] = useState("Last Click");

  const currentTracking = trackingMethods.find(t => t.id === selectedTracking)!;
  const currentAttribution = attributionModels.find(a => a.name === selectedAttribution)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Tracking & Attribution
        </h1>
        <p className="text-muted-foreground">
          How could one assess digital advertising campaign performance without tracking and reporting solutions? Learn how impressions, clicks, and conversions are recorded and attributed.
        </p>
      </motion.div>

      {/* Tracking Methods Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {trackingMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedTracking(method.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              selectedTracking === method.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {method.icon}
            <span className="font-medium">{method.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Selected Tracking Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedTracking}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              currentTracking.color
            )}>
              {currentTracking.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{currentTracking.title}</h2>
              <p className="text-muted-foreground">{currentTracking.definition}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How It Works */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
              <ol className="space-y-3">
                {currentTracking.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Visual Flow */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Technical Note</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {currentTracking.example}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-xs text-primary">Happens in milliseconds</span>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Attribution Models */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Attribution Models</h2>
        <p className="text-muted-foreground mb-6">
          Attribution determines how credit for conversions is distributed across touchpoints in the customer journey.
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {attributionModels.map((model) => (
            <button
              key={model.name}
              onClick={() => setSelectedAttribution(model.name)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-all",
                selectedAttribution === model.name
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {model.name}
            </button>
          ))}
        </div>

        {/* Attribution Visual */}
        <div className="bg-muted/50 rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">{currentAttribution.name}</span>
            <span className="text-xs text-muted-foreground">{currentAttribution.description}</span>
          </div>

          {/* Journey visualization */}
          <div className="flex items-center gap-2 mb-4">
            {["Display Ad", "Social Ad", "Email", "Search Ad"].map((touch, i) => (
              <div key={touch} className="flex-1 flex items-center">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1 text-center">{touch}</div>
                  <div className="h-8 bg-muted rounded relative overflow-hidden">
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary to-accent"
                      animate={{ width: `${currentAttribution.visual[i]}%` }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                      {currentAttribution.visual[i]}%
                    </span>
                  </div>
                </div>
                {i < 3 && <div className="w-4 h-px bg-border mx-1" />}
              </div>
            ))}
          </div>

          <div className="text-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
              <Target className="w-4 h-4" />
              Conversion
            </span>
          </div>
        </div>
      </motion.div>

      {/* Reporting Metrics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Key Reporting Metrics</h2>
        <p className="text-muted-foreground mb-6">
          For every impression, click, and conversion, the AdTech platform stores data attributes and aggregates them into these key metrics.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportingMetrics.map((item, i) => (
            <motion.div
              key={item.metric}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + i * 0.05 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <h3 className="font-semibold text-primary mb-1">{item.metric}</h3>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Tracking Methods Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            Pixel Method
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Uses tracking pixels (1×1 images) that fire on specific events
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">Easy to implement</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">Works in web browsers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">⚠</span>
              <span className="text-muted-foreground">Blocked by some ad blockers</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            Server-Side Method
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Uses backend API calls to transmit tracking data directly
          </p>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">Not affected by ad blockers</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span className="text-muted-foreground">Better for mobile app tracking</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-500">⚠</span>
              <span className="text-muted-foreground">Requires more technical setup</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
