import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  MousePointer, 
  Eye, 
  ShoppingCart, 
  DollarSign,
  Monitor,
  Layers,
  Image,
  ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Concept {
  id: string;
  title: string;
  icon: React.ReactNode;
  shortDesc: string;
  fullDesc: string;
  visual: React.ReactNode;
}

const concepts: Concept[] = [
  {
    id: "adslot",
    title: "Ad Slot vs Ad Space",
    icon: <Layers className="w-5 h-5" />,
    shortDesc: "Container vs opportunity",
    fullDesc: "An Ad Slot is the physical container on a webpage where an ad can appear. Ad Space refers to the available inventory of these slots. Think of slots as parking spaces, and space as the total parking lot capacity.",
    visual: <AdSlotVisual />,
  },
  {
    id: "impression",
    title: "Impression",
    icon: <Eye className="w-5 h-5" />,
    shortDesc: "Ad was loaded",
    fullDesc: "An impression is counted when an ad is fetched and rendered on a user's device. It doesn't mean the user saw it—just that it was loaded. Viewable impressions require at least 50% of the ad to be visible for 1+ second.",
    visual: <ImpressionVisual />,
  },
  {
    id: "click",
    title: "Click",
    icon: <MousePointer className="w-5 h-5" />,
    shortDesc: "User interacted",
    fullDesc: "A click occurs when a user actively engages with an ad by clicking on it. Click-through rate (CTR) = Clicks ÷ Impressions. Industry average CTR is around 0.1-0.3%.",
    visual: <ClickVisual />,
  },
  {
    id: "conversion",
    title: "Conversion",
    icon: <ShoppingCart className="w-5 h-5" />,
    shortDesc: "Goal achieved",
    fullDesc: "A conversion is when a user completes a desired action after clicking an ad—like making a purchase, signing up, or downloading an app. This is what advertisers ultimately pay for.",
    visual: <ConversionVisual />,
  },
  {
    id: "pricing",
    title: "CPM vs CPC vs CPA",
    icon: <DollarSign className="w-5 h-5" />,
    shortDesc: "Pricing models",
    fullDesc: "CPM (Cost Per Mille) = Pay per 1,000 impressions. CPC (Cost Per Click) = Pay only when clicked. CPA (Cost Per Action) = Pay only when conversion happens. Each shifts risk between advertiser and publisher.",
    visual: <PricingVisual />,
  },
  {
    id: "creative",
    title: "Creative Types",
    icon: <Image className="w-5 h-5" />,
    shortDesc: "Ad formats",
    fullDesc: "Creatives are the actual ad content shown to users. Types include: Static images (banners), HTML5 (interactive), Video (pre-roll, mid-roll), Native (matches content), Rich Media (expandable, interactive).",
    visual: <CreativeVisual />,
  },
];

export function BasicsModule() {
  const [activeConcept, setActiveConcept] = useState<string>("adslot");

  const current = concepts.find(c => c.id === activeConcept) || concepts[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-foreground mb-2"
        >
          AdTech Basics
        </motion.h2>
        <p className="text-muted-foreground">
          Master the fundamental concepts that power digital advertising
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Concept List */}
        <div className="space-y-2">
          {concepts.map((concept, i) => (
            <motion.button
              key={concept.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              onClick={() => setActiveConcept(concept.id)}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-xl text-left transition-all duration-300",
                activeConcept === concept.id
                  ? "bg-primary/10 border border-primary/30"
                  : "bg-card border border-border hover:border-muted-foreground/30"
              )}
            >
              <div className={cn(
                "p-2 rounded-lg",
                activeConcept === concept.id ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
              )}>
                {concept.icon}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "font-medium",
                  activeConcept === concept.id ? "text-primary" : "text-foreground"
                )}>
                  {concept.title}
                </p>
                <p className="text-xs text-muted-foreground">{concept.shortDesc}</p>
              </div>
              {activeConcept === concept.id && (
                <ChevronRight className="w-4 h-4 text-primary" />
              )}
            </motion.button>
          ))}
        </div>

        {/* Visual + Explanation */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-full flex flex-col"
            >
              {/* Visual */}
              <div className="flex-1 bg-card border border-border rounded-2xl p-6 mb-4 min-h-[300px] flex items-center justify-center">
                {current.visual}
              </div>

              {/* Explanation */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-display font-semibold text-xl text-foreground mb-2">
                  {current.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {current.fullDesc}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Visual Components
function AdSlotVisual() {
  return (
    <div className="w-full max-w-md">
      <div className="bg-muted/30 rounded-lg p-4 border border-border">
        <div className="h-4 w-32 bg-muted rounded mb-3" />
        <div className="flex gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-3 w-full bg-muted rounded" />
            <div className="h-3 w-3/4 bg-muted rounded" />
            <div className="h-3 w-5/6 bg-muted rounded" />
          </div>
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1, borderColor: ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--primary))"] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-32 h-24 rounded-lg border-2 border-dashed border-primary flex items-center justify-center bg-primary/5"
          >
            <span className="text-xs text-primary font-medium">Ad Slot</span>
          </motion.div>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-3">
        Website layout with ad slot highlighted
      </p>
    </div>
  );
}

function ImpressionVisual() {
  const [count, setCount] = useState(0);

  return (
    <div className="text-center">
      <motion.div
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-32 h-32 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/30 flex items-center justify-center mb-4"
      >
        <Eye className="w-12 h-12 text-primary" />
      </motion.div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-display text-4xl font-bold text-foreground"
      >
        <motion.span
          key={count}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {count.toLocaleString()}
        </motion.span>
      </motion.div>
      <p className="text-sm text-muted-foreground mt-1">Impressions Served</p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setCount(c => c + Math.floor(Math.random() * 100) + 50)}
        className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
      >
        Simulate Page Load
      </motion.button>
    </div>
  );
}

function ClickVisual() {
  const [clicks, setClicks] = useState(0);
  const impressions = 1000;
  const ctr = ((clicks / impressions) * 100).toFixed(2);

  return (
    <div className="text-center">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setClicks(c => c + 1)}
        className="w-48 h-32 rounded-xl bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-lg shadow-lg glow-primary cursor-pointer"
      >
        <MousePointer className="w-8 h-8 mx-auto mb-2" />
        Click Me!
      </motion.button>
      <div className="mt-6 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground">{impressions}</p>
          <p className="text-xs text-muted-foreground">Impressions</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-primary">{clicks}</p>
          <p className="text-xs text-muted-foreground">Clicks</p>
        </div>
        <div>
          <p className="text-2xl font-bold text-accent">{ctr}%</p>
          <p className="text-xs text-muted-foreground">CTR</p>
        </div>
      </div>
    </div>
  );
}

function ConversionVisual() {
  return (
    <div className="flex items-center gap-4">
      {["Ad View", "Click", "Landing Page", "Conversion"].map((step, i) => (
        <div key={step} className="flex items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.3 }}
            className={cn(
              "w-20 h-20 rounded-xl flex flex-col items-center justify-center text-center p-2",
              i === 3 ? "bg-green-500/20 border border-green-500/50" : "bg-muted border border-border"
            )}
          >
            {i === 0 && <Eye className="w-6 h-6 mb-1 text-muted-foreground" />}
            {i === 1 && <MousePointer className="w-6 h-6 mb-1 text-primary" />}
            {i === 2 && <Monitor className="w-6 h-6 mb-1 text-accent" />}
            {i === 3 && <ShoppingCart className="w-6 h-6 mb-1 text-green-500" />}
            <span className="text-xs font-medium">{step}</span>
          </motion.div>
          {i < 3 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: 32 }}
              transition={{ delay: i * 0.3 + 0.2 }}
              className="h-0.5 bg-gradient-to-r from-muted-foreground to-primary mx-1"
            />
          )}
        </div>
      ))}
    </div>
  );
}

function PricingVisual() {
  const [model, setModel] = useState<"cpm" | "cpc" | "cpa">("cpm");
  
  const data = {
    cpm: { label: "CPM", cost: "$5.00", desc: "per 1,000 impressions", risk: "Publisher" },
    cpc: { label: "CPC", cost: "$0.50", desc: "per click", risk: "Shared" },
    cpa: { label: "CPA", cost: "$20.00", desc: "per conversion", risk: "Advertiser" },
  };

  return (
    <div className="w-full max-w-sm">
      <div className="flex gap-2 mb-6">
        {(["cpm", "cpc", "cpa"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setModel(m)}
            className={cn(
              "flex-1 py-2 rounded-lg font-medium text-sm transition-all",
              model === m
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {m.toUpperCase()}
          </button>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={model}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-center bg-card border border-border rounded-xl p-6"
        >
          <p className="text-4xl font-bold text-primary mb-1">{data[model].cost}</p>
          <p className="text-muted-foreground">{data[model].desc}</p>
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Risk carried by</p>
            <p className="font-medium text-foreground">{data[model].risk}</p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CreativeVisual() {
  const types = [
    { name: "Banner", color: "from-blue-500 to-cyan-500" },
    { name: "Video", color: "from-red-500 to-orange-500" },
    { name: "Native", color: "from-green-500 to-emerald-500" },
    { name: "Rich Media", color: "from-purple-500 to-pink-500" },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {types.map((type, i) => (
        <motion.div
          key={type.name}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.1 }}
          whileHover={{ scale: 1.05 }}
          className={cn(
            "h-24 rounded-xl bg-gradient-to-br flex items-center justify-center cursor-pointer",
            type.color
          )}
        >
          <span className="font-medium text-white">{type.name}</span>
        </motion.div>
      ))}
    </div>
  );
}
