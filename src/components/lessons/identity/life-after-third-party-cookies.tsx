import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { IdentifierGrid, toggleClass } from "./_shared";

const REASONS = [
  "Cross-site identification is essential for targeting, measurement, and attribution across the advertising ecosystem",
  "Browsers don't generate or expose a persistent user ID that works across sessions or sites",
  "Third-party cookies are disappearing under privacy law and browser restrictions",
  "A cookie can only be read by the domain that created it, blocking visibility across domains",
  "Cookie syncing consumes resources, adds latency, and creates synchronization errors",
  "Syncing isn't always accurate — mismatched or missing cookies leave incomplete profiles",
  "Walled gardens like Google and Meta already have a login-based, people-based ID advantage",
  "Mobile tracking faces new barriers as access to device identifiers becomes restricted",
];

const AUDIENCE_START = 100_000;
const SYNC_LOSS_PER_HOP = 0.35;
const UNIVERSAL_ID_LOSS_PER_HOP = 0.03;
const MAX_STEP = 2;

function Body() {
  const [step, setStep] = useState(0);

  const syncedAudience = Math.round(AUDIENCE_START * Math.pow(1 - SYNC_LOSS_PER_HOP, step));
  const universalAudience = Math.round(AUDIENCE_START * Math.pow(1 - UNIVERSAL_ID_LOSS_PER_HOP, step));

  const syncedPct = Math.round((syncedAudience / AUDIENCE_START) * 100);
  const universalPct = Math.round((universalAudience / AUDIENCE_START) * 100);

  const siteLabel = ["Site A", "Site B", "Site C"][step] ?? "Site C";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Third-party cookies were never a comfortable foundation — they only ever solved
          cross-site identification by way of cookie syncing, mapping one platform's user ID to
          another's. As that foundation disappears, the industry lists several reasons a
          replacement is needed, not just one:
        </p>
      </div>

      <section>
        <ul className="space-y-2">
          {REASONS.map((reason) => (
            <li key={reason} className="flex gap-3 text-muted-foreground">
              <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">The replacement: universal IDs</h3>
        <p className="measure mb-4 text-muted-foreground">
          A universal ID is an identifier interoperable across supply-side platforms (SSPs) and
          demand-side platforms (DSPs), letting a person be recognized consistently across that
          whole ecosystem. It serves the same purpose as a third-party cookie — tracking, targeting,
          measurement — but is derived from first-party data such as a cookie or a mobile device ID
          instead of being synced hop by hop. Some universal IDs work inside one environment only,
          such as the browser; others rely on a device graph to bridge a browser-based ID with an ID
          generated on a mobile device.
        </p>
        <IdentifierGrid ids={["universal"]} label="Universal ID identifier card" />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Follow the same {AUDIENCE_START.toLocaleString()}-person audience across three sites. The
          cookie-sync path loses a share of matches at every hop — latency, mismatch, a blocked
          cookie. A universal ID travels with the person instead of being resynced, so it barely
          loses anyone. Advance through the sites and watch the gap widen.
        </p>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(MAX_STEP, s + 1))}
            disabled={step >= MAX_STEP}
            className={toggleClass(false)}
          >
            {step === 0 ? "Move to Site B" : step === 1 ? "Move to Site C" : "Reached Site C"}
          </button>
          <button type="button" onClick={() => setStep(0)} className={toggleClass(false)}>
            Reset to Site A
          </button>
        </div>

        <p className="measure mt-4 text-sm text-muted-foreground">
          Currently on <span className="text-foreground">{siteLabel}</span>, after{" "}
          <span className="figure">{step}</span> sync hop{step === 1 ? "" : "s"}.
        </p>

        <div className="mt-4 space-y-4">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Cookie syncing</span>
              <span className="figure text-foreground">
                {syncedAudience.toLocaleString()} matched ({syncedPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-secondary-foreground/40" style={{ width: `${syncedPct}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Universal ID</span>
              <span className="figure text-foreground">
                {universalAudience.toLocaleString()} matched ({universalPct}%)
              </span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${universalPct}%` }} />
            </div>
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Nobody deliberately breaks a cookie sync — every hop just carries its own latency,
          mismatch rate, and chance of a blocked cookie, and those losses compound. A universal ID
          removes the need to resync at every stop, which is the entire reason it can survive where
          cookie syncing cannot.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone on your team will ask why the company should adopt UID2 or ID5 instead of just
      syncing cookies harder. The answer isn't that syncing is done badly — it's that every sync is
      a chance to lose the user, and a universal ID is built to skip that step entirely.
    </p>
  ),
  objectives: [
    "Name at least three reasons the industry needs an identifier to replace third-party cookies",
    "Define a universal ID and explain what it's derived from",
    "Explain why cookie syncing loses matches at every hop while a universal ID does not",
    "Say the difference between a single-environment universal ID and one bridged by a device graph",
  ],
  Body,
  takeaways: [
    "Cookies need replacing for more than one reason: browsers expose no persistent ID, third-party cookies are disappearing, syncing is inefficient and inaccurate, and walled gardens already have a login-based advantage.",
    "A universal ID is an identifier interoperable across SSPs and DSPs, derived from first-party data like a cookie or a mobile device ID, that serves the same tracking, targeting, and measurement purpose as a third-party cookie without needing to be synced hop by hop.",
    "Cookie syncing loses a share of users at every platform-to-platform hop through latency, mismatches, and blocked cookies, which is exactly what a universal ID that travels with the person is built to avoid.",
  ],
  checkYourself: [
    {
      question:
        "If cookie syncing loses users at every hop, why not just fix it by syncing more often or through more partners?",
      answer: (
        <p>
          More syncing means more hops, and every hop adds its own latency and mismatch risk — so
          syncing harder increases loss rather than fixing it. The actual fix is removing the need to
          sync at all, which is what a universal ID that travels natively with the user does.
        </p>
      ),
    },
    {
      question: "Why do many universal IDs require a user to authenticate, such as by logging in with an email?",
      answer: (
        <p>
          Because they are derived from deterministic first-party data — most often a hashed email
          — rather than from ordinary browsing behavior. That data only exists once someone has
          taken an authenticated action like logging in or subscribing.
        </p>
      ),
    },
  ],
};

export default lesson;
