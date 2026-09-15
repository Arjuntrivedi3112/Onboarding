import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

/** The book's own examples, kept as the two sides of one distinction. */
const MEDIUMS = ["Text ads", "Image ads", "Video ads", "Audio ads", "Radio ads", "Native ads"];
const CHANNELS = ["Display", "Web", "Mobile app", "Social media", "TV advertising", "Search"];

type ConsentChoice = "pending" | "accepted" | "declined";

const LOAD_STEPS = [
  {
    id: "tag",
    label: "The ad tag fires",
    detail:
      "The page includes a small HTML or JavaScript snippet — the ad tag — that acts as both a placeholder and an instruction for the browser.",
  },
  {
    id: "call",
    label: "The browser calls the ad server or exchange",
    detail: "The snippet tells the browser to reach out for content, rather than showing something on its own.",
  },
  {
    id: "auction",
    label: "An auction settles in milliseconds",
    detail:
      "Real-time bidding, RTB, decides which advertiser wins this placement — fast enough that the page never feels like it's waiting.",
  },
  {
    id: "fetch",
    label: "The winning creative is retrieved",
    detail:
      "HTML, JavaScript, images, or video come back from the advertiser's content delivery network (CDN) or ad server. Rich media, connected TV (CTV — a smart TV, console, or streaming device, not a laptop or phone), and shoppable ads often need an extra JavaScript software development kit (SDK) for interactivity.",
  },
  {
    id: "render",
    label: "The ad renders in an isolated container",
    detail:
      "Usually an iframe, which keeps the ad's own scripts separate from the page's — so a slow or broken ad cannot break the page around it.",
  },
] as const;

const DISPLAY_PROFILE: ChannelProfile = {
  title: "Display advertising",
  description: "Text and image ads on websites — the original online ad format, and still consistently popular.",
  formats: [
    { label: "Banner", figure: "728×90" },
    { label: "Banner", figure: "300×250" },
    { label: "Skyscraper" },
    { label: "Rectangle" },
    { label: "Interstitial" },
    { label: "Pop-up" },
  ],
  keyFeatures: [
    "Loaded via an ad tag — HTML or JavaScript",
    "Rendered in an isolated container, usually an iframe",
    "Placement decided by a real-time bidding (RTB) auction",
    "Creative fetched from the advertiser's content delivery network (CDN)",
  ],
  techDetails:
    "The ad tag is a placeholder and an instruction at once. It tells the browser to call an ad server or exchange, wait out an RTB auction that runs in milliseconds, retrieve the winning creative, and render it inside an isolated container — often an iframe — so the ad's scripts never touch the page's own.",
};

function Body() {
  const [consent, setConsent] = useState<ConsentChoice>("pending");
  const [step, setStep] = useState(0);

  const blocked = consent !== "accepted";
  const atEnd = step >= LOAD_STEPS.length - 1;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Digital pushed advertising far past print and television, and it did that in two separate
          directions at once. One is <span className="text-foreground">what</span> the ad actually
          is. The other is <span className="text-foreground">where</span> it travels to reach
          someone. The book keeps those apart on purpose, and mixing them up is an easy way to scope
          a project wrong.
        </p>
        <p>
          A <span className="text-foreground">medium</span> is a means of verbal or non-verbal
          communication — a text ad, a video ad, a radio ad. A{" "}
          <span className="text-foreground">channel</span> is a means of transmission or
          distribution — display, social media, TV advertising. The same medium can travel down
          several channels; the same channel can carry several mediums.
        </p>
        <p>
          When online advertising first appeared in the late 1990s, text and image ads were the only
          formats available. Many more have arrived since, but that original pair has remained
          consistently popular the whole time.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Sorted by the book's own definitions</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Mediums — what the ad is</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {MEDIUMS.map((item) => (
                <li key={item} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Channels — where it travels</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {CHANNELS.map((item) => (
                <li key={item} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Load a page carrying a web ad, step by step. Then decide whether the visitor agrees to
          tracking first, and watch where in the chain that decision actually bites.
        </p>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Choose whether the visitor consents to tracking"
        >
          <button
            type="button"
            onClick={() => setConsent("declined")}
            aria-pressed={consent === "declined"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              consent === "declined"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Decline tracking (TCF v2.2 / CCPA)
          </button>
          <button
            type="button"
            onClick={() => setConsent("accepted")}
            aria-pressed={consent === "accepted"}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              consent === "accepted"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Accept tracking
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">
            Step <span className="figure">{step + 1}</span> of{" "}
            <span className="figure">{LOAD_STEPS.length}</span>
          </p>
          <p className="measure mt-1 text-foreground">{LOAD_STEPS[step].label}</p>
          <p className="measure mt-2 text-sm text-muted-foreground">{LOAD_STEPS[step].detail}</p>

          {blocked && step === 0 && (
            <p className="measure mt-4 rounded-md border border-border-strong bg-secondary p-3 text-sm text-foreground">
              Blocked at the tag. The consent management framework — TCF v2.2 in the European Union,
              CCPA in the United States — holds the chain here until the visitor agrees to tracking.
              Nothing beyond this step happens without that.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(s + 1, LOAD_STEPS.length - 1))}
              disabled={blocked || atEnd}
              className="min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              Advance the chain
            </button>
            <button
              type="button"
              onClick={() => setStep(0)}
              className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reload the page
            </button>
          </div>
        </div>
      </section>

      <ChannelDetail profile={DISPLAY_PROFILE} />

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice what the consent gate does and does not touch: it sits in front of the auction, not
          inside it. Once a visitor accepts, the rest of the chain — call, auction, fetch, render —
          runs exactly the same way regardless of what the ad itself is made of.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A stakeholder says "let's expand into video" and someone else hears "let's expand into CTV" —
      those are two different decisions, one about what the ad is and one about where it plays.
      Confuse the two in a briefing and you scope the wrong project. And when a campaign in the
      European Union simply refuses to load, the first thing to check is not the auction — it's
      whether the visitor ever gave consent for the chain to start at all.
    </p>
  ),
  objectives: [
    "State the book's definitions of medium and channel, and sort an example into the right one",
    "List, in order, the five steps a browser runs to load a web ad",
    "Explain where a consent framework like TCF v2.2 or CCPA sits in that sequence, and what it blocks",
  ],
  Body,
  takeaways: [
    "A medium is what an ad is — text, video, audio; a channel is where it travels — display, social media, TV advertising — and the two are independent of each other.",
    "Loading a web ad runs a fixed sequence: the ad tag fires, the browser calls an ad server or exchange, an RTB auction settles in milliseconds, the winning creative is fetched, and it renders inside an isolated container.",
    "Consent frameworks like TCF v2.2 and CCPA sit at the very front of that chain and can delay or block it entirely until the visitor agrees to tracking.",
  ],
  checkYourself: [
    {
      question: '"Connected TV" — is that a medium or a channel?',
      answer: (
        <p>
          A channel. It describes where the ad travels — to an internet-connected TV device — not
          what the ad itself is made of. The video creative running on it is the medium.
        </p>
      ),
    },
    {
      question: "Why does the winning creative render inside an isolated iframe rather than directly on the page?",
      answer: (
        <p>
          So the ad's own scripts stay separate from the page's. If the creative is slow, broken, or
          misbehaving, that isolation keeps it from breaking the rest of the page around it.
        </p>
      ),
    },
    {
      question: "QA reports that ads are not loading for visitors in the European Union. Given the load sequence, where do you look first?",
      answer: (
        <p>
          The consent layer, before the ad tag ever calls out. Under TCF v2.2 the entire chain — the
          call to the exchange, the auction, the fetch, the render — stalls until the visitor agrees
          to tracking, so a consent management platform issue looks exactly like an ad that "isn't
          loading."
        </p>
      ),
    },
  ],
};

export default lesson;
