import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, Zap, Target, DollarSign, 
  Shield, BarChart3, Sparkles, TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

const aiApplications = [
  {
    id: "bidding",
    title: "Bid Optimization",
    icon: <DollarSign className="w-5 h-5" />,
    description: "AI evaluates each impression in real-time, predicting performance and adjusting bids automatically",
    howItWorks: [
      "Analyze historical performance data across millions of impressions",
      "Predict click-through and conversion probability for each bid request",
      "Adjust bid prices dynamically based on predicted value",
      "Continuously learn from outcomes to improve predictions",
    ],
    impact: "20-40% improvement in campaign ROI through optimized bidding",
    color: "from-green-500 to-emerald-500",
  },
  {
    id: "creative",
    title: "Dynamic Creative Optimization (DCO)",
    icon: <Sparkles className="w-5 h-5" />,
    description: "AI assembles personalized ad creatives in real-time based on user data",
    howItWorks: [
      "Combine creative elements (images, headlines, CTAs) dynamically",
      "Select components based on user profile and context",
      "A/B test variations continuously at scale",
      "Optimize toward best-performing combinations",
    ],
    impact: "Up to 50% higher engagement through personalized creatives",
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "audience",
    title: "Audience Prediction",
    icon: <Target className="w-5 h-5" />,
    description: "ML models identify high-value audiences and predict user behavior",
    howItWorks: [
      "Analyze first-party data to identify conversion patterns",
      "Build lookalike models to find similar high-value users",
      "Predict purchase intent and likelihood to convert",
      "Score users for propensity modeling",
    ],
    impact: "3-5x improvement in targeting efficiency",
    color: "from-blue-500 to-cyan-500",
  },
  {
    id: "fraud",
    title: "Fraud Detection",
    icon: <Shield className="w-5 h-5" />,
    description: "AI identifies invalid traffic and fraudulent activity in real-time",
    howItWorks: [
      "Analyze behavioral patterns to detect bot traffic",
      "Identify suspicious click patterns and IP addresses",
      "Flag domain spoofing and ad injection",
      "Block fraudulent impressions before they're counted",
    ],
    impact: "Save 10-30% of ad spend from fraud waste",
    color: "from-red-500 to-rose-500",
  },
  {
    id: "attribution",
    title: "Attribution Modeling",
    icon: <BarChart3 className="w-5 h-5" />,
    description: "AI determines the true impact of each marketing touchpoint",
    howItWorks: [
      "Analyze user journeys across all channels and devices",
      "Apply statistical models to determine credit allocation",
      "Account for view-through and cross-device conversions",
      "Provide incrementality measurement",
    ],
    impact: "More accurate budget allocation across channels",
    color: "from-amber-500 to-orange-500",
  },
  {
    id: "budget",
    title: "Budget Allocation",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "AI optimizes budget distribution across campaigns, channels, and time",
    howItWorks: [
      "Forecast performance for different budget scenarios",
      "Reallocate spend to highest-performing campaigns in real-time",
      "Optimize pacing to meet goals efficiently",
      "Balance reach, frequency, and conversion objectives",
    ],
    impact: "15-25% more efficient use of advertising budget",
    color: "from-indigo-500 to-violet-500",
  },
];

export function AIModule() {
  const [selectedApp, setSelectedApp] = useState("bidding");

  const currentApp = aiApplications.find(a => a.id === selectedApp)!;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          AI in AdTech
        </h1>
        <p className="text-muted-foreground">
          AI is transforming digital advertising by enabling smarter, faster, and more precise campaign execution. From bidding optimization to fraud detection, see how machine learning powers modern advertising.
        </p>
      </motion.div>

      {/* Brain Animation */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass rounded-xl p-8 text-center"
      >
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            opacity: [0.8, 1, 0.8],
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 mx-auto rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4"
        >
          <Brain className="w-12 h-12 text-white" />
        </motion.div>
        <h2 className="font-display text-xl font-semibold mb-2">AI-Powered Advertising</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Machine learning algorithms process billions of signals in milliseconds to make optimal decisions about every aspect of ad delivery.
        </p>
      </motion.div>

      {/* Application Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2"
      >
        {aiApplications.map((app) => (
          <button
            key={app.id}
            onClick={() => setSelectedApp(app.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-3 rounded-xl border transition-all",
              selectedApp === app.id
                ? "bg-primary/10 border-primary/30"
                : "border-border hover:border-primary/30"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
              app.color
            )}>
              {app.icon}
            </div>
            <span className={cn(
              "text-xs font-medium text-center",
              selectedApp === app.id ? "text-primary" : "text-muted-foreground"
            )}>
              {app.title.split(" ")[0]}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Selected Application Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedApp}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              currentApp.color
            )}>
              {currentApp.icon}
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl font-semibold">{currentApp.title}</h2>
              <p className="text-muted-foreground">{currentApp.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* How It Works */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
              <ol className="space-y-3">
                {currentApp.howItWorks.map((step, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3"
                  >
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-medium">
                      {i + 1}
                    </div>
                    <span className="text-sm text-muted-foreground">{step}</span>
                  </motion.li>
                ))}
              </ol>
            </div>

            {/* Impact */}
            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-primary" />
                Business Impact
              </h3>
              <p className="text-lg text-primary font-semibold">{currentApp.impact}</p>
              <div className="mt-4">
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className={cn("h-full bg-gradient-to-r", currentApp.color)}
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Typical performance improvement</p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* AI Integration Points */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">AI Across the AdTech Stack</h2>
        <p className="text-muted-foreground mb-6">
          AI connects all digital channels into a unified buying strategy
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { channel: "Display", use: "Bid optimization, DCO" },
            { channel: "Video", use: "Contextual targeting, viewability" },
            { channel: "Social", use: "Audience modeling, creative testing" },
            { channel: "Mobile", use: "Location targeting, fraud prevention" },
          ].map((item, i) => (
            <motion.div
              key={item.channel}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <h3 className="font-semibold text-foreground">{item.channel}</h3>
              <p className="text-xs text-muted-foreground mt-1">{item.use}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Key Technologies */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3">Machine Learning</h3>
          <p className="text-sm text-muted-foreground">
            Supervised and unsupervised learning models that improve automatically through experience. Used for prediction, classification, and clustering.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3">Deep Learning</h3>
          <p className="text-sm text-muted-foreground">
            Neural networks for complex pattern recognition. Powers computer vision for creative analysis and NLP for contextual understanding.
          </p>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-display text-lg font-semibold mb-3">Reinforcement Learning</h3>
          <p className="text-sm text-muted-foreground">
            Algorithms that learn optimal actions through trial and error. Used for real-time bidding and budget allocation optimization.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
