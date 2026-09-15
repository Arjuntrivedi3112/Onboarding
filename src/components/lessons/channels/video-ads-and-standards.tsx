import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

type BreakId = "pre" | "mid" | "post";

interface BreakSlot {
  id: BreakId;
  label: string;
  position: string;
}

const BREAKS: BreakSlot[] = [
  { id: "pre", label: "Pre-roll", position: "Before the content starts" },
  { id: "mid", label: "Mid-roll", position: "During the content" },
  { id: "post", label: "Post-roll", position: "After the content ends" },
];

const VIDEO_PROFILE: ChannelProfile = {
  title: "Video advertising",
  description:
    "The creative is sent to and displayed in a video player, rather than as part of the web page itself — the one detail that separates video from a text, image, or native ad.",
  formats: [
    { label: "Pre-roll" },
    { label: "Mid-roll" },
    { label: "Post-roll" },
    { label: "Outstream" },
    { label: "Rewarded video" },
  ],
  keyFeatures: [
    "Served by VAST, the Video Ad Serving Template",
    "Ad breaks positioned by VMAP, the Video Multi-Ad Playlist",
    "Interactivity layered on by SIMID, replacing the older VPAID",
    "Skippable versus non-skippable, with viewability measurement critical either way",
  ],
  techDetails:
    "VAST standardizes how the video ad itself is delivered, so any compliant ad server and video player can work together. VMAP is a separate XML framework that says where in the content the breaks go — pre-roll, mid-roll, post-roll. SIMID adds an optional interactive layer on top, kept apart from the measurement and verification pings so both keep working.",
};

function Body() {
  const [enabled, setEnabled] = useState<Record<BreakId, boolean>>({ pre: true, mid: true, post: true });
  const [playing, setPlaying] = useState<BreakId | null>(null);
  const [simid, setSimid] = useState(false);

  const activeBreaks = BREAKS.filter((b) => enabled[b.id]);

  function toggleBreak(id: BreakId) {
    setEnabled((prev) => ({ ...prev, [id]: !prev[id] }));
    setPlaying(null);
  }

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Video advertising means the ad itself is a video. Serving one is similar to serving an
          image, text, or native ad, with one difference that changes everything downstream: the
          creative is sent to and displayed inside a{" "}
          <span className="text-foreground">video player</span>, rather than as part of the web page
          itself.
        </p>
        <p>
          Because the player, not the page, is in charge of rendering, most video ads are served
          through protocols the IAB Tech Lab (Interactive Advertising Bureau's technical standards
          body) publishes for exactly this purpose.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Three standards, three jobs</h3>
        <ul className="grid gap-2 sm:grid-cols-3">
          <li className="rounded-lg border border-border bg-card p-3">
            <p className="text-foreground">
              VAST <span className="text-sm text-muted-foreground">Video Ad Serving Template</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              An XML framework that standardizes how a video ad is delivered, so an ad server and a
              video player can trust they speak the same language.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <p className="text-foreground">
              VMAP <span className="text-sm text-muted-foreground">Video Multi-Ad Playlist</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              A separate XML framework that specifies where ads are inserted within the content —
              pre-roll, mid-roll, post-roll.
            </p>
          </li>
          <li className="rounded-lg border border-border bg-card p-3">
            <p className="text-foreground">
              SIMID <span className="text-sm text-muted-foreground">Safe Interactive Media Interface Definition</span>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Simplifies interactivity by separating it from measurement and verification, which
              other specifications keep handling underneath.
            </p>
          </li>
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          A fourth term you will still hear, VPAID (Video Player Ad Interface Definition), is the
          older interactive standard — SIMID is its replacement, not a peer standing beside it.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Build an ad pod schedule with VMAP by turning breaks on or off, then play one and watch it
          fire a VAST response into the player — not onto the page. Switch on SIMID to layer an
          interactive overlay on top.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose which ad breaks VMAP inserts">
          {BREAKS.map((brk) => (
            <button
              key={brk.id}
              type="button"
              onClick={() => toggleBreak(brk.id)}
              aria-pressed={enabled[brk.id]}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                enabled[brk.id]
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {brk.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Content timeline, per VMAP</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {BREAKS.map((brk) => (
              <span
                key={brk.id}
                className={cn(
                  "rounded-full px-3 py-1.5 text-sm",
                  enabled[brk.id] ? "bg-secondary text-foreground" : "text-muted-foreground line-through"
                )}
              >
                {brk.label}
              </span>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {activeBreaks.map((brk) => (
              <button
                key={brk.id}
                type="button"
                onClick={() => setPlaying(brk.id)}
                className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Play {brk.label.toLowerCase()}
              </button>
            ))}
          </div>

          {playing && (
            <div className="mt-4 rounded-md border border-border-strong bg-secondary p-4">
              <p className="text-sm text-foreground">
                VAST response fired into the player for the {BREAKS.find((b) => b.id === playing)?.label.toLowerCase()}{" "}
                break — {BREAKS.find((b) => b.id === playing)?.position.toLowerCase()}.
              </p>
              {simid && (
                <p className="measure mt-2 text-sm text-muted-foreground">
                  A SIMID overlay sits on top for interactivity, while the underlying measurement and
                  verification pings keep firing on their own, untouched by whatever the overlay does.
                </p>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Toggle a SIMID interactive overlay">
            <button
              type="button"
              onClick={() => setSimid((s) => !s)}
              aria-pressed={simid}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                simid
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {simid ? "Remove SIMID overlay" : "Add SIMID overlay"}
            </button>
          </div>
        </div>
      </section>

      <ChannelDetail profile={VIDEO_PROFILE} />
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone asks why a video ad "only works in the player and not on the page," and the honest
      answer is that this is the whole design — the creative was never part of the page to begin
      with. Knowing which of VAST, VMAP, and SIMID owns which job is what lets you tell a delivery
      bug from a placement bug from a broken interactive overlay.
    </p>
  ),
  objectives: [
    "Explain why a video ad's creative goes to the player rather than the page",
    "Name what VAST, VMAP, and SIMID each do, spelled out in full",
    "Place VPAID correctly as the older standard SIMID replaces, not a peer alongside it",
  ],
  Body,
  takeaways: [
    "A video ad's creative is sent to and rendered inside the video player, not the page itself — the one fact that separates video from every other format in this chapter.",
    "VAST standardizes how a video ad is delivered so ad servers and players agree on the format; VMAP specifies where in the content the ad breaks — pre-roll, mid-roll, post-roll — are inserted; SIMID layers interactivity on top, kept separate from measurement and verification.",
    "VPAID, the older interactive standard, is being replaced by SIMID rather than sitting alongside it as an equal.",
  ],
  checkYourself: [
    {
      question: "Serving a video ad is like serving a display ad except for one detail. What's the detail?",
      answer: (
        <p>
          The creative is sent to and displayed inside a video player, not rendered as part of the
          web page. Everything else about the request-and-deliver flow is comparable.
        </p>
      ),
    },
    {
      question: "Which standard decides where in the content an ad break sits?",
      answer: (
        <p>
          VMAP, the Video Multi-Ad Playlist. VAST governs how the ad itself is delivered once a break
          has already been placed; VMAP is what places the breaks.
        </p>
      ),
    },
    {
      question: "A publisher wants a \"click to learn more\" interactive layer on a video ad, without breaking the measurement pixels already in place. Which standard applies, and what does it guarantee?",
      answer: (
        <p>
          SIMID. It is built specifically to keep an ad's interactivity separate from its measurement
          and verification, so the existing pixels keep firing correctly no matter what the
          interactive layer does on top.
        </p>
      ),
    },
  ],
};

export default lesson;
