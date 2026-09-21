import { useState } from "react";

import { IqmSpotlight } from "@/components/journey/IqmSpotlight";
import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type SignalId = "email" | "ip" | "device" | "location";

const SIGNALS: Array<{ id: SignalId; label: string; kind: "deterministic" | "probabilistic" }> = [
  { id: "email", label: "Hashed email login", kind: "deterministic" },
  { id: "ip", label: "Shared IP address", kind: "probabilistic" },
  { id: "device", label: "Device characteristics", kind: "probabilistic" },
  { id: "location", label: "Location data", kind: "probabilistic" },
];

type MatchMode = "none" | "deterministic" | "probabilistic" | "hybrid";

const MODE_STATS: Record<MatchMode, { accuracy: number; accuracyLabel: string; scale: number; scaleLabel: string }> = {
  none: { accuracy: 0, accuracyLabel: "No match", scale: 0, scaleLabel: "No reach" },
  deterministic: { accuracy: 88, accuracyLabel: "80–90% match rate", scale: 25, scaleLabel: "Limited" },
  probabilistic: { accuracy: 45, accuracyLabel: "Estimated", scale: 90, scaleLabel: "Very wide" },
  hybrid: { accuracy: 70, accuracyLabel: "Strong", scale: 75, scaleLabel: "Wide" },
};

const DEVICES = ["Phone", "Laptop", "Tablet"];

function Body() {
  const [active, setActive] = useState<Set<SignalId>>(new Set(["email"]));

  function toggleSignal(id: SignalId) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasDeterministic = active.has("email");
  const hasProbabilistic = SIGNALS.some((s) => s.kind === "probabilistic" && active.has(s.id));

  const mode: MatchMode = hasDeterministic && hasProbabilistic
    ? "hybrid"
    : hasDeterministic
      ? "deterministic"
      : hasProbabilistic
        ? "probabilistic"
        : "none";

  const stats = MODE_STATS[mode];
  const connected = mode !== "none";

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          An ID or device graph maps identifiers — cookies, MAIDs, hashed emails, IP addresses — to
          one unified profile, letting a marketer deliver consistent messaging across a person's
          devices and platforms. Building that graph requires matching, and there are two ways to do
          it, which companies frequently combine.
        </p>
      </div>

      <IqmSpotlight>
        This is what IQM's proprietary Identity Graph does in production: <span className="figure">75%</span> US
        household coverage, an <span className="figure">85%</span> active match rate, and{" "}
        <span className="figure">0%</span> reliance on third-party cookies — built for the regulated
        verticals, political and healthcare among them, where a stale or leaky match isn't an
        option.
      </IqmSpotlight>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Toggle which signals are available for one person's phone, laptop, and tablet. A hashed
          email login is a deterministic signal; the other three are probabilistic. Watch the
          devices connect, and the accuracy and scale bars respond, as you change what's available.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose available matching signals">
          {SIGNALS.map((signal) => (
            <button
              key={signal.id}
              type="button"
              onClick={() => toggleSignal(signal.id)}
              aria-pressed={active.has(signal.id)}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                active.has(signal.id)
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {signal.label}
            </button>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-center gap-3 rounded-lg border border-border bg-card py-6">
          {DEVICES.map((device, index) => (
            <div key={device} className="flex items-center gap-3">
              <span
                className={cn(
                  "rounded-lg border px-3 py-2 text-sm",
                  connected ? "border-primary text-foreground" : "border-border text-muted-foreground"
                )}
              >
                {device}
              </span>
              {index < DEVICES.length - 1 && (
                <span
                  aria-hidden="true"
                  className={cn(
                    "h-px w-8",
                    connected ? "bg-primary" : "bg-border"
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="measure mt-2 text-center text-sm text-muted-foreground">
          {connected
            ? `Graph mode: ${mode === "hybrid" ? "hybrid" : mode} matching`
            : "No signal selected — the devices stay unconnected"}
        </p>

        <div className="mt-5 space-y-3">
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Accuracy</span>
              <span className="text-foreground">{stats.accuracyLabel}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: `${stats.accuracy}%` }} />
            </div>
          </div>
          <div>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-muted-foreground">Scale and reach</span>
              <span className="text-foreground">{stats.scaleLabel}</span>
            </div>
            <div className="h-2 rounded-full bg-muted">
              <div className="h-full rounded-full bg-accent" style={{ width: `${stats.scale}%` }} />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Deterministic matching</h3>
        <div className="measure space-y-3 text-muted-foreground">
          <p>
            Deterministic matching builds a profile from data about a person, then identifies them on
            other devices by looking for a common identifier — most often an email address, since it
            is unique, cross-platform, and appears in many datasets. Companies like Meta, Google, and
            LinkedIn achieve exceptional precision this way, because a user must sign in with an
            email to use their services across devices. Common identifiers include an email address,
            a first and last name, an address, a date of birth, and a phone number; all of them are
            typically hashed on collection to protect privacy and strip personally identifiable
            information (PII).
          </p>
          <p>
            Its match rates run roughly 80 to 90%. Its drawback is scale — most companies never
            collect this kind of data, and an email address isn't typically how online ad inventory
            is bought and sold.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Solving the scale problem: the login wall</h3>
        <p className="measure text-muted-foreground">
          To collect more of the identifier deterministic matching needs, publishers push visitors
          to register — by encouragement (more content in exchange for an email) or by force (gating
          content behind a subscription or account). This works best for a large publisher with an
          engaged, repeat audience; few people will create an account just to read one blog post.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Probabilistic matching</h3>
        <div className="measure space-y-3 text-muted-foreground">
          <p>
            Probabilistic matching uses non-unique data — IP address, location, interests and
            browsing behavior, Wi-Fi networks — with algorithms and statistical modeling to estimate
            a match. Models are trained on datasets that do contain deterministic identifiers, so
            they learn what a matching user looks like, then get applied to millions of records that
            have no such identifier.
          </p>
          <p>
            Its advantage is scale and reach far beyond what deterministic matching alone can cover.
            Its drawbacks are a lack of transparency in how a match was made, redundant or outdated
            data from limited oversight, and reduced data availability under privacy law such as the
            GDPR, which requires consent to collect signals like IP address and location.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What matching is used for</h3>
        <ul className="space-y-2">
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Cross-device targeting</span> — recognizing a user
              across devices and serving ads based on their collective behavior: browse a jacket on a
              laptop, see it advertised on a phone.
            </span>
          </li>
          <li className="flex gap-3 text-muted-foreground">
            <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
            <span>
              <span className="text-foreground">Cross-device attribution</span> — linking an ad
              interaction on one device to a conversion on another: click a running-shoe ad on a
              phone, buy it on a laptop.
            </span>
          </li>
        </ul>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Most companies run both approaches together — deterministic links form a trusted core of
          the graph, and probabilistic modeling extends it out to the far larger number of devices
          that share no login signal at all.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A stakeholder asks why the "unified customer profile" can confidently say two devices belong
      to the same person on one campaign, and only guess on another. The difference is whether that
      graph was built on a shared login or stitched together from statistics — and the two come with
      very different guarantees.
    </p>
  ),
  objectives: [
    "Explain what an ID or device graph is and what it maps together",
    "Contrast deterministic and probabilistic matching by their signals, accuracy, and scale",
    "Explain why publishers push registration or subscription walls to fix the scale problem",
    "Distinguish cross-device targeting from cross-device attribution",
  ],
  Body,
  takeaways: [
    "An ID or device graph maps identifiers — cookies, MAIDs, hashed emails, IP addresses — into one profile so a person is recognized consistently across their phone, laptop, and tablet.",
    "Deterministic matching, built on a shared identifier like a hashed email, reaches roughly 80–90% accuracy but low scale; probabilistic matching, built on IP address, device signals, location, and behavior trained against deterministic data, reaches far more people with far less certainty.",
    "Companies typically combine both into a hybrid graph, which powers cross-device targeting (an ad follows a browsed product to another device) and cross-device attribution (a click on one device gets credited to a purchase on another).",
  ],
  checkYourself: [
    {
      question:
        "A publisher has almost no logged-in users. Can it build an accurate deterministic graph on its own?",
      answer: (
        <p>
          Not really — deterministic matching needs a shared identifier like an email at scale, and
          a publisher without registered users has almost none to match on. That's exactly why
          publishers push registration or subscription walls: to manufacture the data deterministic
          matching depends on, or fall back on probabilistic signals for reach instead.
        </p>
      ),
    },
    {
      question: "Why are the identifiers used in deterministic matching typically hashed before matching happens?",
      answer: (
        <p>
          Because a raw email address, name, or date of birth is personally identifiable information.
          Hashing lets two companies confirm they hold the same person's data without either one
          exposing the underlying PII.
        </p>
      ),
    },
  ],
};

export default lesson;
