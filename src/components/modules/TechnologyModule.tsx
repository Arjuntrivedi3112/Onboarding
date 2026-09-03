import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Server,
  Database,
  Globe,
  Users,
  Building2,
  Layers,
  Lock,
  Briefcase,
  Sparkles,
  ClipboardList,
  Settings,
  BookOpen,
  Target,
  ShieldCheck,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TechComponent {
  id: string;
  name: string;
  fullName: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  whatIs: string;
  whyExists: string;
  dataFlow: string;
}

const techComponents: TechComponent[] = [
  {
    id: "dsp",
    name: "DSP",
    fullName: "Demand-Side Platform",
    icon: <Building2 className="w-6 h-6" />,
    color: "from-cyan-400 to-blue-500",
    description: "Buy ad inventory programmatically",
    whatIs: "A DSP is software that allows advertisers and agencies to purchase display, video, mobile, and search ads automatically. It connects to multiple ad exchanges and SSPs.",
    whyExists: "Before DSPs, media buyers had to manually negotiate with each publisher. DSPs automate this, enabling real-time bidding on millions of impressions per second.",
    dataFlow: "Receives bid requests → Checks audience data from DMP → Calculates optimal bid → Submits bid to exchange → Receives win notification → Serves creative",
  },
  {
    id: "ssp",
    name: "SSP",
    fullName: "Supply-Side Platform",
    icon: <Layers className="w-6 h-6" />,
    color: "from-emerald-400 to-green-500",
    description: "Sell ad inventory efficiently",
    whatIs: "An SSP helps publishers manage, sell, and optimize their ad inventory. It connects to multiple ad exchanges and DSPs to maximize revenue.",
    whyExists: "Publishers needed a way to sell remnant inventory programmatically and get the best price. SSPs create competition among buyers and set floor prices.",
    dataFlow: "Receives ad request from publisher → Creates bid request → Sends to exchanges → Collects bids → Runs auction → Returns winning ad to publisher",
  },
  {
    id: "exchange",
    name: "Ad Exchange",
    fullName: "Ad Exchange",
    icon: <Globe className="w-6 h-6" />,
    color: "from-purple-400 to-pink-500",
    description: "Marketplace for real-time trading",
    whatIs: "An ad exchange is a technology platform that facilitates the buying and selling of ad inventory from multiple ad networks. It operates like a stock exchange for ads.",
    whyExists: "Creates liquidity and transparency. Connects thousands of buyers and sellers in real-time, ensuring fair market pricing through auction mechanisms.",
    dataFlow: "Receives bid requests from SSPs → Broadcasts to connected DSPs → Collects bids → Determines winner via auction → Notifies winner → Facilitates creative delivery",
  },
  {
    id: "dmp",
    name: "DMP",
    fullName: "Data Management Platform",
    icon: <Database className="w-6 h-6" />,
    color: "from-amber-400 to-orange-500",
    description: "Collect and segment audience data",
    whatIs: "A DMP collects, organizes, and activates first, second, and third-party audience data. It creates segments that can be used for targeting.",
    whyExists: "Advertisers need to understand their audience. DMPs unify data from multiple sources to create actionable segments for precise targeting.",
    dataFlow: "Collects user data → Normalizes and enriches → Creates segments → Syncs with DSPs → Enables targeted bidding → Measures and optimizes",
  },
  {
    id: "adserver",
    name: "Ad Server",
    fullName: "Ad Server",
    icon: <Server className="w-6 h-6" />,
    color: "from-rose-400 to-red-500",
    description: "Store and deliver creatives",
    whatIs: "An ad server stores advertising content and delivers it to users. It tracks impressions, clicks, and conversions while managing ad rotation and targeting.",
    whyExists: "Centralizes creative management, enables A/B testing, provides unified reporting, and ensures ads are served correctly across all campaigns.",
    dataFlow: "Stores creatives → Receives ad call → Applies targeting rules → Selects best creative → Delivers to user → Logs impression/click data",
  },
  {
    id: "adnetwork",
    name: "Ad Network",
    fullName: "Ad Network",
    icon: <Users className="w-6 h-6" />,
    color: "from-indigo-400 to-violet-500",
    description: "Aggregate inventory from publishers",
    whatIs: "An ad network aggregates ad space from multiple publishers and sells it to advertisers. It acts as an intermediary, often focusing on specific verticals or formats.",
    whyExists: "Small publishers can't attract direct advertisers. Ad networks bundle their inventory and sell at scale, providing access to larger ad budgets.",
    dataFlow: "Collects inventory from publishers → Categorizes and packages → Sells to advertisers → Distributes campaigns → Reports performance",
  },
];

type EcosystemSide = "walled" | "independent";
type RoleView = "adops" | "trafficking";

interface GamaPlayer {
  letter: string;
  name: string;
  color: string;
}

const gamaPlayers: GamaPlayer[] = [
  { letter: "G", name: "Google", color: "from-blue-500 to-cyan-500" },
  { letter: "A", name: "Apple", color: "from-slate-400 to-slate-600" },
  { letter: "M", name: "Meta", color: "from-indigo-500 to-blue-500" },
  { letter: "A", name: "Amazon", color: "from-amber-500 to-orange-500" },
];

interface BrokerType {
  name: string;
  icon: React.ReactNode;
  description: string;
}

const brokerTypes: BrokerType[] = [
  {
    name: "Marketing & Advertising",
    icon: <Target className="w-4 h-4 text-primary" />,
    description: "Enhance ad targeting and campaign measurement for advertisers and platforms.",
  },
  {
    name: "Identity Verification & Fraud Detection",
    icon: <ShieldCheck className="w-4 h-4 text-accent" />,
    description: "Help organizations such as banks confirm individual identities.",
  },
  {
    name: "People Search",
    icon: <Search className="w-4 h-4 text-green-500" />,
    description: "Collect publicly available information about individuals from social media and other online sources.",
  },
];

const dcoRtbSteps: { step: string; detail: string }[] = [
  {
    step: "User visit",
    detail: "A user loads a website. The SSP sends a bid request to an ad exchange, which forwards it to all connected DSPs.",
  },
  {
    step: "Bid evaluation",
    detail: "Each DSP evaluates the available user data against its campaign targeting criteria to decide whether to bid.",
  },
  {
    step: "Bid response",
    detail: "The DSPs submit their bids and the ad exchange selects the highest bidder. The winning ad is cleared to display on the publisher's site.",
  },
  {
    step: "Dynamic creative generation",
    detail: "Before the ad is shown, the DSP issues an ad call to the DCO. The DCO generates a hyper-relevant creative in real time and delivers it to the user.",
  },
];

export function TechnologyModule() {
  const [selectedTech, setSelectedTech] = useState<string>("dsp");
  const [ecosystemSide, setEcosystemSide] = useState<EcosystemSide>("walled");
  const [roleView, setRoleView] = useState<RoleView>("adops");

  const current = techComponents.find(t => t.id === selectedTech) || techComponents[0];

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <motion.h2
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-3xl font-bold text-foreground mb-2"
        >
          Core Technology Stack
        </motion.h2>
        <p className="text-muted-foreground">
          Explore the platforms that power programmatic advertising
        </p>
      </div>

      {/* Technology Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {techComponents.map((tech, i) => (
          <motion.button
            key={tech.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => setSelectedTech(tech.id)}
            className={cn(
              "p-4 rounded-xl text-center transition-all duration-300 border",
              selectedTech === tech.id
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-muted-foreground/30"
            )}
          >
            <div className={cn(
              "w-12 h-12 mx-auto mb-2 rounded-xl bg-gradient-to-br flex items-center justify-center text-white",
              tech.color
            )}>
              {tech.icon}
            </div>
            <p className={cn(
              "font-bold text-lg",
              selectedTech === tech.id ? "text-primary" : "text-foreground"
            )}>
              {tech.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {tech.description}
            </p>
          </motion.button>
        ))}
      </div>

      {/* Detail View */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* What Is It */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white",
                current.color
              )}>
                {current.icon}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{current.fullName}</h3>
                <p className="text-xs text-muted-foreground">{current.name}</p>
              </div>
            </div>
            <h4 className="text-sm font-semibold text-primary mb-2">What Is It?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.whatIs}
            </p>
          </div>

          {/* Why It Exists */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h4 className="text-sm font-semibold text-accent mb-2">Why Does It Exist?</h4>
            <p className="text-sm text-muted-foreground leading-relaxed mb-6">
              {current.whyExists}
            </p>
            <h4 className="text-sm font-semibold text-green-500 mb-2">Data Flow</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {current.dataFlow}
            </p>
          </div>

          {/* Visual Flow */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <h4 className="text-sm font-semibold text-foreground mb-4">In The Ecosystem</h4>
            <div className="flex-1 flex items-center justify-center">
              <div className="flex items-center gap-3">
                {current.id === "dsp" && (
                  <>
                    <FlowNode label="Advertiser" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DSP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" small />
                  </>
                )}
                {current.id === "ssp" && (
                  <>
                    <FlowNode label="Publisher" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="SSP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" small />
                  </>
                )}
                {current.id === "exchange" && (
                  <>
                    <FlowNode label="DSPs" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Exchange" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="SSPs" small />
                  </>
                )}
                {current.id === "dmp" && (
                  <>
                    <FlowNode label="Data Sources" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DMP" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="DSP" small />
                  </>
                )}
                {current.id === "adserver" && (
                  <>
                    <FlowNode label="Creatives" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Ad Server" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="User" small />
                  </>
                )}
                {current.id === "adnetwork" && (
                  <>
                    <FlowNode label="Publishers" small />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Network" active color={current.color} />
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                    <FlowNode label="Advertisers" small />
                  </>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Beyond the Platforms: players, roles and standards */}
      <div className="mt-8 space-y-6">
        {/* Walled Gardens */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white shrink-0">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold mb-2">The Walled Gardens</h3>
              <p className="text-muted-foreground text-sm">
                The AdTech ecosystem can be divided into two groups: independent AdTech companies and walled gardens.
                A walled garden is a closed ecosystem where a platform or technology provider controls access to its
                users, data, and advertising inventory.
              </p>
            </div>
          </div>

          {/* Ecosystem selector */}
          <div className="flex gap-2 mb-4">
            {([
              { id: "walled", label: "Walled Gardens" },
              { id: "independent", label: "Independent AdTech" },
            ] as { id: EcosystemSide; label: string }[]).map((option) => (
              <button
                key={option.id}
                onClick={() => setEcosystemSide(option.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300",
                  ecosystemSide === option.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {ecosystemSide === "walled" ? (
              <motion.div
                key="walled"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-4 rounded-lg bg-card border border-border mb-4">
                  <h4 className="font-semibold text-foreground mb-2">GAMA</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    In AdTech you&apos;ll often encounter the term GAMA — Google, Apple, Meta, and Amazon — considered
                    among the most prominent walled gardens. These platforms keep their audiences and data within their
                    own ecosystems, requiring brands to use their advertising tools and platforms to reach them.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {gamaPlayers.map((player) => (
                      <div
                        key={player.name}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white font-bold",
                          player.color
                        )}>
                          {player.letter}
                        </div>
                        <span className="text-sm font-medium text-foreground">{player.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Inside a walled garden the platform owns the users, the data, and the inventory — so buying,
                    targeting, and measurement all happen with the platform&apos;s own tools.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="independent"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="p-4 rounded-lg bg-card border border-border"
              >
                <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-accent" />
                  Independent AdTech
                </h4>
                <p className="text-sm text-muted-foreground mb-3">
                  The other half of the ecosystem is made up of independent AdTech companies — the DSPs, SSPs, ad
                  exchanges, ad servers, DMPs, and data brokers covered above. Instead of one company controlling
                  users, data, and inventory, these platforms interoperate with one another across the open web.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["DSP", "SSP", "Ad Exchange", "Ad Server", "DMP", "Data Broker"].map((label) => (
                    <span
                      key={label}
                      className="px-3 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground"
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Data Broker */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold mb-2">Data Broker</h3>
              <p className="text-muted-foreground text-sm">
                A data broker is a company that collects and aggregates personal information — such as income,
                ethnicity, political beliefs, or geolocation data — and then sells or licenses this data to third
                parties. Data brokers typically compile information from multiple sources, segment it into categories,
                and sell those segments to other companies for use in online advertising campaigns.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {brokerTypes.map((broker) => (
              <div key={broker.name} className="p-4 rounded-lg bg-card border border-border">
                <div className="flex items-center gap-2 mb-2">
                  {broker.icon}
                  <h4 className="font-semibold text-foreground text-sm">{broker.name}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{broker.description}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              In the digital advertising and marketing industries, many DMPs act as data brokers — and vice versa.
              DSPs commonly integrate with both to enrich targeting.
            </p>
          </div>
        </motion.div>

        {/* Advertising Agency & ATD */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-xl font-semibold mb-4">Agencies and Trading Desks</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Briefcase className="w-5 h-5 text-primary" />
                <h4 className="font-semibold text-foreground">Advertising Agency</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                An advertising agency is a company that provides services to brands associated with creating, planning,
                and managing advertising campaigns. Most agencies operate as independent, external firms serving a
                variety of clients — businesses, multinational corporations, non-profits, and governments.
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Traditionally, brands hired agencies to produce television commercials and run print campaigns in
                magazines, newspapers, and on billboards, as well as to handle other forms of promotion and marketing.
              </p>
              <p className="text-sm text-muted-foreground">
                With the rise of the internet, agencies now rely on a wide range of advertising and marketing
                technologies to design, run, and measure online campaigns. These are often referred to as interactive,
                creative, media, or digital agencies.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-5 h-5 text-accent" />
                <h4 className="font-semibold text-foreground">Agency Trading Desk (ATD)</h4>
              </div>
              <p className="text-sm text-muted-foreground mb-3">
                An ATD is a unit <span className="text-foreground font-medium">within</span> an advertising agency that
                provides programmatic managed services to brands, handling programmatic media-buying activities on
                their behalf. Most major agencies operate their own trading desk.
              </p>
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-semibold text-primary mb-1">Services layer</p>
                  <p className="text-xs text-muted-foreground">
                    Media buyers, developers, account managers, and other people who run the campaigns.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs font-semibold text-accent mb-1">Technical layer</p>
                  <p className="text-xs text-muted-foreground">
                    Proprietary technology combined with external tools such as DSPs.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-4">
                <FlowNode label="Brand" small />
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <FlowNode label="Agency" small />
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <FlowNode label="ATD" small />
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
                <FlowNode label="DSP" small />
              </div>
            </div>
          </div>
        </motion.div>

        {/* AdOps vs Ad Trafficking */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass rounded-xl p-6"
        >
          <h3 className="font-display text-xl font-semibold mb-2">AdOps vs. Ad Trafficking</h3>
          <p className="text-muted-foreground text-sm mb-4">
            The terms are often used interchangeably, but they have distinct meanings — one names the{" "}
            <span className="text-foreground font-medium">people</span>, the other names the{" "}
            <span className="text-foreground font-medium">process</span>. Toggle to compare.
          </p>

          <div className="flex gap-2 mb-4">
            {([
              { id: "adops", label: "AdOps (the people)" },
              { id: "trafficking", label: "Ad Trafficking (the process)" },
            ] as { id: RoleView; label: string }[]).map((option) => (
              <button
                key={option.id}
                onClick={() => setRoleView(option.id)}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium border transition-all duration-300",
                  roleView === option.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-muted-foreground/30"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {roleView === "adops" ? (
              <motion.div
                key="adops"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-4 rounded-lg bg-card border border-border mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-5 h-5 text-primary" />
                    <h4 className="font-semibold text-foreground">AdOps — the people</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    AdOps refers to the people responsible for carrying out the trafficking process. The AdOps
                    department sets up ad campaigns, traffics tags, configures header-bidding wrappers, and adjusts
                    campaigns as needed. Both publishers and advertisers benefit from AdOps teams.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Advertiser AdOps Team
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Configures campaigns in the advertiser&apos;s ad server and provides ad tags to the publisher.
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-card border border-border">
                    <h4 className="font-semibold text-foreground mb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-accent" />
                      Publisher AdOps Team
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Sets up the campaign, adds the advertiser&apos;s ad tags to the publisher&apos;s ad server, and
                      launches the campaign.
                    </p>
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="trafficking"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="p-4 rounded-lg bg-card border border-border mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ClipboardList className="w-5 h-5 text-accent" />
                    <h4 className="font-semibold text-foreground">Ad Trafficking — the process</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Ad trafficking refers to the process of setting up, monitoring, and optimizing campaigns within ad
                    servers and other AdTech platforms. It is the work itself, not the job title.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { label: "Set up", icon: <Settings className="w-4 h-4 text-primary" />, text: "Build the campaign in the ad server, load creatives, and traffic the ad tags." },
                    { label: "Monitor", icon: <Server className="w-4 h-4 text-accent" />, text: "Watch delivery, pacing, and discrepancies once the campaign is live." },
                    { label: "Optimize", icon: <Target className="w-4 h-4 text-green-500" />, text: "Adjust campaigns and header-bidding wrapper settings as needed." },
                  ].map((phase) => (
                    <div key={phase.label} className="p-4 rounded-lg bg-card border border-border">
                      <div className="flex items-center gap-2 mb-2">
                        {phase.icon}
                        <h4 className="font-semibold text-foreground text-sm">{phase.label}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{phase.text}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* DCO */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold mb-2">Dynamic Creative Optimization (DCO)</h3>
              <p className="text-muted-foreground text-sm">
                DCO is a process whereby advertisers show personalized ads to individual users based on information
                known about them. The software that powers it — a DCO tool — creates, serves, and measures these
                hyper-relevant advertisements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-card border border-border">
              <h4 className="font-semibold text-foreground mb-2">What Gets Assembled</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Ad components — backgrounds, text, images, value propositions, and calls-to-action (CTAs) — are
                dynamically adjusted to create the most personalized message for each user.
              </p>
              <div className="flex flex-wrap gap-2">
                {["Background", "Text", "Image", "Value prop", "CTA"].map((element) => (
                  <span key={element} className="px-3 py-1 rounded-lg bg-muted/50 text-xs text-muted-foreground">
                    {element}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-card border border-border">
              <h4 className="font-semibold text-foreground mb-2">What Data Drives It</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Advertisers feed the DCO tool demographic data, geographic locations, interests, contextual data,
                behavioral data, historical insights, and context-specific data. The tool forms a new creative, A/B
                tests it in real time, and displays the best-performing version at scale.
              </p>
              <p className="text-xs text-muted-foreground">
                What sets DCO apart is its real-time use of data to generate dynamic ads — combining personalization
                and instant optimization to raise the likelihood that users click and ultimately convert.
              </p>
            </div>
          </div>

          <h4 className="font-semibold text-foreground mb-3">How DCO Fits Into Real-Time Bidding</h4>
          <p className="text-sm text-muted-foreground mb-4">
            To serve dynamically created ads, a DCO tool must integrate with existing AdTech platforms such as DSPs and
            ad exchanges, then use data feeds and machine learning algorithms to assemble personalized creatives.
          </p>
          <div className="space-y-3">
            {dcoRtbSteps.map((item, i) => (
              <div
                key={item.step}
                className={cn(
                  "flex gap-4 p-3 rounded-lg border",
                  i === dcoRtbSteps.length - 1
                    ? "border-primary/30 bg-primary/10"
                    : "border-border bg-card"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                  i === dcoRtbSteps.length - 1
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                )}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={cn(
                    "font-medium",
                    i === dcoRtbSteps.length - 1 ? "text-primary" : "text-foreground"
                  )}>
                    {item.step}
                  </p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Standardization / IAB */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-display text-xl font-semibold mb-2">Standardization &amp; the IAB</h3>
              <p className="text-muted-foreground text-sm">
                In the very early days of online advertising, it became apparent that there would be a need for a set of
                standards to ensure that different advertising technologies could communicate efficiently with one
                another and deliver ads in the correct format.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-card border border-border mb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-lg bg-muted/50 text-sm font-mono font-bold text-primary">1996</span>
              <p className="text-sm text-muted-foreground">
                The <span className="text-foreground font-medium">Interactive Advertising Bureau (IAB)</span> was
                founded to standardize the online advertising industry.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { title: "Technical Standards", text: "Develops the technical specifications that let different AdTech platforms interoperate." },
              { title: "Best Practices", text: "Promotes best practices across buyers, sellers, and technology vendors." },
              { title: "Industry Research", text: "Conducts research on the state and direction of digital advertising." },
              { title: "Education", text: "Educates companies on the value of digital advertising." },
            ].map((role) => (
              <div key={role.title} className="p-4 rounded-lg bg-card border border-border">
                <h4 className="font-semibold text-foreground text-sm mb-2">{role.title}</h4>
                <p className="text-xs text-muted-foreground">{role.text}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">
              You already meet IAB standards elsewhere in this stack — for example, IAB content categories are a common
              targeting criterion in ad networks.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FlowNode({ 
  label, 
  active = false, 
  small = false,
  color = "from-muted to-muted"
}: { 
  label: string; 
  active?: boolean; 
  small?: boolean;
  color?: string;
}) {
  return (
    <motion.div
      animate={active ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
      className={cn(
        "rounded-xl flex items-center justify-center text-center",
        small ? "w-16 h-16 bg-muted border border-border" : "w-20 h-20",
        active && `bg-gradient-to-br ${color} text-white shadow-lg`
      )}
    >
      <span className={cn(
        "font-medium",
        small ? "text-xs text-muted-foreground" : "text-sm"
      )}>
        {label}
      </span>
    </motion.div>
  );
}
