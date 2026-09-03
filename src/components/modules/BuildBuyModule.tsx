import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Hammer, KeyRound, ShoppingCart, Check, AlertTriangle,
  RotateCcw, Sparkles, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

type OptionId = "rent" | "buy" | "build";

interface StrategyOption {
  id: OptionId;
  name: string;
  tagline: string;
  icon: React.ReactNode;
  color: string;
  description: string;
  advantages: { title: string; detail: string }[];
  challenges: { title: string; detail: string }[];
}

const options: StrategyOption[] = [
  {
    id: "rent",
    name: "Rent",
    tagline: "Software-as-a-service",
    icon: <KeyRound className="w-6 h-6" />,
    color: "from-green-500 to-emerald-500",
    description:
      "Renting means leveraging software-as-a-service (SaaS) platforms — perfect for companies at the start of their AdTech journey.",
    advantages: [
      {
        title: "Rapid time-to-market",
        detail: "Minimal setup, easy onboarding, and low upfront costs with pay-as-you-go flexibility.",
      },
      {
        title: "Learning period",
        detail: "Gain clarity on what you actually need before committing to anything bigger.",
      },
    ],
    challenges: [
      { title: "Rising costs", detail: "Expenses grow as usage and data volume increase." },
      { title: "Limited customization", detail: "Features and workflows can't be fully tailored." },
      { title: "No control over roadmap", detail: "Development depends on the vendor's priorities." },
      {
        title: "Transparency concerns",
        detail: "Restricted visibility into platform operations and data handling.",
      },
    ],
  },
  {
    id: "buy",
    name: "Buy",
    tagline: "Acquire an existing company",
    icon: <ShoppingCart className="w-6 h-6" />,
    color: "from-blue-500 to-cyan-500",
    description:
      "Buying involves acquiring an existing company and its technology — the product, codebase, intellectual property, and often the development team behind it.",
    advantages: [
      {
        title: "Full ownership and transparency",
        detail: "Control over features and data from day one.",
      },
      { title: "Accelerated timeline", detail: "Faster than building a platform entirely from scratch." },
      {
        title: "Control over roadmap",
        detail: "Adapt and evolve the acquired technology to your business strategy.",
      },
    ],
    challenges: [
      {
        title: "Integration complexity",
        detail: "Merging the acquired system can be time-consuming and resource-intensive.",
      },
      {
        title: "Retention risks",
        detail: "Key team members may leave post-acquisition, impacting knowledge transfer.",
      },
      {
        title: "Inherited issues",
        detail: "Technical debt, architectural limitations, and unresolved bugs come with the deal.",
      },
    ],
  },
  {
    id: "build",
    name: "Build",
    tagline: "Develop it yourself",
    icon: <Hammer className="w-6 h-6" />,
    color: "from-purple-500 to-pink-500",
    description:
      "Building means developing a custom AdTech platform from scratch, or replacing components in phases.",
    advantages: [
      { title: "Complete control", detail: "A platform designed to your exact workflow." },
      { title: "Future-proof", detail: "Scalable alongside your growth." },
      {
        title: "Cost becomes investment",
        detail: "Ownership turns monthly fees into long-term asset value.",
      },
    ],
    challenges: [
      { title: "Time-consuming", detail: "Developing a full MVP can take 3–6 months." },
      {
        title: "Higher upfront investment",
        detail: "Requires a skilled, dedicated engineering team.",
      },
      { title: "Scope management", detail: "Risk of overcomplication." },
    ],
  },
];

const comparisonRows: { label: string; rent: string; buy: string; build: string }[] = [
  { label: "Time-to-Market", rent: "Fast (days/weeks)", buy: "Moderate (weeks/months)", build: "Slow (3–6 months for MVP)" },
  { label: "Upfront Cost", rent: "Low", buy: "Medium to high", build: "High" },
  { label: "Ongoing Costs", rent: "High (scales with usage)", buy: "Medium", build: "Low to medium (maintenance)" },
  { label: "Control Over Features", rent: "Low", buy: "High", build: "Very high" },
  { label: "Scalability", rent: "Limited by vendor's roadmap", buy: "Flexible after integration", build: "Fully customizable" },
  { label: "Transparency", rent: "Low", buy: "High", build: "Very high" },
  { label: "Integration Complexity", rent: "Low", buy: "High", build: "Medium" },
  { label: "Risk", rent: "Low initially, higher long-term", buy: "Medium", build: "High initially, lower long-term" },
];

const keyTakeaways = [
  { n: 1, title: "Start with rent", detail: "It's ideal for fast launches and early learning." },
  { n: 2, title: "Upgrade to buy or build when ready", detail: "If your tool can't adapt to you, it's time to change." },
  { n: 3, title: "Focus on core needs", detail: "You likely only need 2–5% of big platforms' features." },
  { n: 4, title: "Incremental builds work", detail: "Replace third-party parts gradually." },
  { n: 5, title: "Custom doesn't mean complex", detail: "Narrow scope ensures faster delivery and ROI." },
  { n: 6, title: "The tool should serve you", detail: "Not the other way around." },
];

interface Question {
  id: string;
  question: string;
  answers: { label: string; scores: Record<OptionId, number> }[];
}

const questions: Question[] = [
  {
    id: "maturity",
    question: "What stage is your business at?",
    answers: [
      { label: "Just starting out in AdTech", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "Established, with a clear picture of our needs", scores: { rent: 1, buy: 2, build: 2 } },
      { label: "Mature, with in-house engineering capacity", scores: { rent: 0, buy: 2, build: 3 } },
    ],
  },
  {
    id: "budget",
    question: "What does your budget look like?",
    answers: [
      { label: "Tight — we need low upfront cost", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "Moderate — we can invest, within reason", scores: { rent: 1, buy: 2, build: 2 } },
      { label: "Substantial — upfront investment is acceptable", scores: { rent: 0, buy: 3, build: 3 } },
    ],
  },
  {
    id: "urgency",
    question: "How urgently do you need to launch?",
    answers: [
      { label: "Days or weeks", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "A few months", scores: { rent: 1, buy: 3, build: 1 } },
      { label: "We can wait 6+ months for the right thing", scores: { rent: 0, buy: 1, build: 3 } },
    ],
  },
  {
    id: "control",
    question: "How much long-term strategic control do you need?",
    answers: [
      { label: "Low — a vendor's roadmap is fine", scores: { rent: 3, buy: 0, build: 0 } },
      { label: "High — we need to own features and data", scores: { rent: 0, buy: 3, build: 2 } },
      { label: "Total — the platform is our differentiator", scores: { rent: 0, buy: 1, build: 3 } },
    ],
  },
];

const recommendationCopy: Record<OptionId, string> = {
  rent: "Start by renting. A SaaS platform gets you live quickly with minimal commitment, and the learning period will tell you what you genuinely need before you invest in anything larger.",
  buy: "Buying looks like the strongest fit. Acquiring an existing platform gets you ownership and roadmap control far faster than building from scratch — budget for the integration work and the retention risk.",
  build: "Building is worth it for you. You have the maturity, budget, and control requirements that justify a custom platform — keep the initial scope narrow so the first version ships in months, not years.",
};

export function BuildBuyModule() {
  const [selectedOption, setSelectedOption] = useState<OptionId>("rent");
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const current = options.find((o) => o.id === selectedOption)!;
  const answeredCount = Object.keys(answers).length;
  const allAnswered = answeredCount === questions.length;

  const scores = questions.reduce(
    (acc, q) => {
      const answerIdx = answers[q.id];
      if (answerIdx === undefined) return acc;
      const picked = q.answers[answerIdx].scores;
      return { rent: acc.rent + picked.rent, buy: acc.buy + picked.buy, build: acc.build + picked.build };
    },
    { rent: 0, buy: 0, build: 0 } as Record<OptionId, number>
  );

  const winner = (Object.keys(scores) as OptionId[]).reduce((a, b) =>
    scores[a] >= scores[b] ? a : b
  );
  const maxScore = Math.max(scores.rent, scores.buy, scores.build, 1);

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-3xl font-bold text-foreground mb-2">
          The AdTech Dilemma: Build vs Rent vs Buy
        </h1>
        <p className="text-muted-foreground">
          When it comes to selecting an AdTech platform, there's no one-size-fits-all answer.
          Businesses must decide between renting, buying, or building — each with unique benefits
          and drawbacks.
        </p>
      </motion.div>

      {/* Three options */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelectedOption(option.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all",
              selectedOption === option.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/50"
            )}
          >
            {option.icon}
            <span className="font-medium">{option.name}</span>
          </button>
        ))}
      </motion.div>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="glass rounded-xl p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className={cn(
                "w-12 h-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-white shrink-0",
                current.color
              )}
            >
              {current.icon}
            </div>
            <div>
              <h2 className="font-display text-xl font-semibold">
                {current.name}
                <span className="text-muted-foreground font-normal text-base ml-2">
                  {current.tagline}
                </span>
              </h2>
              <p className="text-muted-foreground text-sm mt-1">{current.description}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Check className="w-4 h-4 text-green-500" />
                Advantages
              </h3>
              <div className="space-y-3">
                {current.advantages.map((item) => (
                  <div key={item.title} className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Challenges
              </h3>
              <div className="space-y-3">
                {current.challenges.map((item) => (
                  <div key={item.title} className="p-3 rounded-lg bg-card border border-border">
                    <p className="text-sm font-medium text-foreground">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Decision helper */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass rounded-xl p-6"
      >
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h2 className="font-display text-xl font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Which Should You Choose?
            </h2>
            <p className="text-muted-foreground text-sm">
              Your choice depends on business maturity, budget, urgency to launch, and long-term
              control needs. Answer all four to see a recommendation.
            </p>
          </div>
          {answeredCount > 0 && (
            <button
              onClick={() => setAnswers({})}
              className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-muted-foreground/50 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Start over
            </button>
          )}
        </div>

        <div className="space-y-5">
          {questions.map((q) => (
            <div key={q.id}>
              <p className="text-sm font-medium text-foreground mb-2">{q.question}</p>
              <div className="flex flex-wrap gap-2">
                {q.answers.map((a, i) => (
                  <button
                    key={a.label}
                    onClick={() => setAnswers((prev) => ({ ...prev, [q.id]: i }))}
                    className={cn(
                      "px-3 py-2 rounded-lg border text-xs transition-all text-left",
                      answers[q.id] === i
                        ? "bg-primary/10 border-primary/30 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    )}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <AnimatePresence>
          {allAnswered && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-6 p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30"
            >
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="w-4 h-4 text-primary" />
                <h3 className="font-display font-semibold text-foreground">
                  Recommended:{" "}
                  <span className="text-primary capitalize">{winner}</span>
                </h3>
              </div>

              <div className="space-y-2 mb-4">
                {(["rent", "buy", "build"] as OptionId[]).map((id) => (
                  <div key={id} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-12 capitalize">{id}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className={cn(
                          "h-full rounded-full",
                          id === winner ? "bg-gradient-to-r from-primary to-accent" : "bg-muted-foreground/40"
                        )}
                        initial={{ width: 0 }}
                        animate={{ width: `${(scores[id] / maxScore) * 100}%` }}
                        transition={{ duration: 0.4 }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{scores[id]}</span>
                  </div>
                ))}
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {recommendationCopy[winner]}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Comparison matrix */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-xl p-6"
      >
        <h2 className="font-display text-xl font-semibold mb-4">Side-by-Side Comparison</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-3 text-muted-foreground font-medium"></th>
                <th className="text-left py-3 px-3 text-green-500 font-semibold">Rent</th>
                <th className="text-left py-3 px-3 text-blue-500 font-semibold">Buy</th>
                <th className="text-left py-3 px-3 text-purple-500 font-semibold">Build</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label} className="border-b border-border/50">
                  <td className="py-3 px-3 font-medium text-foreground">{row.label}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{row.rent}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{row.buy}</td>
                  <td className="py-3 px-3 text-muted-foreground text-xs">{row.build}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Key takeaways */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h2 className="font-display text-xl font-semibold mb-4">Key Takeaways</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {keyTakeaways.map((item, i) => (
            <motion.div
              key={item.n}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.45 + i * 0.05 }}
              className="flex gap-4 p-4 rounded-xl bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 text-sm font-bold">
                {item.n}
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-4 p-5 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/30">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start small, learn fast, and upgrade strategically — that's how you avoid costly missteps
            and end up with an AdTech stack that genuinely fits your business.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
