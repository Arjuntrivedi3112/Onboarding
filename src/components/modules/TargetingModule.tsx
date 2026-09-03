import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target, MapPin, Clock, Smartphone, Users,
  Eye, ShoppingCart, Globe, Tag, DollarSign,
  TrendingUp, RotateCcw, Layers, ChevronRight,
  Database, Filter, Send, ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

type TargetingType = "contextual" | "behavioral" | "demographic" | "retargeting" | "geo" | "device";

type PipelineStage = "collection" | "creation" | "application";

interface BehavioralStage {
  id: PipelineStage;
  step: number;
  title: string;
  icon: React.ReactNode;
  summary: string;
  detail: string[];
  output: string;
}

interface TaxonomyCategory {
  tier1: string;
  tier2: { name: string; tier3: string[] }[];
}

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

const behavioralStages: BehavioralStage[] = [
  {
    id: "collection",
    step: 1,
    title: "Data Collection",
    icon: <Database className="w-5 h-5" />,
    summary: "Advertisers, publishers and DMPs collect event data about what users do across different websites and apps.",
    detail: [
      "Event data includes page views, product views, products purchased and other interactions on a website or mobile app",
      "Other collected signals: previous search terms, time spent on a website, ads and buttons clicked, content viewed and downloaded, and the date of the last visit",
      "The events are tied together via identifiers stored inside third-party and first-party cookies in web browsers, or mobile IDs in mobile apps",
      "User profiles consolidate each user's event data, and identifiers such as cookie IDs or mobile device IDs link future activity back to the same profile",
    ],
    output: "Output: a persistent user profile that new event data is correctly assigned to",
  },
  {
    id: "creation",
    step: 2,
    title: "Audience Creation",
    icon: <Filter className="w-5 h-5" />,
    summary: "Advertisers and publishers group individual user profiles into audiences defined by behavioral rules.",
    detail: [
      "An audience is made up of individual user profiles that all match a set of behavioral criteria",
      "The book's example audience: people who have viewed a given product more than three times a month",
      "…who have signed up for the newsletter…",
      "…and who have visited the website at least 15 times in the past 60 days",
    ],
    output: "Output: a reusable, addressable audience segment",
  },
  {
    id: "application",
    step: 3,
    title: "Application of Data",
    icon: <Send className="w-5 h-5" />,
    summary: "The advertiser uses those audiences for ad targeting in its online media campaigns.",
    detail: [
      "Audiences are applied as targeting criteria on live campaigns",
      "Ads become more relevant to the users who see them",
      "Relevance increases the chances of users converting — e.g. purchasing the product",
      "The core idea is mutual benefit: users see ads that match their interests, while websites improve engagement and overall user experience",
    ],
    output: "Output: more relevant impressions and a higher likelihood of conversion",
  },
];

const taxonomyCategories: TaxonomyCategory[] = [
  {
    tier1: "Technology & Computing",
    tier2: [
      { name: "Consumer Electronics", tier3: ["Smartphones", "Wearable Technology", "Home Entertainment Systems"] },
      { name: "Computing", tier3: ["Laptops", "Computer Peripherals", "Data Storage"] },
    ],
  },
  {
    tier1: "Automotive",
    tier2: [
      { name: "Auto Body Styles", tier3: ["SUV", "Sedan", "Pickup Trucks"] },
      { name: "Auto Type", tier3: ["Budget Cars", "Luxury Cars", "Green Vehicles"] },
    ],
  },
  {
    tier1: "Sports",
    tier2: [
      { name: "Soccer", tier3: ["World Cup", "Club Soccer"] },
      { name: "Motorsports", tier3: ["Auto Racing", "Motorcycle Sports"] },
    ],
  },
  {
    tier1: "Travel",
    tier2: [
      { name: "Travel Type", tier3: ["Family Travel", "Business Travel", "Adventure Travel"] },
      { name: "Travel Locations", tier3: ["Europe Travel", "Asia Travel", "Beach Travel"] },
    ],
  },
];

export function TargetingModule() {
  const [selectedMethod, setSelectedMethod] = useState<TargetingType>("contextual");
  const [activeUsers, setActiveUsers] = useState(1000);
  const [appliedFilters, setAppliedFilters] = useState<string[]>([]);
  const [activeStage, setActiveStage] = useState<PipelineStage>("collection");
  const [expandedTier1, setExpandedTier1] = useState<string | null>("Technology & Computing");
  const [expandedTier2, setExpandedTier2] = useState<string | null>(null);

  const currentStage = behavioralStages.find(s => s.id === activeStage)!;

  const currentMethod = targetingMethods.find(m => m.id === selectedMethod)!;

  const toggleTier1 = (name: string) => {
    setExpandedTier1(prev => (prev === name ? null : name));
    setExpandedTier2(null);
  };

  const toggleTier2 = (name: string) => {
    setExpandedTier2(prev => (prev === name ? null : name));
  };

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

      {/* IAB Content Taxonomy */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-start gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">IAB Content Taxonomy</h2>
            <p className="text-muted-foreground">
              The IAB provides a standard for the categorization of websites, called content taxonomy. It gives buyers and sellers a shared vocabulary for describing what a page is about.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Buying on categories</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Advertisers can purchase digital ad space based on the categories supplied in the ad request. Instead of naming every URL, a buyer targets a category and reaches every page the crawler has classified into it.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <h3 className="font-semibold text-foreground">Blocking on categories</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                The same standard works in reverse: advertisers can also choose <span className="text-foreground">not</span> to show their ads on websites based on the categories, keeping a brand away from content it doesn't want to appear next to.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-muted/50">
              <h3 className="font-semibold text-foreground mb-2 text-sm">Tiered structure</h3>
              <p className="text-sm text-muted-foreground">
                The taxonomy is a hierarchy. A broad <span className="text-primary font-medium">Tier 1</span> category (e.g. Automotive) contains narrower <span className="text-accent font-medium">Tier 2</span> subcategories, which in turn contain <span className="text-foreground font-medium">Tier 3</span> topics. Buyers pick the tier that matches how precise they want to be — a whole vertical, or one specific topic within it.
              </p>
            </div>
          </div>

          {/* Expandable hierarchy explorer */}
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Click a Tier 1 category to drill down:
            </p>
            <div className="space-y-2">
              {taxonomyCategories.map((category) => (
                <div key={category.tier1} className="rounded-xl bg-card border border-border overflow-hidden">
                  <button
                    onClick={() => toggleTier1(category.tier1)}
                    className={cn(
                      "w-full flex items-center gap-2 px-4 py-3 text-left transition-all",
                      expandedTier1 === category.tier1
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <ChevronRight className={cn(
                      "w-4 h-4 shrink-0 transition-transform",
                      expandedTier1 === category.tier1 && "rotate-90"
                    )} />
                    <span className="font-medium">{category.tier1}</span>
                    <span className="ml-auto text-xs text-muted-foreground">Tier 1</span>
                  </button>

                  <AnimatePresence initial={false}>
                    {expandedTier1 === category.tier1 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          {category.tier2.map((sub) => (
                            <div key={sub.name} className="rounded-lg bg-muted/50">
                              <button
                                onClick={() => toggleTier2(sub.name)}
                                className={cn(
                                  "w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-all",
                                  expandedTier2 === sub.name ? "text-accent" : "text-muted-foreground hover:text-foreground"
                                )}
                              >
                                <ChevronRight className={cn(
                                  "w-3.5 h-3.5 shrink-0 transition-transform",
                                  expandedTier2 === sub.name && "rotate-90"
                                )} />
                                <span className="font-medium">{sub.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">Tier 2</span>
                              </button>

                              <AnimatePresence initial={false}>
                                {expandedTier2 === sub.name && (
                                  <motion.ul
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="overflow-hidden px-3 pb-2"
                                  >
                                    {sub.tier3.map((leaf) => (
                                      <li key={leaf} className="flex items-center gap-2 py-1 pl-5 text-sm text-muted-foreground">
                                        <span className="text-primary">→</span>
                                        {leaf}
                                        <span className="ml-auto text-xs text-muted-foreground/70">Tier 3</span>
                                      </li>
                                    ))}
                                  </motion.ul>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Behavioral Data Pipeline */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shrink-0">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold text-foreground">The Behavioral Targeting Data Pipeline</h2>
            <p className="text-muted-foreground">
              Behavioral targeting — also known as online behavioral advertising (OBA) — runs as a three-stage flow. Click a stage to see what happens inside it.
            </p>
          </div>
        </div>

        {/* Stage stepper */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2 mb-6">
          {behavioralStages.map((stage, index) => (
            <div key={stage.id} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => setActiveStage(stage.id)}
                className={cn(
                  "flex-1 flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all",
                  activeStage === stage.id
                    ? "bg-primary/10 border-primary/30 text-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                  activeStage === stage.id ? "bg-primary text-primary-foreground" : "bg-muted/50"
                )}>
                  {stage.icon}
                </span>
                <span>
                  <span className="block text-xs uppercase tracking-wide text-muted-foreground">Stage {stage.step}</span>
                  <span className="block font-medium">{stage.title}</span>
                </span>
              </button>
              {index < behavioralStages.length - 1 && (
                <span className="hidden md:block text-muted-foreground shrink-0">→</span>
              )}
            </div>
          ))}
        </div>

        {/* Active stage detail */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStage}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 rounded-xl bg-card border border-border"
          >
            <h3 className="font-semibold text-foreground mb-1">
              {currentStage.step}. {currentStage.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-4">{currentStage.summary}</p>

            <ul className="space-y-2">
              {currentStage.detail.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-xs font-medium">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 p-3 rounded-lg bg-muted/50 text-sm text-accent">
              {currentStage.output}
            </p>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Interactive Targeting Demo */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
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
        transition={{ delay: 0.35 }}
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
