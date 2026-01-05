import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Database, Users, Target, BarChart3, 
  ArrowRight, Layers, Zap, Filter, Share2
} from "lucide-react";
import { cn } from "@/lib/utils";

const dmpWorkflow = [
  {
    step: 1,
    title: "Data Collection",
    description: "Gather data from multiple sources",
    icon: <Database className="w-5 h-5" />,
    details: "Collect data through integrations with DSPs, ad exchanges, SSPs, CRM systems. Also via tags (JavaScript snippets or HTML pixels) placed on websites.",
    sources: ["Website behavior", "App interactions", "Ad engagement", "CRM data", "Third-party data"],
  },
  {
    step: 2,
    title: "Data Normalization",
    description: "Standardize and clean incoming data",
    icon: <Filter className="w-5 h-5" />,
    details: "Transform data into a consistent format. Resolve identity conflicts. Remove duplicates and invalid entries. Standardize taxonomies.",
    sources: ["Format standardization", "ID resolution", "Deduplication", "Validation"],
  },
  {
    step: 3,
    title: "Profile Building",
    description: "Create unified user profiles",
    icon: <Users className="w-5 h-5" />,
    details: "Merge data points into individual user profiles. Link behavior across devices and sessions. Enrich with inferred attributes.",
    sources: ["Cross-device matching", "Attribute inference", "Interest mapping", "Demographic enrichment"],
  },
  {
    step: 4,
    title: "Audience Segmentation",
    description: "Group users into targetable segments",
    icon: <Layers className="w-5 h-5" />,
    details: "Create audience segments based on behaviors, interests, demographics. Use taxonomies for standardization. Build custom segments for specific campaigns.",
    sources: ["Behavioral segments", "Interest categories", "Demographic groups", "Custom audiences"],
  },
  {
    step: 5,
    title: "Activation",
    description: "Send segments to advertising platforms",
    icon: <Share2 className="w-5 h-5" />,
    details: "Push audience segments to DSPs for targeting. Sync with publishers for personalization. Export to social platforms. Enable retargeting.",
    sources: ["DSP integration", "Publisher sync", "Social activation", "Email targeting"],
  },
];

const dataTypes = [
  {
    type: "First-Party Data",
    description: "Data collected directly from your own customers and website visitors",
    examples: ["Purchase history", "Email signups", "Site behavior", "Preferences"],
    quality: "Highest",
    color: "from-green-500 to-emerald-500",
  },
  {
    type: "Second-Party Data",
    description: "Another company's first-party data shared through a partnership",
    examples: ["Partner customer data", "Co-marketing data", "Publisher data"],
    quality: "High",
    color: "from-blue-500 to-cyan-500",
  },
  {
    type: "Third-Party Data",
    description: "Data purchased from data brokers and aggregators",
    examples: ["Demographics", "Interest data", "Purchase intent", "Location data"],
    quality: "Variable",
    color: "from-purple-500 to-pink-500",
  },
];

const useCases = [
  { title: "Targeting", description: "Improve online media campaign targeting", icon: <Target className="w-5 h-5" /> },
  { title: "Audience Extension", description: "Find new users similar to your best customers", icon: <Users className="w-5 h-5" /> },
  { title: "Personalization", description: "Customize onsite experiences for segments", icon: <Zap className="w-5 h-5" /> },
  { title: "Measurement", description: "Analyze campaign performance by segment", icon: <BarChart3 className="w-5 h-5" /> },
];

export function DataModule() {
  const [activeStep, setActiveStep] = useState(1);
  const [selectedDataType, setSelectedDataType] = useState(0);

  const currentStep = dmpWorkflow.find(s => s.step === activeStep)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Data & DMP
        </h1>
        <p className="text-muted-foreground">
          A Data Management Platform (DMP) is software that collects, stores, and organizes data from multiple sources. Learn how data flows through the DMP and powers targeted advertising.
        </p>
      </motion.div>

      {/* DMP Workflow */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-6">DMP Workflow</h2>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-8">
          {dmpWorkflow.map((step, i) => (
            <div key={step.step} className="flex items-center">
              <button
                onClick={() => setActiveStep(step.step)}
                className={cn(
                  "flex flex-col items-center transition-all",
                  activeStep === step.step ? "scale-105" : "opacity-60 hover:opacity-80"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                  activeStep === step.step
                    ? "bg-primary text-primary-foreground"
                    : activeStep > step.step
                    ? "bg-green-500/20 text-green-500"
                    : "bg-muted text-muted-foreground"
                )}>
                  {step.icon}
                </div>
                <span className={cn(
                  "text-xs mt-2 font-medium hidden md:block",
                  activeStep === step.step ? "text-primary" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </button>
              {i < dmpWorkflow.length - 1 && (
                <ArrowRight className={cn(
                  "w-6 h-6 mx-2 hidden md:block",
                  activeStep > step.step ? "text-green-500" : "text-muted-foreground/30"
                )} />
              )}
            </div>
          ))}
        </div>

        {/* Active Step Detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-muted/50 rounded-lg p-4"
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary shrink-0">
                {currentStep.icon}
              </div>
              <div>
                <h3 className="font-semibold text-foreground">
                  Step {currentStep.step}: {currentStep.title}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{currentStep.details}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {currentStep.sources.map((source, i) => (
                <motion.span
                  key={source}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="px-3 py-1 rounded-full bg-card border border-border text-xs text-foreground"
                >
                  {source}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Data Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Types of Data</h2>
        <p className="text-muted-foreground mb-6">
          Understanding data ownership and quality is crucial for effective targeting
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {dataTypes.map((data, i) => (
            <motion.div
              key={data.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              onClick={() => setSelectedDataType(i)}
              className={cn(
                "p-4 rounded-xl border cursor-pointer transition-all",
                selectedDataType === i
                  ? "bg-primary/10 border-primary/30"
                  : "bg-card border-border hover:border-primary/30"
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">{data.type}</h3>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  data.quality === "Highest" ? "bg-green-500/20 text-green-500" :
                  data.quality === "High" ? "bg-blue-500/20 text-blue-500" :
                  "bg-amber-500/20 text-amber-500"
                )}>
                  {data.quality} Quality
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{data.description}</p>
              <div className="flex flex-wrap gap-1">
                {data.examples.map((ex) => (
                  <span key={ex} className="text-xs text-primary/80">{ex}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* DMP Use Cases */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">DMP Use Cases</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {useCases.map((useCase, i) => (
            <motion.div
              key={useCase.title}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border text-center"
            >
              <div className="w-10 h-10 rounded-lg bg-accent/20 text-accent flex items-center justify-center mx-auto mb-3">
                {useCase.icon}
              </div>
              <h3 className="font-semibold text-foreground text-sm">{useCase.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{useCase.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* DMP vs CDP */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3 text-primary">
            Data Management Platform (DMP)
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Focused on anonymous audience data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Primarily uses third-party data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Short data retention (90 days typical)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary">•</span>
              <span className="text-muted-foreground">Optimized for advertising activation</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3 text-accent">
            Customer Data Platform (CDP)
          </h3>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span className="text-muted-foreground">Focused on known customer data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span className="text-muted-foreground">Primarily uses first-party data</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span className="text-muted-foreground">Persistent data storage</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent">•</span>
              <span className="text-muted-foreground">Used for marketing + advertising</span>
            </li>
          </ul>
        </div>
      </motion.div>
    </div>
  );
}
