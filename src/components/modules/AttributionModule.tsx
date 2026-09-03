import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, Link as LinkIcon, Clock, MapPin, QrCode, MessageSquareText,
  Radio, Smartphone, Fingerprint, Network, Plus, X, RotateCcw,
  Globe, Search, Mail, MousePointer, Share2, ArrowRight, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TouchKind = "display" | "social" | "search" | "email" | "direct";

interface Touchpoint {
  id: string;
  channel: string;
  kind: TouchKind;
  daysAgo: number;
}

const kindMeta: Record<TouchKind, { icon: React.ReactNode; color: string }> = {
  display: { icon: <MousePointer className="w-4 h-4" />, color: "from-blue-500 to-cyan-500" },
  social: { icon: <Share2 className="w-4 h-4" />, color: "from-purple-500 to-pink-500" },
  search: { icon: <Search className="w-4 h-4" />, color: "from-amber-500 to-orange-500" },
  email: { icon: <Mail className="w-4 h-4" />, color: "from-green-500 to-emerald-500" },
  direct: { icon: <Globe className="w-4 h-4" />, color: "from-slate-400 to-slate-600" },
};

const defaultJourney: Touchpoint[] = [
  { id: "t1", channel: "Display Ad", kind: "display", daysAgo: 12 },
  { id: "t2", channel: "Social Ad", kind: "social", daysAgo: 8 },
  { id: "t3", channel: "Email", kind: "email", daysAgo: 3 },
  { id: "t4", channel: "Direct Visit", kind: "direct", daysAgo: 0 },
];

const palette: { channel: string; kind: TouchKind }[] = [
  { channel: "Display Ad", kind: "display" },
  { channel: "Social Ad", kind: "social" },
  { channel: "Paid Search", kind: "search" },
  { channel: "Email", kind: "email" },
  { channel: "Direct Visit", kind: "direct" },
];

type ModelId =
  | "last-click" | "last-non-direct" | "first-click"
  | "linear" | "time-decay" | "position" | "custom";

interface AttributionModel {
  id: ModelId;
  name: string;
  summary: string;
  detail: string;
  caveat: string;
}

const models: AttributionModel[] = [
  {
    id: "last-click",
    name: "Last Click",
    summary: "100% credit to the final touchpoint",
    detail:
      "Also called last interaction or last touchpoint. The oldest model, and still the default in many web analytics, MarTech, and AdTech platforms. All credit goes to the final known referral, click, or traffic source before the conversion — even if that was a direct visit.",
    caveat:
      "Ignores every other touchpoint in the journey, which can lead to poor decisions about which channels to optimize.",
  },
  {
    id: "last-non-direct",
    name: "Last Non-Direct",
    summary: "100% credit to the last touchpoint that wasn't direct",
    detail:
      "Identical to last click, except direct visits are removed from the equation. If a user clicks a Facebook link, leaves, then later types your URL directly and converts, the direct visit is skipped and Facebook gets 100% of the credit.",
    caveat:
      "A slight improvement over last click, but it still overlooks every other touchpoint in the journey.",
  },
  {
    id: "first-click",
    name: "First Click",
    summary: "100% credit to the first touchpoint",
    detail:
      "Also called first interaction or first touch. Assigns all credit to the first click or referrer that started the customer journey — useful for understanding which channels create awareness.",
    caveat:
      "Ignores everything that actually closed the sale, over-rewarding top-of-funnel channels.",
  },
  {
    id: "linear",
    name: "Linear",
    summary: "Credit split evenly across all touchpoints",
    detail:
      "Every touchpoint in the journey receives an identical share of the conversion credit, regardless of position or timing.",
    caveat:
      "Values every touchpoint equally, which is rarely the case in reality — but it's useful for getting an overview of the journey.",
  },
  {
    id: "time-decay",
    name: "Time Decay",
    summary: "Recent touchpoints earn more credit",
    detail:
      "A variation of the linear model. The touchpoint closest in time to the conversion receives the most credit, and earlier interactions get progressively less — the farther a touchpoint sits from the conversion, the more its influence decays. This simulator uses a 7-day half-life.",
    caveat:
      "Assumes the most recent touchpoints were the ones that persuaded the user, which may or may not be true.",
  },
  {
    id: "position",
    name: "Position Based",
    summary: "40% first, 40% last, 20% shared by the middle",
    detail:
      "Weights the two interactions that usually matter most — the one that introduced the brand and the one that closed the conversion — while still acknowledging the touchpoints in between.",
    caveat:
      "Often a good default for advertisers: it shows the whole journey while crediting the two most important interactions.",
  },
  {
    id: "custom",
    name: "Custom",
    summary: "Advertiser-defined rules",
    detail:
      "Some AdTech and MarTech platforms let advertisers set their own attribution rules, accounting for their specific campaign structure, audience, and customer journey. Use the sliders below to define your own first/last weighting.",
    caveat:
      "Every model above applies only to a single device and browser. Measuring across devices requires cross-device attribution.",
  },
];

const TIME_DECAY_HALF_LIFE_DAYS = 7;

function computeCredit(
  touchpoints: Touchpoint[],
  model: ModelId,
  custom: { first: number; last: number }
): number[] {
  const n = touchpoints.length;
  if (n === 0) return [];
  if (n === 1) return [100];

  switch (model) {
    case "last-click":
      return touchpoints.map((_, i) => (i === n - 1 ? 100 : 0));

    case "last-non-direct": {
      let idx = -1;
      for (let i = n - 1; i >= 0; i--) {
        if (touchpoints[i].kind !== "direct") {
          idx = i;
          break;
        }
      }
      if (idx === -1) idx = n - 1;
      return touchpoints.map((_, i) => (i === idx ? 100 : 0));
    }

    case "first-click":
      return touchpoints.map((_, i) => (i === 0 ? 100 : 0));

    case "linear":
      return touchpoints.map(() => 100 / n);

    case "time-decay": {
      const weights = touchpoints.map((t) =>
        Math.pow(0.5, t.daysAgo / TIME_DECAY_HALF_LIFE_DAYS)
      );
      const total = weights.reduce((a, b) => a + b, 0);
      return weights.map((w) => (w / total) * 100);
    }

    case "position": {
      if (n === 2) return [50, 50];
      const middleShare = 20 / (n - 2);
      return touchpoints.map((_, i) => (i === 0 || i === n - 1 ? 40 : middleShare));
    }

    case "custom": {
      if (n === 2) {
        const total = custom.first + custom.last || 1;
        return [(custom.first / total) * 100, (custom.last / total) * 100];
      }
      const remainder = Math.max(0, 100 - custom.first - custom.last);
      const middleShare = remainder / (n - 2);
      return touchpoints.map((_, i) =>
        i === 0 ? custom.first : i === n - 1 ? custom.last : middleShare
      );
    }
  }
}

const referrerTypes = [
  {
    name: "Direct",
    description:
      "The referrer information isn't known. Happens when a user types the URL or uses a bookmark, moves between subdomains, clicks a link in a native app with no UTM parameters, or when referrer data is lost in transit.",
  },
  {
    name: "Organic",
    description:
      "Traffic from search engines like Google, Bing, or DuckDuckGo. Paid search ads are normally classified as campaign traffic instead.",
  },
  {
    name: "Social",
    description: "Visits from social platforms such as Facebook, LinkedIn, X, and YouTube.",
  },
  {
    name: "Website",
    description: "A user clicked a link on another website and landed on the advertiser's site.",
  },
  {
    name: "Campaign",
    description:
      "The landing page URL contains UTM parameters. The referrer field is ignored and the UTMs decide the source — some platforms label these more granularly as paid social or paid search.",
  },
];

const referrerLossRules = [
  { from: "https://", to: "http://", passed: false },
  { from: "http://", to: "https://", passed: true },
  { from: "http://", to: "http://", passed: true },
  { from: "https://", to: "https://", passed: true },
];

const matchingMethods = [
  {
    name: "Deterministic Matching",
    icon: <Fingerprint className="w-5 h-5" />,
    color: "text-green-500",
    description:
      "Relies on common, unique identifiers such as email addresses or phone numbers to accurately recognize and link the same user across devices.",
    accuracy: "High accuracy",
  },
  {
    name: "Probabilistic Matching",
    icon: <Network className="w-5 h-5" />,
    color: "text-amber-500",
    description:
      "Uses non-unique signals — IP addresses, device characteristics, location data — and applies algorithms and statistical modelling to estimate whether two devices belong to the same person.",
    accuracy: "Estimated, larger reach",
  },
  {
    name: "Hybrid Matching",
    icon: <Smartphone className="w-5 h-5" />,
    color: "text-primary",
    description:
      "Combines both: deterministic links form a trusted core, and probabilistic modelling extends that graph to devices with no shared login signal.",
    accuracy: "Balance of scale and precision",
  },
];

const offlineToOnline = [
  {
    name: "Vanity URLs",
    icon: <LinkIcon className="w-5 h-5" />,
    color: "text-primary",
    description:
      "Short, memorable domains created for a campaign (newproduct.com instead of a long UTM-laden URL). Used in OOH, TV, and radio where users can't click. Types: standalone (newproduct.com), subpage (company1.com/new-product), and shortened (sv.ly/newproduct).",
    limitation:
      "Some users search the brand on Google instead of typing the URL, so the conversion gets credited to search rather than the offline campaign.",
  },
  {
    name: "Time-Limited Attribution Windows",
    icon: <Clock className="w-5 h-5" />,
    color: "text-accent",
    description:
      "Analyses the period after a TV or radio spot airs — say 30 minutes — and looks for a lift in web traffic and conversions.",
    limitation:
      "Requires deciding the window duration, isolating exposed from unexposed traffic, and accounting for overlap with other campaigns running at the same time.",
  },
  {
    name: "Online Surveys",
    icon: <MessageSquareText className="w-5 h-5" />,
    color: "text-green-500",
    description:
      "Simply ask users how they found you. Can be placed on the purchase or sign-up confirmation page, as a discreet sidebar pop-up during browsing (often with a coupon incentive), or as an exit pop-up.",
    limitation:
      "Low-tech, but it surfaces insights that no attribution model can capture — at the cost of relying on self-reported answers.",
  },
  {
    name: "Coupons",
    icon: <QrCode className="w-5 h-5" />,
    color: "text-purple-500",
    description:
      "Unique codes printed in direct mail and other physical materials. Issue a distinct coupon per campaign, and per client where possible.",
    limitation:
      "Often more accurate than model-based attribution for print, but only captures users who actually redeem the code.",
  },
  {
    name: "Zip/Postal Codes",
    icon: <MapPin className="w-5 h-5" />,
    color: "text-cyan-500",
    description:
      "Collect ZIP codes from online customers and compare them against the areas a direct mail or OOH campaign covered.",
    limitation:
      "You can't be certain someone in that ZIP saw the ad — best used alongside other models for cross-validation.",
  },
];

const onlineToOffline = [
  {
    name: "Beacons",
    icon: <Radio className="w-5 h-5" />,
    color: "text-primary",
    description:
      "Bluetooth devices placed in brick-and-mortar stores that exchange signals with nearby smartphones and tablets. They can push notifications to devices in range and collect device data, which helps tie online ad clicks and in-app activity to an in-store purchase.",
    limitation: false,
  },
  {
    name: "Zip/Postal Codes at POS",
    icon: <MapPin className="w-5 h-5" />,
    color: "text-accent",
    description:
      "The reverse of the offline-to-online technique: staff ask for a ZIP code at the point of sale, and those codes are matched against the location data in online campaign reports.",
    limitation: true,
  },
];

export function AttributionModule() {
  const [touchpoints, setTouchpoints] = useState<Touchpoint[]>(defaultJourney);
  const [selectedModel, setSelectedModel] = useState<ModelId>("last-click");
  const [customWeights, setCustomWeights] = useState({ first: 50, last: 30 });
  const [scope, setScope] = useState<"inter" | "intra">("inter");

  const model = models.find((m) => m.id === selectedModel)!;
  const credit = computeCredit(touchpoints, selectedModel, customWeights);

  const addTouchpoint = (channel: string, kind: TouchKind) => {
    if (touchpoints.length >= 6) return;
    setTouchpoints((prev) => [
      ...prev,
      {
        id: `t${Date.now()}`,
        channel,
        kind,
        daysAgo: Math.max(0, (prev[prev.length - 1]?.daysAgo ?? 4) - 2),
      },
    ]);
  };

  const removeTouchpoint = (id: string) => {
    setTouchpoints((prev) => (prev.length <= 1 ? prev : prev.filter((t) => t.id !== id)));
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">Attribution</h1>
        <p className="text-muted-foreground">
          Attribution decides which channels and interactions get credit when a user converts.
          Build a customer journey below, switch between models, and watch the credit move.
        </p>
      </motion.div>

      {/* Inter vs Intra channel */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Two Types of Online Attribution</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Attribution is the process of assigning credit for a conversion to the touchpoints that led
          to it. Online-to-online attribution splits into two kinds.
        </p>

        <div className="flex gap-2 mb-4">
          {(["inter", "intra"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-all",
                scope === s
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {s === "inter" ? "Inter-channel" : "Intra-channel"}
            </button>
          ))}
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <p className="text-sm text-muted-foreground mb-4">
            {scope === "inter"
              ? "Inter-channel attribution looks at touchpoints across different channels — a display ad, then a social ad, then a paid search click."
              : "Intra-channel attribution looks at touchpoints within the same channel — three separate display placements before the conversion."}
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            {(scope === "inter"
              ? [
                  { label: "Display", kind: "display" as TouchKind },
                  { label: "Social", kind: "social" as TouchKind },
                  { label: "Paid Search", kind: "search" as TouchKind },
                ]
              : [
                  { label: "Display — Site A", kind: "display" as TouchKind },
                  { label: "Display — Site B", kind: "display" as TouchKind },
                  { label: "Display — Site C", kind: "display" as TouchKind },
                ]
            ).map((item, i, arr) => (
              <div key={item.label} className="flex items-center gap-2">
                <div
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br text-white text-xs font-medium",
                    kindMeta[item.kind].color
                  )}
                >
                  {kindMeta[item.kind].icon}
                  {item.label}
                </div>
                {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
            <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/20 text-green-500 text-xs font-medium">
              <Target className="w-4 h-4" />
              Conversion
            </span>
          </div>
        </div>
      </motion.div>

      {/* Interactive Attribution Simulator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold">Attribution Simulator</h2>
            <p className="text-muted-foreground text-sm">
              Credit below is calculated live from each model's real rules — not a fixed picture.
            </p>
          </div>
          <button
            onClick={() => {
              setTouchpoints(defaultJourney);
              setCustomWeights({ first: 50, last: 30 });
            }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset journey
          </button>
        </div>

        {/* Model picker */}
        <div className="flex flex-wrap gap-2 mb-6">
          {models.map((m) => (
            <button
              key={m.id}
              onClick={() => setSelectedModel(m.id)}
              className={cn(
                "px-4 py-2 rounded-lg border text-sm transition-all",
                selectedModel === m.id
                  ? "bg-primary/10 border-primary/30 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/30"
              )}
            >
              {m.name}
            </button>
          ))}
        </div>

        {/* Journey + credit bars */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-medium text-foreground">{model.name}</span>
            <span className="text-xs text-muted-foreground">{model.summary}</span>
          </div>

          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${touchpoints.length}, minmax(0, 1fr))` }}>
            {touchpoints.map((tp, i) => (
              <div key={tp.id} className="min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs text-muted-foreground truncate">{tp.channel}</span>
                  {touchpoints.length > 1 && (
                    <button
                      onClick={() => removeTouchpoint(tp.id)}
                      className="text-muted-foreground hover:text-destructive shrink-0"
                      aria-label={`Remove ${tp.channel}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="h-10 bg-muted rounded relative overflow-hidden">
                  <motion.div
                    className={cn("absolute inset-y-0 left-0 bg-gradient-to-r", kindMeta[tp.kind].color)}
                    animate={{ width: `${credit[i]}%` }}
                    transition={{ duration: 0.35 }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                    {credit[i].toFixed(1)}%
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 text-center">
                  {tp.daysAgo === 0 ? "conversion day" : `${tp.daysAgo}d before`}
                </p>
              </div>
            ))}
          </div>

          <div className="text-center mt-4">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 text-green-500 text-sm">
              <Target className="w-4 h-4" />
              Conversion
            </span>
          </div>
        </div>

        {/* Custom weight sliders */}
        <AnimatePresence>
          {selectedModel === "custom" && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-card border border-border rounded-lg p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    First touchpoint weight: <span className="text-primary font-medium">{customWeights.first}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customWeights.first}
                    onChange={(e) =>
                      setCustomWeights((w) => ({ ...w, first: Number(e.target.value) }))
                    }
                    className="w-full accent-primary"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-2">
                    Last touchpoint weight: <span className="text-primary font-medium">{customWeights.last}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={customWeights.last}
                    onChange={(e) =>
                      setCustomWeights((w) => ({ ...w, last: Number(e.target.value) }))
                    }
                    className="w-full accent-primary"
                  />
                </div>
                <p className="text-xs text-muted-foreground md:col-span-2">
                  The remaining {Math.max(0, 100 - customWeights.first - customWeights.last)}% is
                  shared evenly across the middle touchpoints.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Add touchpoints */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground mr-1">Add a touchpoint:</span>
          {palette.map((p) => (
            <button
              key={p.channel}
              onClick={() => addTouchpoint(p.channel, p.kind)}
              disabled={touchpoints.length >= 6}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Plus className="w-3 h-3" />
              {p.channel}
            </button>
          ))}
        </div>

        {/* Model explanation */}
        <AnimatePresence mode="wait">
          <motion.div
            key={model.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
          >
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-2">How it works</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.detail}</p>
            </div>
            <div className="p-4 rounded-lg bg-card border border-border">
              <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                What to watch out for
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{model.caveat}</p>
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* How online attribution works — referrers */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">How Online Attribution Works</h2>
        <p className="text-muted-foreground text-sm mb-6">
          The simplest way to identify where a user came from is the <code className="text-primary">Referrer</code>{" "}
          field in the HTTP protocol, included with every browser request sent to a web server.
        </p>

        <div className="bg-card border border-border rounded-lg p-4 mb-6 overflow-x-auto">
          <pre className="text-xs text-muted-foreground font-mono leading-relaxed">
{`GET / HTTP/1.1
Host: avenga.com
DNT: 1
Accept-Language: en-us
Accept-Encoding: gzip, deflate
`}<span className="text-primary">{`Referrer: http://publisher1.com/article-about-adtech.html`}</span>{`
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6)`}
          </pre>
          <p className="text-xs text-muted-foreground mt-3">
            Here the user was reading an article on publisher1.com, clicked a link or ad, and was
            directed to avenga.com.
          </p>
        </div>

        <h3 className="font-semibold text-foreground mb-3">Referrer Classifications</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
          {referrerTypes.map((r) => (
            <div key={r.name} className="p-4 rounded-lg bg-card border border-border">
              <h4 className="font-semibold text-primary mb-1 text-sm">{r.name}</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">{r.description}</p>
            </div>
          ))}
        </div>

        <h3 className="font-semibold text-foreground mb-3">When Is the Referrer Lost?</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">HTTP Protocol</th>
                <th className="text-left py-2 px-3 text-muted-foreground font-medium">Referrer Passed or Lost?</th>
              </tr>
            </thead>
            <tbody>
              {referrerLossRules.map((rule) => (
                <tr key={`${rule.from}-${rule.to}`} className="border-b border-border/50">
                  <td className="py-2 px-3 font-mono text-xs text-foreground">
                    {rule.from} to {rule.to}
                  </td>
                  <td className="py-2 px-3">
                    <span className={cn("text-xs font-medium", rule.passed ? "text-green-500" : "text-destructive")}>
                      {rule.passed ? "Referrer passed" : "Referrer lost"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Since most websites now use https://, referrer loss between sites is far less of a concern
          than it once was.
        </p>
      </motion.div>

      {/* Cross-device attribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Cross-Device Attribution</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Platforms traditionally rely on third-party cookies for attribution — but a cookie is tied
          to a single device and browser, so it can't follow a user from phone to laptop. Bridging
          that gap requires matching.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {matchingMethods.map((m) => (
            <div key={m.name} className="p-4 rounded-lg bg-card border border-border">
              <div className={cn("flex items-center gap-2 mb-2", m.color)}>
                {m.icon}
                <h3 className="font-semibold text-foreground text-sm">{m.name}</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{m.description}</p>
              <span className={cn("text-[10px] px-2 py-1 rounded-full bg-muted", m.color)}>
                {m.accuracy}
              </span>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-lg bg-card border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Network className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Identity & Device Graphs</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed mb-3">
            AdTech and MarTech companies build user profiles containing these identifiers and
            signals, then connect them through an identity or device graph — a data structure that
            maps the relationships between users, devices, and browsers.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="text-xs font-semibold text-foreground mb-1">Walled Gardens</h4>
              <p className="text-xs text-muted-foreground">
                Cross-device attribution is significantly easier — they hold deterministic data
                (login information, account IDs) and users tend to stay logged in across devices.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <h4 className="text-xs font-semibold text-foreground mb-1">Independent Platforms</h4>
              <p className="text-xs text-muted-foreground">
                Brands, agencies, and independent AdTech rely on DMPs to unify fragmented data —
                aggregating online and offline sources, building profiles, and constructing the
                identity graphs used for targeting, measurement, and attribution.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Offline to online */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Offline-to-Online Attribution</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Connecting offline exposure — direct mail, OOH and DOOH, telemarketing, TV, radio — to
          online visits and conversions.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {offlineToOnline.map((method) => (
            <div key={method.name} className="p-4 rounded-xl bg-card border border-border">
              <div className={cn("flex items-center gap-2 mb-2", method.color)}>
                {method.icon}
                <h3 className="font-semibold text-foreground">{method.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                {method.description}
              </p>
              <div className="flex items-start gap-2 pt-3 border-t border-border">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">{method.limitation}</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Online to offline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-2">Online-to-Offline Attribution</h2>
        <p className="text-muted-foreground text-sm mb-6">
          The reverse problem: attributing online activity such as ad views and clicks to a purchase
          made in a physical store.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {onlineToOffline.map((method) => (
            <div key={method.name} className="p-4 rounded-xl bg-card border border-border">
              <div className={cn("flex items-center gap-2 mb-2", method.color)}>
                {method.icon}
                <h3 className="font-semibold text-foreground">{method.name}</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{method.description}</p>
              {method.limitation && (
                <div className="flex items-start gap-2 pt-3 mt-3 border-t border-border">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Like its offline-to-online counterpart, this isn't highly accurate — treat it as a
                    supplementary signal alongside other attribution methods.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
