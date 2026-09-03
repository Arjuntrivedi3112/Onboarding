import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye, MousePointer, Target, Shield, Clock, Database, Zap, Globe
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

const reportingMetrics = [
  { metric: "Impressions", description: "Number of times an ad is displayed" },
  { metric: "Clicks", description: "Number of times an ad is clicked" },
  { metric: "Conversions", description: "Number of desired user actions completed" },
  { metric: "Reach", description: "Number of unique visitors or devices reached" },
  { metric: "CTR", description: "Click-through rate — (Clicks ÷ Impressions) × 100" },
  { metric: "CVR", description: "Conversion rate — (Conversions ÷ Clicks) × 100" },
  { metric: "CPM", description: "Cost per mille — cost per 1,000 impressions" },
  { metric: "CPC", description: "Cost per click" },
  { metric: "CPA", description: "Cost per action — cost per conversion" },
  { metric: "Amount spent", description: "Total media cost" },
  { metric: "Revenue", description: "Total conversion value" },
  { metric: "Viewability Rate", description: "% of impressions that were viewable" },
];

const dimensions = [
  "Country", "Device type", "Browser", "Time of day", "Campaign",
  "Line Item", "Creative", "Publisher domain", "OS", "OS version", "Geolocation",
];

const technicalConsiderations = [
  {
    title: "Delays",
    icon: <Clock className="w-5 h-5" />,
    color: "text-amber-500",
    detail:
      "Reports lag behind real-time events. Approximated data may appear within minutes, but accurate data suitable for billing typically takes up to 24 hours.",
  },
  {
    title: "Reporting Time Zone",
    icon: <Globe className="w-5 h-5" />,
    color: "text-primary",
    detail:
      "If two systems operate in different time zones, their reports will not align. Confirm and standardize reporting time zones before comparing data across platforms.",
  },
  {
    title: "Data Retention",
    icon: <Database className="w-5 h-5" />,
    color: "text-purple-500",
    detail:
      "To manage volume, platforms reduce retention or granularity over time: last month at hourly granularity, 1–12 months at daily granularity, and 1 year as campaign-level summaries only.",
  },
];

const discrepancyCauses = [
  {
    group: "Human and Implementation Errors",
    items: [
      "Incorrect or partial pixel placement",
      "Misconfigured macros or missing cache busters",
      "Differences in campaign start/end dates across systems",
    ],
  },
  {
    group: "Configuration Differences",
    items: [
      "Mismatched reporting time zones",
      "Different fraud filters, traffic-validation criteria, or viewability rules",
      "Varying impression-counting methods (pixel-fired vs. server-served)",
    ],
  },
  {
    group: "Client-Side Tracking Limitations",
    items: [
      "Poor connectivity or latency preventing pixel load",
      "JavaScript errors or browser restrictions blocking scripts",
      "URL length limitations truncating redirect paths",
      "Creative file size and resource-heavy pages delaying pixel fires",
    ],
  },
];

export function TrackingModule() {
  const [selectedTracking, setSelectedTracking] = useState<TrackingType>("impression");
  const [campaign, setCampaign] = useState({
    impressions: 1000000,
    clicks: 1500,
    conversions: 10,
    cost: 4000,
    revenue: 5200,
  });
  const [discrepancy, setDiscrepancy] = useState({ publisher: 108000, advertiser: 100000 });

  const currentTracking = trackingMethods.find(t => t.id === selectedTracking)!;

  const safeDiv = (a: number, b: number) => (b > 0 ? a / b : 0);
  const eCPM = safeDiv(campaign.cost, campaign.impressions) * 1000;
  const eCPC = safeDiv(campaign.cost, campaign.clicks);
  const eCPA = safeDiv(campaign.cost, campaign.conversions);
  const ctr = safeDiv(campaign.clicks, campaign.impressions) * 100;
  const cvr = safeDiv(campaign.conversions, campaign.clicks) * 100;
  const roi = safeDiv(campaign.revenue - campaign.cost, campaign.cost) * 100;

  const discrepancyPct =
    safeDiv(discrepancy.publisher - discrepancy.advertiser, discrepancy.advertiser) * 100;
  const withinTolerance = Math.abs(discrepancyPct) <= 10;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Tracking & Reporting
        </h1>
        <p className="text-muted-foreground">
          How could one assess digital advertising campaign performance without tracking and reporting solutions? Learn how impressions, clicks, and conversions are recorded, measured, and reconciled.
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

      {/* Effective Metrics Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">
          Effective Metrics Calculator (eCPM, eCPC, eCPA)
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          "Effective" metrics standardize performance across pricing models, so a CPM campaign can be
          compared against a CPC or CPA one. Change any input below and watch every derived metric
          recalculate.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          {([
            { key: "impressions", label: "Impressions", step: 10000 },
            { key: "clicks", label: "Clicks", step: 100 },
            { key: "conversions", label: "Conversions", step: 5 },
            { key: "cost", label: "Cost ($)", step: 500 },
            { key: "revenue", label: "Revenue ($)", step: 500 },
          ] as const).map((field) => (
            <div key={field.key}>
              <label className="text-xs text-muted-foreground block mb-1.5">{field.label}</label>
              <input
                type="number"
                min={0}
                step={field.step}
                value={campaign[field.key]}
                onChange={(e) =>
                  setCampaign((c) => ({ ...c, [field.key]: Math.max(0, Number(e.target.value) || 0) }))
                }
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "eCPM", value: `$${eCPM.toFixed(2)}`, formula: "(spend ÷ impressions) × 1,000" },
            { label: "eCPC", value: `$${eCPC.toFixed(2)}`, formula: "spend ÷ clicks" },
            { label: "eCPA", value: `$${eCPA.toFixed(2)}`, formula: "spend ÷ conversions" },
            { label: "CTR", value: `${ctr.toFixed(2)}%`, formula: "(clicks ÷ impressions) × 100" },
            { label: "CVR", value: `${cvr.toFixed(2)}%`, formula: "(conversions ÷ clicks) × 100" },
            { label: "ROI", value: `${roi >= 0 ? "+" : ""}${roi.toFixed(1)}%`, formula: "(revenue − spend) ÷ spend" },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-lg bg-card border border-border">
              <p className="text-xs text-muted-foreground">{item.label}</p>
              <p className={cn(
                "text-lg font-bold",
                item.label === "ROI" ? (roi >= 0 ? "text-green-500" : "text-destructive") : "text-primary"
              )}>
                {item.value}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 leading-tight">{item.formula}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mt-4">
          Note: ROI here excludes operational costs — important for physical goods, less relevant for
          digital products with low marginal costs. Effective metrics also let publishers
          retroactively evaluate what revenue would have looked like under a different pricing model.
        </p>
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

      {/* Dimensions & Filtering */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold mb-2">Dimensions & Subdimensions</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Dimensions are the attributes used to break down and analyse data. Subdimensions (or
            drill-downs) allow progressively deeper breakdowns.
          </p>
          <div className="flex flex-wrap gap-2 mb-4">
            {dimensions.map((d) => (
              <span
                key={d}
                className="px-2.5 py-1 rounded-md bg-card border border-border text-xs text-muted-foreground"
              >
                {d}
              </span>
            ))}
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground mb-2">Example drill-down:</p>
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              {["Country", "Carrier", "Line Item", "Ad"].map((level, i, arr) => (
                <span key={level} className="flex items-center gap-1.5">
                  <span className="text-primary font-medium">{level}</span>
                  {i < arr.length - 1 && <span className="text-muted-foreground">→</span>}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="glass rounded-xl p-6">
          <h2 className="font-display text-lg font-semibold mb-2">Filtering</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Filtering — also called segmentation — narrows the dataset used in a report to focus on
            specific criteria or dimensions. Include/exclude filters allow even more precise
            segmentation.
          </p>
          <div className="space-y-3">
            {[
              { label: "Date range", example: "1 Jan – 31 Jan" },
              { label: "Campaign hierarchy", example: "advertiser → IO → line item → ad" },
              { label: "Geographic or technical", example: "country = Poland OR Germany" },
            ].map((f) => (
              <div key={f.label} className="p-3 rounded-lg bg-card border border-border">
                <p className="text-sm font-medium text-foreground">{f.label}</p>
                <p className="text-xs text-muted-foreground font-mono mt-0.5">{f.example}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Technical Considerations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">
          Technical Considerations of Reporting
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          Several technical variables affect the accuracy and interpretation of reporting data.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {technicalConsiderations.map((item) => (
            <div key={item.title} className="p-4 rounded-xl bg-card border border-border">
              <div className={cn("flex items-center gap-2 mb-2", item.color)}>
                {item.icon}
                <h3 className="font-semibold text-foreground text-sm">{item.title}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Discrepancy Calculator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Discrepancies: Trust, But Verify</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Discrepancies are differences in reported metrics between systems — usually between
          publisher and advertiser reports. They directly affect billing accuracy and trust, and most
          stem from technical or implementation issues in client-side tracking.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Publisher impressions
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discrepancy.publisher}
                  onChange={(e) =>
                    setDiscrepancy((d) => ({ ...d, publisher: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1.5">
                  Advertiser impressions
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={discrepancy.advertiser}
                  onChange={(e) =>
                    setDiscrepancy((d) => ({ ...d, advertiser: Math.max(0, Number(e.target.value) || 0) }))
                  }
                  className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground font-mono mb-4">
              (publisher − advertiser) ÷ advertiser × 100
            </p>
          </div>

          <div
            className={cn(
              "p-5 rounded-xl border flex flex-col justify-center",
              withinTolerance
                ? "bg-green-500/10 border-green-500/30"
                : "bg-destructive/10 border-destructive/30"
            )}
          >
            <p className="text-xs text-muted-foreground mb-1">Discrepancy</p>
            <p
              className={cn(
                "text-3xl font-bold mb-2",
                withinTolerance ? "text-green-500" : "text-destructive"
              )}
            >
              {discrepancyPct >= 0 ? "+" : ""}
              {discrepancyPct.toFixed(1)}%
            </p>
            <p className="text-sm text-muted-foreground">
              {withinTolerance
                ? "Within the IAB-recommended 10% tolerance — the publisher's data is typically accepted for billing."
                : "Outside the IAB-recommended 10% tolerance — this requires investigation and reconciliation before billing."}
            </p>
          </div>
        </div>

        <h3 className="font-semibold text-foreground mb-3">Common Causes</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {discrepancyCauses.map((cause, i) => (
            <div key={cause.group} className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {i + 1}
                </span>
                <h4 className="font-semibold text-foreground text-sm">{cause.group}</h4>
              </div>
              <ul className="space-y-1.5">
                {cause.items.map((item) => (
                  <li key={item} className="text-xs text-muted-foreground flex gap-2">
                    <span className="text-muted-foreground/50">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-muted/50">
          <h4 className="font-semibold text-foreground text-sm mb-1">Reconciliation</h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Reconciliation is the process of comparing datasets from multiple systems to resolve
            reporting inconsistencies. In AdOps this is often a manual process — pulling reports from
            both the publisher and advertiser systems, comparing them at a matching level of
            granularity, and agreeing on which number is used for billing.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
