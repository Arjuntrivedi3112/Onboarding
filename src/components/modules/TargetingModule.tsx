import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Target, MapPin, Clock, Smartphone, Users, 
  Eye, ShoppingCart, Globe, Tag, DollarSign,
  TrendingUp, RotateCcw
} from "lucide-react";
import { cn } from "@/lib/utils";

type TargetingType = "contextual" | "behavioral" | "demographic" | "retargeting" | "geo" | "device";

interface TargetingMethod {
  id: TargetingType;
  title: string;
  icon: React.ReactNode;
  description: string;
  howItWorks: string[];
  benefits: string[];
  examples: string[];
  color: string;
}

const targetingMethods: TargetingMethod[] = [
  {
    id: "contextual",
    title: "Contextual Targeting",
    icon: <Tag className="w-5 h-5" />,
    description: "Display ads relevant to a website's content rather than relying on visitor data",
    color: "from-blue-500 to-cyan-500",
    howItWorks: [
      "A web crawler scans URLs and categorizes the content",
      "When a visitor accesses a website, contextual info is passed via the ad request",
      "DSPs bid on impressions based on content categories and keywords",
      "Winning ad is displayed to the visitor",
    ],
    benefits: [
      "Privacy-friendly - doesn't rely on personal data",
      "Reduces exposure to GDPR and other regulations",
      "Proven to increase purchase intent",
      "Less unnerving than behaviorally targeted ads",
    ],
    examples: [
      "Smartphone ads on tech review articles",
      "Travel ads on vacation blog posts",
      "Sports gear ads on sports news pages",
    ],
  },
  {
    id: "behavioral",
    title: "Behavioral Targeting",
    icon: <Eye className="w-5 h-5" />,
    description: "Display ads based on users' web-browsing behavior and past interactions",
    color: "from-purple-500 to-pink-500",
    howItWorks: [
      "Collect data: pages viewed, search terms, time spent, clicks, purchases",
      "Build user profiles linking behavior to identifiers (cookies, device IDs)",
      "Create audience segments based on behaviors",
      "Target ads to users matching specific behavioral criteria",
    ],
    benefits: [
      "Highly personalized ad experiences",
      "Better conversion rates from relevant messaging",
      "Enables sophisticated audience building",
      "Cross-site user journey tracking",
    ],
    examples: [
      "Users who viewed products 3+ times",
      "Newsletter subscribers who haven't purchased",
      "Frequent visitors to competitor sites",
    ],
  },
  {
    id: "demographic",
    title: "Demographic Targeting",
    icon: <Users className="w-5 h-5" />,
    description: "Target users based on age, gender, income, education, and other demographic data",
    color: "from-green-500 to-emerald-500",
    howItWorks: [
      "Collect demographic data from registrations and surveys",
      "Infer demographics from browsing patterns and content consumption",
      "Build segments like 'Males 25-34' or 'High Income Households'",
      "Match ads to users fitting advertiser's target demo",
    ],
    benefits: [
      "Reach specific customer profiles",
      "Align with traditional marketing strategies",
      "Effective for brand awareness campaigns",
      "Works well with other targeting methods",
    ],
    examples: [
      "Luxury watch ads to high-income males 35-54",
      "College loan ads to 18-24 age group",
      "Baby product ads to new parents",
    ],
  },
  {
    id: "retargeting",
    title: "Retargeting",
    icon: <RotateCcw className="w-5 h-5" />,
    description: "Display ads to users who have previously interacted with your brand",
    color: "from-orange-500 to-amber-500",
    howItWorks: [
      "User visits advertiser's website and views products",
      "Retargeting pixel drops a cookie on the user's browser",
      "User leaves and browses other websites",
      "DSP recognizes user via cookie and shows relevant ads",
    ],
    benefits: [
      "Re-engage users who showed interest",
      "Higher conversion rates than cold targeting",
      "Reduces abandoned cart rate",
      "Keeps brand top-of-mind",
    ],
    examples: [
      "Showing exact shoes a user viewed earlier",
      "Reminding users of items left in cart",
      "Upselling to past purchasers",
    ],
  },
  {
    id: "geo",
    title: "Geolocation Targeting",
    icon: <MapPin className="w-5 h-5" />,
    description: "Display ads based on user's current location using IP or GPS data",
    color: "from-red-500 to-rose-500",
    howItWorks: [
      "Ad request includes user's IP address",
      "Ad server maps IP to geographic location (country, region, city)",
      "Mobile apps can pass GPS coordinates for precise location",
      "Ads targeted within radius of specific points (e.g., stores)",
    ],
    benefits: [
      "Drive foot traffic to local stores",
      "Location-specific messaging and offers",
      "Weather-triggered campaigns",
      "Competitive conquesting near rival locations",
    ],
    examples: [
      "Restaurant ads within 5 miles",
      "Weather-appropriate clothing ads",
      "Ads in specific neighborhoods",
    ],
  },
  {
    id: "device",
    title: "Device & Browser Targeting",
    icon: <Smartphone className="w-5 h-5" />,
    description: "Target users based on their device type, OS, browser, and screen size",
    color: "from-indigo-500 to-violet-500",
    howItWorks: [
      "User-agent HTTP header contains device info",
      "Identify OS (iOS, Android, Windows), browser (Chrome, Safari)",
      "Detect device type (mobile, tablet, desktop)",
      "Match ads optimized for specific devices/platforms",
    ],
    benefits: [
      "Platform-specific app promotions",
      "Device-optimized creative delivery",
      "Targeting by device value/recency",
      "Cross-device journey tracking",
    ],
    examples: [
      "iOS app ads only to iPhone users",
      "Gaming ads to high-end device users",
      "Desktop-specific software promotions",
    ],
  },
];

const budgetControls = [
  {
    title: "Budget Capping",
    icon: <DollarSign className="w-5 h-5" />,
    description: "Set maximum spend limits for campaigns (daily, weekly, total)",
    detail: "Prevents overspending and ensures budget is distributed across the campaign period",
  },
  {
    title: "Pacing",
    icon: <TrendingUp className="w-5 h-5" />,
    description: "Control how quickly budget is spent over time",
    detail: "Even pacing spreads budget evenly; accelerated pacing front-loads spend for faster results",
  },
  {
    title: "Frequency Capping",
    icon: <Eye className="w-5 h-5" />,
    description: "Limit how many times one user sees the same ad",
    detail: "Example: 3 impressions per user per 24 hours. Prevents ad fatigue and waste",
  },
  {
    title: "Day-Parting",
    icon: <Clock className="w-5 h-5" />,
    description: "Schedule ads to run only at specific times/days",
    detail: "Example: Pizza ads on Friday afternoons 3-8PM. Aligns with peak conversion times",
  },
];

export function TargetingModule() {
  const [selectedMethod, setSelectedMethod] = useState<TargetingType>("contextual");
  const [activeUsers, setActiveUsers] = useState(1000);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);

  const currentMethod = targetingMethods.find(m => m.id === selectedMethod)!;

  const toggleFilter = (filter: string) => {
    if (appliedFilters.includes(filter)) {
      setAppliedFilters(appliedFilters.filter(f => f !== filter));
      setActiveUsers(prev => Math.min(1000, prev + Math.floor(Math.random() * 200) + 100));
    } else {
      setAppliedFilters([...appliedFilters, filter]);
      setActiveUsers(prev => Math.max(10, prev - Math.floor(Math.random() * 200) - 100));
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          Targeting & Budget Control
        </h1>
        <p className="text-muted-foreground">
          Ad targeting ensures ads reach the right audience, while budget control helps advertisers spend wisely. Learn the main methods and how they work together.
        </p>
      </motion.div>

      {/* Targeting Methods Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {targetingMethods.map((method) => (
          <button
            key={method.id}
            onClick={() => setSelectedMethod(method.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              selectedMethod === method.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {method.icon}
            <span className="font-medium">{method.title}</span>
          </button>
        ))}
      </motion.div>

      {/* Selected Method Detail */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedMethod}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              currentMethod.color
            )}>
              {currentMethod.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">{currentMethod.title}</h2>
              <p className="text-muted-foreground">{currentMethod.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* How It Works */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
              <ol className="space-y-2">
                {currentMethod.howItWorks.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-medium">
                      {i + 1}
                    </span>
                    <span className="text-muted-foreground">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Benefits */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Benefits</h3>
              <ul className="space-y-2">
                {currentMethod.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500">✓</span>
                    <span className="text-muted-foreground">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Examples */}
            <div>
              <h3 className="font-semibold text-foreground mb-3">Examples</h3>
              <ul className="space-y-2">
                {currentMethod.examples.map((example, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <span className="text-primary">→</span>
                    {example}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Interactive Targeting Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-4">Interactive: Watch Audience Narrow</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Toggle targeting options to see how your eligible audience size changes
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {[
            "Age 25-34",
            "Male",
            "Mobile",
            "California",
            "Tech Interest",
            "Past Visitors",
            "High Income",
          ].map((filter) => (
            <button
              key={filter}
              onClick={() => toggleFilter(filter)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm border transition-all",
                appliedFilters.includes(filter)
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1 h-4 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              animate={{ width: `${(activeUsers / 1000) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">{activeUsers.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">eligible users</p>
          </div>
        </div>
      </motion.div>

      {/* Budget Control */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Budget Control</h2>
        <p className="text-muted-foreground mb-6">
          Managing campaign budgets prevents overspending and optimizes delivery
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgetControls.map((control, index) => (
            <motion.div
              key={control.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 rounded-xl bg-card border border-border"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  {control.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{control.title}</h3>
                  <p className="text-sm text-muted-foreground">{control.description}</p>
                  <p className="text-xs text-primary/80 mt-2">{control.detail}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
