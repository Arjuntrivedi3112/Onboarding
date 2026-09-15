import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface Channel {
  id: string;
  name: string;
  job: string;
  signals: string[];
  sourced: boolean;
}

/**
 * Seven channels. Display, video/connected TV, search, social, and mobile each
 * have a dedicated bullet in the book's "AI in Advertising Mediums and
 * Channels" section. Audio and native are only named as two of the channels
 * AI's unified buying strategy connects — the book never gives them their own
 * bullet, which is flagged below rather than quietly invented.
 */
const CHANNELS: Channel[] = [
  {
    id: "display",
    name: "Display",
    job: "Bid optimization and dynamic creative optimization",
    signals: ["User behavior and browsing context", "Predicted click-through and conversion performance"],
    sourced: true,
  },
  {
    id: "video",
    name: "Video and connected TV",
    job: "Dynamic ad insertion and contextual targeting",
    signals: [
      "Viewer habits, engagement patterns, and content preferences",
      "Visual and audio cues, read by machine learning models, to match ads with the right content environment",
    ],
    sourced: true,
  },
  {
    id: "search",
    name: "Search",
    job: "Automated bidding and keyword optimization",
    signals: [
      "Forecasted click-through and conversion rates per keyword",
      "Historical performance and trends, used to suggest new keyword opportunities",
    ],
    sourced: true,
  },
  {
    id: "social",
    name: "Social",
    job: "Audience modeling and creative testing",
    signals: ["User interests, behaviors, and interactions", "Continuous A/B testing of ad formats and messaging"],
    sourced: true,
  },
  {
    id: "mobile",
    name: "Mobile",
    job: "Location targeting and frequency management",
    signals: [
      "Location, app usage analysis, and in-app behavioral insights",
      "Frequency capping, to keep delivery timely without wearing out the user",
    ],
    sourced: true,
  },
  {
    id: "audio",
    name: "Audio",
    job: "Bid optimization and contextual matching, carried over from display and video",
    signals: ["Listener context, such as the program or podcast playing"],
    sourced: false,
  },
  {
    id: "native",
    name: "Native",
    job: "Content matching, carried over from display",
    signals: ["The surrounding editorial content, so the ad blends into the feed or page"],
    sourced: false,
  },
];

function ChannelBoard() {
  const [openId, setOpenId] = useState<string>("display");
  const open = CHANNELS.find((c) => c.id === openId) ?? CHANNELS[0];

  return (
    <div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Choose a channel">
        {CHANNELS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setOpenId(c.id)}
            aria-pressed={openId === c.id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors",
              openId === c.id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="mt-4 rounded-lg border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h4 className="text-lg text-foreground">{open.name}</h4>
          {!open.sourced && (
            <span className="text-xs uppercase text-muted-foreground">Extended from the book's unified list</span>
          )}
        </div>
        <p className="measure mt-1 text-muted-foreground">{open.job}</p>
        <ul className="mt-3 space-y-2">
          {open.signals.map((signal) => (
            <li key={signal} className="flex gap-3 text-sm text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{signal}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

interface Touchpoint {
  channel: string;
  value: number;
}

const TOUCHPOINTS: Touchpoint[] = [
  { channel: "Social", value: 0.9 },
  { channel: "Mobile", value: 0.55 },
  { channel: "Display", value: 0.4 },
];

const SORTED_BY_VALUE = [...TOUCHPOINTS].sort((a, b) => b.value - a.value);
const BEST = SORTED_BY_VALUE[0];
const REST = SORTED_BY_VALUE.slice(1);
const NEW_USERS = ["Alex", "Priya"];

function OrchestrationToggle() {
  const [mode, setMode] = useState<"siloed" | "unified">("siloed");

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choose how the budget is managed">
        {(["siloed", "unified"] as const).map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setMode(id)}
            aria-pressed={mode === id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              mode === id
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {id === "siloed" ? "Siloed, per channel" : "Unified, cross-channel"}
          </button>
        ))}
      </div>

      <p className="measure mt-4 text-sm text-muted-foreground">
        Three channels each have <span className="figure">${TOUCHPOINTS.reduce((s, t) => s + t.value, 0).toFixed(2)}</span> of
        budget and independently decide to reach Jamie today.
      </p>

      <ul className="mt-3 space-y-2">
        {mode === "siloed" ? (
          TOUCHPOINTS.map((t, i) => (
            <li key={t.channel} className="rounded-lg border border-border p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">{t.channel} serves Jamie</span>
                <span className="figure text-muted-foreground">${t.value.toFixed(2)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                {i === 0
                  ? "The one impression Jamie was going to act on anyway"
                  : "Jamie already saw this ad from another channel today — redundant"}
              </span>
            </li>
          ))
        ) : (
          <>
            <li className="rounded-lg border border-primary bg-primary/10 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-foreground">{BEST.channel} serves Jamie</span>
                <span className="figure text-foreground">${BEST.value.toFixed(2)}</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Frequency capped at one — no other channel will serve Jamie again today
              </span>
            </li>
            {REST.map((t, i) => (
              <li key={t.channel} className="rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-foreground">
                    {t.channel} redirects to {NEW_USERS[i] ?? "a new user"}
                  </span>
                  <span className="figure text-muted-foreground">${t.value.toFixed(2)}</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Budget that would have repeated Jamie's ad instead reaches someone unseen today
                </span>
              </li>
            ))}
          </>
        )}
      </ul>

      <p className="measure mt-4 text-sm text-muted-foreground">
        {mode === "siloed"
          ? "Same total spend, one person, three impressions — frequency 3, and two of the three dollars bought nothing beyond what the first already bought."
          : "Same total spend, three people, one impression each — the budget that used to repeat itself now buys new reach instead."}
      </p>
    </div>
  );
}

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          In programmatic advertising, AI connects all digital channels — display, video, mobile,
          audio, and native — into a unified buying strategy. It orchestrates cross-channel
          campaigns, ensures cohesive messaging, and provides real-time feedback for continuous
          optimization.
        </p>
        <p>
          Nothing in that sentence is a new technique. Every channel below runs one of the jobs
          earlier lessons already covered — bidding, creative assembly, audience modeling — aimed at
          that channel's own signals. What is new here is the word "unified": the same person, seen
          across channels, has to be recognized as one person, not seven strangers.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — every channel, one job at a time</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Click a channel. Two of the seven — audio and native — are only named as part of the
          book's unified list, with no dedicated bullet of their own; their AI job below is carried
          over from the closest channel that does have one, not invented from nothing.
        </p>
        <ChannelBoard />
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Video and connected TV, and mobile, in more detail</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Video and connected TV</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              AI enhances targeting and personalization by analyzing viewer habits, engagement
              patterns, and content preferences. It enables dynamic ad insertion and contextual
              targeting using machine learning models that process visual and audio cues to match
              ads with the most appropriate content environments.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Mobile</p>
            <p className="measure mt-1 text-sm text-muted-foreground">
              Mobile advertising benefits from AI through improved location-based targeting, app
              usage analysis, and in-app behavioral insights. AI helps deliver more relevant and
              timely mobile ads while managing frequency capping and ensuring a seamless user
              experience.
            </p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — siloed versus unified budget</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Three channels, one shared user named Jamie, the same total budget. Switch between
          managing each channel's budget on its own and letting AI recognize Jamie across all three.
        </p>
        <OrchestrationToggle />
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      You will be handed a cross-channel budget and asked why the same person was served the same
      ad five times last week. The channels were not broken — each one was doing exactly what a
      siloed AI is built to do, alone, without knowing the others existed.
    </p>
  ),
  objectives: [
    "Name the AI job that runs in each of display, video and connected TV, search, social, mobile, audio, and native",
    "Explain what 'AI connects channels into a unified buying strategy' means in concrete terms",
    "Say what breaks when each channel's budget is managed in a silo instead of together",
  ],
  Body,
  takeaways: [
    "Every channel runs a job this section already introduced — bidding, creative assembly, audience modeling — aimed at that channel's own signals: visual and audio cues for video and connected TV, keywords for search, app behavior and location for mobile.",
    "A unified buying strategy means one identity is recognized across channels, so frequency is capped globally instead of per channel, and budget can move to wherever it is doing the most good.",
    "Managing each channel's budget in a silo does not just waste money on redundant impressions to the same person — it starves the reach that same money could have bought elsewhere.",
  ],
  checkYourself: [
    {
      question:
        "Two of these seven channels don't have a dedicated AI bullet in the book, only a mention in the unified list. Which two, and what AI job would you extend to them anyway?",
      answer: (
        <p>
          Audio and native. The book names them only as part of "AI connects all digital channels —
          display, video, mobile, audio, and native — into a unified buying strategy," without a
          channel-specific bullet the way display, video and connected TV, search, social, and mobile
          each get. The closest reasonable extension is the same bid optimization and contextual
          matching used elsewhere: matching an audio ad to the program playing, or a native ad to the
          surrounding editorial content.
        </p>
      ),
    },
    {
      question:
        "A dashboard shows the same user was served an ad by three different channels today, all from your company. Under a siloed setup, is that a bug?",
      answer: (
        <p>
          No — it is siloed budget management behaving exactly as designed. Each channel's AI
          optimizes only what it can see, and none of them can see that the other two already reached
          this person. That gap is the entire argument for a unified, cross-channel view rather than
          evidence that any one channel malfunctioned.
        </p>
      ),
    },
  ],
};

export default lesson;
