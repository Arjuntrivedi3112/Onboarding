import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface AiNote {
  title: string;
  detail: string;
}

const AI_BY_CHANNEL: AiNote[] = [
  {
    title: "Display",
    detail:
      "Powers programmatic buying through real-time bidding (RTB), evaluating each impression on user behavior, context, and predicted performance. A demand-side platform (DSP) uses it to automate bid strategy, budget allocation, and placement selection.",
  },
  {
    title: "Video and connected TV (CTV)",
    detail:
      "Enhances targeting and personalization from viewer habits and engagement, enables dynamic ad insertion, and uses machine learning on visual and audio cues to match ads to the right content.",
  },
  {
    title: "Search",
    detail:
      "Streamlines automated bidding, keyword optimization, and predictive analytics — forecasting click-through rate (CTR) and conversion, adjusting bids in real time, and suggesting new keywords.",
  },
  {
    title: "Social",
    detail:
      "Enables hyper-personalized experiences and dynamic creative optimization (DCO), automatically adapting format, visuals, and messaging to each user's profile and real-time context.",
  },
  {
    title: "Mobile",
    detail:
      "Improves location-based targeting, app-usage analysis, and in-app behavioral insight, while managing frequency capping so the same person isn't shown the same ad too often.",
  },
  {
    title: "Programmatic overall",
    detail:
      "Connects display, video, mobile, audio, and native into one buying strategy, orchestrating cross-channel campaigns with cohesive messaging and real-time optimization feedback.",
  },
  {
    title: "Measurement and fraud prevention",
    detail:
      "Supports advanced attribution modeling, audience validation, and real-time anomaly detection to protect media spend and keep performance numbers accurate.",
  },
];

type SurfaceId = "display" | "video" | "social" | "ctv" | "audio" | "dooh";

interface Surface {
  id: SurfaceId;
  label: string;
  figure?: string;
  status: "normal" | "capped" | "flagged";
  variant: (message: string) => string;
}

const SURFACES: Surface[] = [
  {
    id: "display",
    label: "Display banner",
    figure: "300×250",
    status: "capped",
    variant: (m) => m,
  },
  {
    id: "video",
    label: "Video pre-roll",
    figure: "15s",
    status: "normal",
    variant: (m) => `${m} — watch to the end for a bonus offer.`,
  },
  {
    id: "social",
    label: "Social feed card",
    status: "normal",
    variant: (m) => `${m} — tap to shop the look.`,
  },
  {
    id: "ctv",
    label: "CTV spot",
    figure: "30s",
    status: "normal",
    variant: (m) => `${m} Tonight only.`,
  },
  {
    id: "audio",
    label: "Audio read",
    status: "normal",
    variant: (m) => `${m} Ask your speaker to remind you.`,
  },
  {
    id: "dooh",
    label: "DOOH loop",
    status: "flagged",
    variant: (m) => m,
  },
];

function Body() {
  const [message, setMessage] = useState("Save 20% this weekend");
  const [aiOn, setAiOn] = useState(false);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A modern campaign rarely runs on one surface. The same brand message gets adapted for a
          display banner, a video pre-roll, a social feed card, a CTV spot, an audio read, and a
          digital out-of-home (DOOH) screen — six different shapes for one idea.
        </p>
        <p>
          AI is transforming digital advertising mediums and channels by enabling smarter, faster,
          and more precise campaign execution across the entire advertising lifecycle. What changes
          is specific to each channel, not a single blanket upgrade.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What AI changes, channel by channel</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {AI_BY_CHANNEL.map((note) => (
            <li key={note.title} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{note.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{note.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Write one brand message and watch it land on all six surfaces. Then switch AI on: dynamic
          creative optimization adapts the copy per surface, frequency capping holds one surface back
          from a viewer already reached, and anomaly detection flags a slice of suspicious traffic.
        </p>

        <label className="block">
          <span className="text-xs uppercase text-muted-foreground">Brand message</span>
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="mt-2 min-h-[2.75rem] w-full rounded-lg border border-border bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            placeholder="Type a message"
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Toggle AI-driven adaptation">
          <button
            type="button"
            onClick={() => setAiOn((a) => !a)}
            aria-pressed={aiOn}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              aiOn
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {aiOn ? "Turn AI off" : "Turn AI on"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {SURFACES.map((surface) => {
            const heldBack = aiOn && surface.status === "capped";
            const flagged = aiOn && surface.status === "flagged";
            const copy = aiOn ? surface.variant(message || "Your message") : message || "Your message";

            return (
              <div
                key={surface.id}
                className={cn(
                  "rounded-lg border p-4",
                  heldBack || flagged ? "border-border-strong bg-secondary" : "border-border bg-card"
                )}
              >
                <p className="text-xs uppercase text-muted-foreground">
                  {surface.label}
                  {surface.figure && <span className="figure ml-2">{surface.figure}</span>}
                </p>

                {heldBack ? (
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    Held back — frequency capping: this viewer has already seen this surface enough
                    times today.
                  </p>
                ) : flagged ? (
                  <p className="measure mt-1 text-sm text-muted-foreground">
                    Held back — real-time anomaly detection flagged this traffic slice as suspicious
                    before it could be billed.
                  </p>
                ) : (
                  <p className="measure mt-1 text-foreground">{copy}</p>
                )}

                {aiOn && !heldBack && !flagged && (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Dynamic creative optimization adapted this copy for the surface.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice that AI does not touch every surface the same way. Some ads get rewritten, one gets
          held back because the viewer has already seen it, and one gets pulled for review before it
          is ever counted. That variety is the point — programmatic advertising orchestrates all of
          it into a single, cohesive campaign rather than treating every channel identically.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A stakeholder calls a campaign "AI-powered" and expects that to mean one thing everywhere.
      Knowing what AI actually changes in each channel — and that a separate layer of it is quietly
      catching fraud in the background — is what lets you explain a performance jump, or a stalled
      surface, without waving at "the algorithm" as an answer.
    </p>
  ),
  objectives: [
    "Explain what AI changes in display, video/CTV, search, social, and mobile advertising",
    "Explain what programmatic orchestration means across channels",
    "Name what AI contributes to measurement and fraud prevention",
  ],
  Body,
  takeaways: [
    "The same brand message reaches six different surfaces in six different shapes, but AI is what decides the message that lands there, not just the size or length of it.",
    "AI's changes are channel specific: RTB and DSP bid automation in display, dynamic ad insertion and content-aware targeting in video and CTV, automated bidding and predictive CTR forecasting in search, dynamic creative optimization in social, and location targeting with frequency capping in mobile.",
    "Programmatic advertising uses AI to orchestrate all of that into one cross-channel buying strategy, while a separate layer handles attribution modeling, audience validation, and real-time anomaly detection to keep the numbers honest.",
  ],
  checkYourself: [
    {
      question: "What does dynamic creative optimization actually change about an ad?",
      answer: (
        <p>
          It automatically adapts the ad's format, visuals, and messaging to each user's profile and
          real-time context, rather than serving one fixed creative to everyone.
        </p>
      ),
    },
    {
      question: "What's the difference between AI's job inside one channel and its job in programmatic overall?",
      answer: (
        <p>
          Inside one channel, AI optimizes that channel's own levers — bids, targeting, creative.
          Across programmatic, AI orchestrates all the channels together into one buying strategy
          with cohesive messaging and real-time feedback.
        </p>
      ),
    },
    {
      question: "Fraud detection flags a spike of impressions from one DOOH screen at three in the morning. What kind of AI system caught this, and what happens next?",
      answer: (
        <p>
          Real-time anomaly detection, part of AI's role in measurement and fraud prevention. The
          traffic should be held out of billing and investigated before any spend against it is
          credited as real performance.
        </p>
      ),
    },
  ],
};

export default lesson;
