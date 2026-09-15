import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { toggleClass } from "./_shared";

const REGULATIONS = [
  {
    name: "GDPR",
    region: "European Union",
    rule: "Consent required before processing personal data",
    impact: "Consent management platforms, explicit opt-in, data subject rights",
  },
  {
    name: "CCPA/CPRA",
    region: "California, USA",
    rule: "Right to opt out of the sale or sharing of personal data",
    impact: "\"Do not sell\" links, data access requests",
  },
  {
    name: "Privacy Sandbox",
    region: "Chrome browser",
    rule: "Google's set of cookie-replacement APIs",
    impact: "Topics API, Attribution Reporting, Protected Audience",
  },
  {
    name: "ATT",
    region: "Apple devices",
    rule: "App Tracking Transparency consent prompt",
    impact: "Opt-in required before an app can read the IDFA",
  },
];

type IdentifierRow = {
  id: string;
  name: string;
  isLive: (gdpr: boolean, att: boolean, ccpaOptOut: boolean) => boolean;
  note: string;
};

const IDENTIFIER_ROWS: IdentifierRow[] = [
  {
    id: "firstparty",
    name: "First-party cookie",
    isLive: () => true,
    note: "Not gated by any of these three switches — it's why first-party data is the fallback everyone builds toward.",
  },
  {
    id: "thirdparty",
    name: "Third-party cookie",
    isLive: (gdpr, _att, ccpaOptOut) => gdpr && !ccpaOptOut,
    note: "Needs GDPR consent to be set at all, and goes dark the moment a California user opts out of sale.",
  },
  {
    id: "maid",
    name: "Mobile ad ID (MAID)",
    isLive: (_gdpr, att) => att,
    note: "Gated specifically by the ATT prompt — decline it, and the app can't read the IDFA.",
  },
  {
    id: "universal",
    name: "Universal ID",
    isLive: (gdpr, _att, ccpaOptOut) => gdpr && !ccpaOptOut,
    note: "Built from consented, authenticated first-party data, so it follows the same consent and opt-out rules as third-party cookies.",
  },
  {
    id: "fingerprint",
    name: "Device fingerprint",
    isLive: () => true,
    note: "Not read from a stored cookie or a consent flag at all, which is exactly what makes it controversial.",
  },
  {
    id: "contextual",
    name: "Contextual signal",
    isLive: () => true,
    note: "Uses no user data, so there is nothing here for any of these three switches to gate.",
  },
];

function Body() {
  const [gdpr, setGdpr] = useState(true);
  const [att, setAtt] = useState(true);
  const [ccpaOptOut, setCcpaOptOut] = useState(false);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Cookies have been the dominant way to identify a web visitor since the early internet, and
          the reason they no longer work by default is regulation. The European Union's General Data
          Protection Regulation (GDPR) and browser features like Safari's Intelligent Tracking
          Prevention restrict cookie creation and access outright — and several other rules layer on
          top of that.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Key privacy regulations</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          {REGULATIONS.map((reg) => (
            <div key={reg.name} className="rounded-lg border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-foreground">{reg.name}</span>
                <span className="rounded-full bg-secondary px-2 py-0.5 text-xs uppercase text-muted-foreground">
                  {reg.region}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{reg.rule}</p>
              <p className="mt-1 text-sm text-muted-foreground">{reg.impact}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Case study: a consent management platform at scale</h3>
        <p className="measure text-muted-foreground">
          One AdTech company built its own consent management platform (CMP) over six years — a
          website cookie scanner, a cookie-category knowledge base, and integration with the IAB's
          Transparency and Consent Framework (TCF). Today it handles more than ten million consent
          requests a day, for thousands of customers worldwide. A CMP isn't a nice-to-have bolted on
          for compliance; at that volume, it is core infrastructure.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          One person's addressability is not a single switch. Flip GDPR consent, the ATT prompt, and
          a CCPA "do not sell" opt-out independently, and watch which identifiers stay live and which
          go dark.
        </p>

        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setGdpr((v) => !v)} aria-pressed={gdpr} className={toggleClass(gdpr)}>
            GDPR consent: {gdpr ? "granted" : "denied"}
          </button>
          <button type="button" onClick={() => setAtt((v) => !v)} aria-pressed={att} className={toggleClass(att)}>
            ATT prompt: {att ? "allowed" : "declined"}
          </button>
          <button
            type="button"
            onClick={() => setCcpaOptOut((v) => !v)}
            aria-pressed={ccpaOptOut}
            className={toggleClass(ccpaOptOut)}
          >
            CCPA: {ccpaOptOut ? "opted out of sale" : "not opted out"}
          </button>
        </div>

        <ul className="mt-4 space-y-2">
          {IDENTIFIER_ROWS.map((row) => {
            const live = row.isLive(gdpr, att, ccpaOptOut);
            return (
              <li
                key={row.id}
                className={cn(
                  "rounded-lg border p-3",
                  live ? "border-border-strong bg-card" : "border-border bg-secondary"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={live ? "text-foreground" : "text-muted-foreground"}>{row.name}</span>
                  <span className={cn("text-sm", live ? "text-primary" : "text-muted-foreground")}>
                    {live ? "live" : "dark"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{row.note}</p>
              </li>
            );
          })}
        </ul>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The same person can be fully addressable under one identifier and completely invisible
          under another, at the same moment, depending on which consent decisions they made. That is
          exactly why a modern CMP has to track each of these independently rather than treating
          "consent" as one yes-or-no answer.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign underperforms in the European Union and in California for completely different
      reasons, and someone will ask you to explain both in the same meeting. GDPR consent, an ATT
      decision, and a CCPA opt-out each independently switch off different identifiers — knowing
      which one did it is the whole diagnosis.
    </p>
  ),
  objectives: [
    "State what GDPR requires and what CCPA/CPRA grants, in one sentence each",
    "Explain what the ATT prompt gates and which identifier it affects",
    "Name at least one component of a consent management platform built to handle this at scale",
    "Given a user's consent choices, say which identifiers on the page are live and which are dark",
  ],
  Body,
  takeaways: [
    "GDPR requires opt-in consent before EU personal data is processed; CCPA/CPRA instead gives California residents a right to opt out of the sale of their data — opt-in and opt-out are different defaults with different consequences for which identifiers keep working.",
    "Apple's App Tracking Transparency requires an explicit opt-in prompt before an app can read a MAID like the IDFA; decline it, and that identifier goes dark for that app.",
    "A person's addressability is never one switch — GDPR consent, an ATT decision, and a CCPA opt-out each independently turn different identifiers on or off, which is why a consent management platform exists to track all of them at once, sometimes at tens of millions of requests a day.",
  ],
  checkYourself: [
    {
      question:
        "A California user opts out of the sale of their data under CCPA but is never shown a GDPR prompt, since they're not in the EU. Does third-party-cookie retargeting still work for them?",
      answer: (
        <p>
          No. The CCPA opt-out independently blocks the sale or sharing of data that retargeting
          depends on, regardless of whether GDPR even applies to that person. The two rules gate the
          same identifier from different directions.
        </p>
      ),
    },
    {
      question: "Does declining the ATT prompt on an iPhone stop a publisher's own first-party login cookie from working?",
      answer: (
        <p>
          No. ATT gates access to device-level identifiers like the IDFA that support cross-app
          tracking. A first-party session cookie that keeps someone logged in to one site is a
          different mechanism entirely, and ATT has no say over it.
        </p>
      ),
    },
  ],
};

export default lesson;
