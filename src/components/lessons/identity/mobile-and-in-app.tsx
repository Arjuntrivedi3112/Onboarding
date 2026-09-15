import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { IdentifierGrid, toggleClass } from "./_shared";

const MAID_USES = [
  { title: "Attribution", detail: "Tracking which advertisement led to an app install or an in-app event." },
  { title: "Audience targeting", detail: "Building segments based on app usage and behavior." },
  { title: "Frequency capping", detail: "Making sure a user doesn't see the same ad too many times." },
];

const BASE_DEVICES = 1_000_000;
const BASE_INSTALLS = 10_000;

const OPT_IN_RATES = [
  { id: "low", label: "Set opt-in to 20%", rate: 0.2 },
  { id: "mid", label: "Set opt-in to 50%", rate: 0.5 },
  { id: "high", label: "Set opt-in to 80%", rate: 0.8 },
] as const;

function Body() {
  const [rateId, setRateId] = useState<(typeof OPT_IN_RATES)[number]["id"]>("low");
  const active = OPT_IN_RATES.find((r) => r.id === rateId) ?? OPT_IN_RATES[0];

  const addressable = Math.round(BASE_DEVICES * active.rate);
  const attributableInstalls = Math.round(BASE_INSTALLS * active.rate);
  const frequencyCapAccuracy = Math.round(active.rate * 100);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Mobile ad IDs (MAIDs) are unique identifiers tied to a phone or tablet — Apple's Identifier
          for Advertisers (IDFA) and Google's Google Advertising ID (GAID). Because nearly every
          mobile device has one, they are more persistent than a web cookie; a user cannot delete
          one, though they can reset it at any time.
        </p>
        <IdentifierGrid ids={["maid"]} label="Mobile ad ID identifier card" />
        <p className="measure text-muted-foreground">MAIDs support three core advertising functions:</p>
      </div>

      <section>
        <ul className="grid gap-2 sm:grid-cols-3">
          {MAID_USES.map((use) => (
            <li key={use.title} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{use.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{use.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What changed</h3>
        <div className="measure space-y-4 text-muted-foreground">
          <p>
            Apple's App Tracking Transparency (ATT) framework requires an app to show an explicit
            consent prompt before it can read the IDFA. Opt-in rates have generally been low, which
            cuts directly into how much of a mobile audience IDFA-based targeting and measurement can
            actually reach. Google's Privacy Sandbox for Android is separately working to phase out
            GAID, replacing it with more privacy-preserving mechanisms that limit cross-app tracking
            while keeping essential ad functions working.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Out of {BASE_DEVICES.toLocaleString()} devices running your app and{" "}
          {BASE_INSTALLS.toLocaleString()} recent installs, only the fraction of users who accept the
          ATT prompt are addressable through IDFA. Move the opt-in rate and watch addressable
          audience, attributable installs, and frequency-capping accuracy all move together — because
          all three depend on the same identifier.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an ATT opt-in rate">
          {OPT_IN_RATES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setRateId(option.id)}
              aria-pressed={rateId === option.id}
              className={toggleClass(rateId === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Addressable via IDFA</p>
            <p className="figure mt-1 text-2xl text-foreground">{addressable.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">out of {BASE_DEVICES.toLocaleString()} devices</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Attributable installs</p>
            <p className="figure mt-1 text-2xl text-foreground">{attributableInstalls.toLocaleString()}</p>
            <p className="mt-1 text-sm text-muted-foreground">out of {BASE_INSTALLS.toLocaleString()} installs</p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Frequency-capping accuracy</p>
            <p className="figure mt-1 text-2xl text-foreground">{frequencyCapAccuracy}%</p>
            <p className="mt-1 text-sm text-muted-foreground">of sessions carry a usable ID</p>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Beyond the MAID: app-specific IDs and SDKs</h3>
        <p className="measure text-muted-foreground">
          Many apps also generate their own proprietary identifiers through a software development
          kit (SDK), used internally or shared with trusted AdTech partners for audience development
          and analytics. An SDK can supply session length, location, device type, and engagement
          metrics — genuinely useful signals, but ones that still have to be implemented carefully to
          stay compliant with privacy policy and app-store guidelines.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A mobile campaign's install numbers look fine, but the attribution report only covers a
      fraction of them, and someone asks why. The answer is almost always the ATT opt-in rate — the
      installs are real, the measurement just can't see all of them.
    </p>
  ),
  objectives: [
    "Explain what a MAID is and why it is more persistent than a cookie, despite being user-resettable",
    "Name the three core things MAIDs are used for: attribution, audience targeting, and frequency capping",
    "Explain how Apple's ATT prompt limits IDFA-based measurement to the opted-in share of users",
    "Describe what an app-specific SDK identifier adds beyond the MAID",
  ],
  Body,
  takeaways: [
    "A MAID (IDFA on iOS, GAID on Android) is a device-level identifier more persistent than a cookie, used for attribution, audience targeting, and frequency capping, though a user can reset it at will.",
    "Apple's App Tracking Transparency requires an explicit opt-in before an app can read the IDFA, so IDFA-based measurement only ever covers the opted-in share of users — and Google's Privacy Sandbox for Android is separately phasing out GAID.",
    "App-specific IDs generated through an SDK supply session length, location, device type, and engagement data beyond what a MAID alone provides, but must be implemented within privacy policy and app-store constraints.",
  ],
  checkYourself: [
    {
      question:
        "Your app has a 20% ATT opt-in rate. Can you still measure IDFA-based attribution for the other 80% of users?",
      answer: (
        <p>
          No — IDFA-based, user-level attribution only exists for the fraction of users who opted
          in. The other 80% still installed and used the app, but that activity has to be understood
          through other signals, such as app-specific SDK data or aggregated measurement, not
          user-level IDFA attribution.
        </p>
      ),
    },
    {
      question: "How does a GAID differ in scope from an app-specific SDK identifier?",
      answer: (
        <p>
          A GAID is a device-wide identifier — the same value is visible to every app on that device
          until it's reset. An app-specific SDK identifier is scoped to that one app (or shared only
          with its trusted partners), so it can't be used to recognize the same device in a
          different app.
        </p>
      ),
    },
  ],
};

export default lesson;
