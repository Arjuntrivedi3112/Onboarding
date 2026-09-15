import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { computeCredit, KIND_LABELS, type Touchpoint } from "./_shared";

type Device = "phone" | "laptop";

interface DeviceTouchpoint extends Touchpoint {
  device: Device;
}

/** One person, two devices. Only the platform's matching method decides how
 * much of this it can actually see. */
const JOURNEY: DeviceTouchpoint[] = [
  { id: "d1", channel: "Display ad", kind: "display", daysAgo: 10, device: "phone" },
  { id: "d2", channel: "Social ad", kind: "social", daysAgo: 6, device: "phone" },
  { id: "d3", channel: "Email click", kind: "email", daysAgo: 2, device: "laptop" },
  { id: "d4", channel: "Purchase", kind: "direct", daysAgo: 0, device: "laptop" },
];

type MatchMethod = "cookies" | "deterministic" | "probabilistic" | "hybrid";

const METHODS: { id: MatchMethod; label: string }[] = [
  { id: "cookies", label: "Cookies only" },
  { id: "deterministic", label: "Deterministic matching" },
  { id: "probabilistic", label: "Probabilistic matching" },
  { id: "hybrid", label: "Hybrid matching" },
];

type Confidence = "confirmed" | "estimated" | null;

function visibleGroup(method: MatchMethod): { visible: DeviceTouchpoint[]; confidence: Record<string, Confidence> } {
  switch (method) {
    case "cookies":
      // A cookie never leaves its device. Only the laptop session — the one
      // that contains the conversion — is visible at all.
      return {
        visible: JOURNEY.filter((t) => t.device === "laptop"),
        confidence: {},
      };
    case "deterministic": {
      // The user logged in on the social ad, and again on the laptop. That
      // shared identifier links three touchpoints; the display ad happened
      // before any login, so it has nothing to match on.
      const visible = JOURNEY.filter((t) => t.id !== "d1");
      return { visible, confidence: { d2: "confirmed", d3: "confirmed", d4: "confirmed" } };
    }
    case "probabilistic": {
      // No login is used at all here — every link, including the ones
      // deterministic matching would have been sure about, is an estimate
      // from signals like IP address and device characteristics.
      const confidence: Record<string, Confidence> = {};
      JOURNEY.forEach((t) => (confidence[t.id] = "estimated"));
      return { visible: JOURNEY, confidence };
    }
    case "hybrid":
      // The deterministic core stays confirmed; the one touchpoint
      // deterministic matching couldn't reach is added back in with a
      // probabilistic estimate instead of being left orphaned.
      return {
        visible: JOURNEY,
        confidence: { d1: "estimated", d2: "confirmed", d3: "confirmed", d4: "confirmed" },
      };
  }
}

function Body() {
  const [method, setMethod] = useState<MatchMethod>("cookies");
  const { visible, confidence } = visibleGroup(method);
  const orphans = JOURNEY.filter((t) => !visible.includes(t));
  const credit = computeCredit(visible, "linear", { first: 50, last: 30 });

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every model in the last two lessons attributes conversions across different channels.
          Cross-device attribution — sometimes called multi-touch attribution when it's framed as
          spanning browsers, devices, and channels all at once — records interactions across
          multiple touchpoints and devices and attributes the conversion accordingly.
        </p>
        <p>
          To do that, platforms have traditionally relied on third-party cookies. A cookie is tied
          to a single device and browser, so it can't transfer between environments — a cookie set
          on a phone's browser is invisible to that same person's laptop. On its own, a cookie
          can't tell you these two sessions belong to the same customer at all.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          One person, one purchase, two devices. Switch the matching method and watch how much of
          the journey the platform can actually connect to that final purchase.
        </p>

        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {JOURNEY.map((tp) => (
            <div key={tp.id} className="rounded-lg border border-border bg-card p-3">
              <p className="text-sm text-foreground">{tp.channel}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {tp.device === "phone" ? "Phone" : "Laptop"}
              </p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a matching method">
          {METHODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              aria-pressed={method === m.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                method === m.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            What the platform can connect to this purchase, credited with the linear model:
          </p>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${visible.length || 1}, minmax(0, 1fr))` }}>
            {visible.map((tp, i) => (
              <div key={tp.id} className="min-w-0">
                <div className="mb-1 flex items-center justify-between gap-1">
                  <span className="truncate text-sm text-muted-foreground">{tp.channel}</span>
                  {confidence[tp.id] && (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-2 py-0.5 text-sm",
                        confidence[tp.id] === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : "bg-secondary text-muted-foreground"
                      )}
                    >
                      {confidence[tp.id] === "confirmed" ? "Confirmed" : "Estimated"}
                    </span>
                  )}
                </div>
                <div className="relative h-10 overflow-hidden rounded bg-secondary">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary/70 transition-[width] duration-300"
                    style={{ width: `${credit[i]}%` }}
                  />
                  <span className="figure absolute inset-0 flex items-center justify-center text-sm text-foreground">
                    {credit[i].toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {orphans.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <p className="mb-2 text-sm text-muted-foreground">Not connected to this conversion:</p>
              <div className="flex flex-wrap gap-2">
                {orphans.map((tp) => (
                  <span
                    key={tp.id}
                    className="rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground"
                  >
                    {tp.channel} ({tp.device})
                  </span>
                ))}
              </div>
              <p className="measure mt-2 text-sm text-muted-foreground">
                {method === "cookies"
                  ? "Cookies never left the phone, so this entire earlier session is invisible to the platform — it isn't discounted, it simply was never linked to this customer at all."
                  : "No identifier or estimated signal connects this touchpoint to the rest of the journey, so it stays out of the credit split entirely."}
              </p>
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">Deterministic matching</h4>
          <p className="text-sm text-muted-foreground">
            Relies on common, unique identifiers — an email address or phone number — to accurately
            recognize and link the same user across devices. High accuracy, but only where that
            identifier was actually captured.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">Probabilistic matching</h4>
          <p className="text-sm text-muted-foreground">
            Uses non-unique signals — IP address, device characteristics, location data — and
            applies algorithms and statistical modeling to estimate whether two devices belong to
            the same person. Wider reach, lower certainty.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">Hybrid matching</h4>
          <p className="text-sm text-muted-foreground">
            Uses a deterministic core as its confirmed foundation, then extends that graph with
            probabilistic estimates to reach devices that never shared a login signal at all.
          </p>
        </div>
      </div>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          AdTech and MarTech companies build user profiles out of these identifiers and signals,
          then connect them through an identity or device graph — a data structure that maps the
          relationships between users, devices, and browsers.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary p-4">
          <h4 className="mb-1 text-sm text-foreground">Walled gardens</h4>
          <p className="text-sm text-muted-foreground">
            Cross-device attribution is significantly easier here — they hold deterministic login
            data and account IDs, and users tend to stay logged in across every device they own.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-secondary p-4">
          <h4 className="mb-1 text-sm text-foreground">Independent platforms</h4>
          <p className="text-sm text-muted-foreground">
            Brands, agencies, and independent AdTech rely on a data management platform (DMP) to
            unify fragmented data — aggregating online and offline sources, building profiles, and
            constructing the identity graphs used for targeting, measurement, and attribution.
          </p>
        </div>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A media plan will underfund the phone-first channels that started a journey, because whatever
      platform ran the numbers only ever saw the laptop where the purchase actually happened. That
      isn't a tracking bug — it's the default behavior of a cookie, which was never built to follow
      one person across two devices. Knowing what deterministic, probabilistic, and hybrid matching
      each actually recover is what tells you how much of that missing credit is recoverable at all.
    </p>
  ),
  objectives: [
    "Explain why a third-party cookie cannot connect a phone session to a laptop session on its own",
    "Distinguish deterministic, probabilistic, and hybrid matching, and say which one a given signal supports",
    "Explain what an identity or device graph is, and why walled gardens build one more easily than independent platforms",
  ],
  Body,
  takeaways: [
    "A cookie is tied to one device and browser, so on its own it cannot connect a phone session to a laptop session — every device looks like a different, unrelated person.",
    "Deterministic matching links devices using a shared identifier such as an email address or phone number and is highly accurate; probabilistic matching estimates a link from non-unique signals like IP address and device characteristics; hybrid matching uses a deterministic core and extends it probabilistically to devices with no shared login at all.",
    "Walled gardens link devices easily because users stay logged in with deterministic account data; independent platforms instead rely on a DMP to unify fragmented online and offline signals into an identity graph.",
  ],
  checkYourself: [
    {
      question:
        "Of the three matching methods, which one gives you the highest confidence that two devices belong to the same person, and why?",
      answer: (
        <p>
          Deterministic matching. It relies on a unique identifier the person themselves provided —
          an email address, a phone number, a login — rather than an inference drawn from signals
          like IP address or device characteristics that could plausibly belong to more than one
          person.
        </p>
      ),
    },
    {
      question:
        "An advertiser sees a conversion attributed entirely to a laptop purchase and cuts the phone-targeted budget that started the journey. Using the simulator above, what matching upgrade recovers that phone touchpoint, and what's the catch?",
      answer: (
        <p>
          Moving from cookies to deterministic matching recovers any touchpoint that shares a login
          signal with the converting session — but the earliest touchpoint, seen before any login
          happened, is still invisible even then. Reaching it at all requires probabilistic or
          hybrid matching, and the catch is right there in the label: that link is an estimate, not
          a fact, so the credit it receives is only as good as the model that produced it.
        </p>
      ),
    },
  ],
};

export default lesson;
