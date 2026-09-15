import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface Source {
  id: string;
  label: string;
  kind: "online" | "offline";
  reveals: string;
}

/** The four systems this lesson's "Try it" turns on and off, one customer at a time. */
const SOURCES: Source[] = [
  { id: "pos", label: "Point of sale (POS)", kind: "offline", reveals: "What they bought in-store, and when" },
  { id: "crm", label: "Offline CRM", kind: "offline", reveals: "Name, residential address, phone number" },
  { id: "analytics", label: "Web analytics", kind: "online", reveals: "Pages viewed, on-site behavior" },
  { id: "adserver", label: "Ad server", kind: "online", reveals: "Ads served, campaigns already seen" },
];

const ONBOARD_STEPS = [
  { title: "Upload the offline data", detail: "The offline export — names, addresses, phone numbers, emails, dates of birth — is uploaded to an onboarding platform." },
  { title: "Anonymize the PII", detail: "Personally identifiable information is hashed before it goes anywhere near the match, so a raw email address never travels unprotected." },
  { title: "Match against online data", detail: "The hashed identifiers are matched against online records — web analytics, ad server logs, online payment accounts." },
  { title: "Unify the profile", detail: "A matched pair becomes one customer profile, now visible across every channel instead of split across two databases." },
];

function Body() {
  const [on, setOn] = useState<string[]>([]);
  const [bulk, setBulk] = useState(false);
  const [onboardStep, setOnboardStep] = useState(0);

  function toggle(id: string) {
    setOn((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const activeSources = SOURCES.filter((s) => on.includes(s.id));
  const hasOffline = activeSources.some((s) => s.kind === "offline");
  const hasOnline = activeSources.some((s) => s.kind === "online");
  const canOnboard = hasOffline && hasOnline;
  const onboardDone = onboardStep >= ONBOARD_STEPS.length;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Brands, advertisers, marketers and publishers gather data from a range of online and
          offline sources. Online, that means analytics tools, CRM systems, enterprise resource
          planning (ERP) systems, marketing automation platforms, mobile and web apps, and campaign
          analytics. Offline, it means point of sale (POS) systems, offline CRM and ERP systems, and
          transactional data. All of it typically sits in multiple databases — either inside the
          company's own systems, or managed by its software vendors.
        </p>
        <p>
          Combining online and offline data gives a clearer picture of a customer, but for a large
          company such as a retailer, that integration is not an easy task. If a company only holds a
          small amount of offline data — just email addresses, say — it can simply import that into a
          database or DMP. If it holds a large amount, it needs to onboard that data into a data
          platform like a DMP or CDP instead.
        </p>
        <p>
          Left unintegrated, these individual databases become <span className="text-foreground">data silos</span> — a
          collection of data controlled by one department and isolated from the rest of the
          organization. Data fragmented across silos costs an advertiser visibility into the full
          picture of its audiences and campaign performance, which leads to poor decision-making,
          missed opportunities, and unnecessary ad spend.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          One customer, four separate databases. Switch sources on to see how little any single one
          of them knows, then onboard the offline and online data together.
        </p>

        <div className="grid gap-2 sm:grid-cols-2" role="group" aria-label="Toggle a data source">
          {SOURCES.map((source) => {
            const isOn = on.includes(source.id);
            return (
              <button
                key={source.id}
                type="button"
                onClick={() => toggle(source.id)}
                aria-pressed={isOn}
                className={cn(
                  "min-h-[2.75rem] rounded-lg border px-4 py-2 text-left text-sm transition-colors",
                  isOn
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="block text-foreground">{source.label}</span>
                <span className="text-xs uppercase text-muted-foreground">{source.kind}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">What we actually know about this customer</p>
          {activeSources.length === 0 ? (
            <p className="measure mt-1 text-muted-foreground">
              Nothing yet. Every source is off, which is exactly what a data silo feels like from the
              outside.
            </p>
          ) : (
            <ul className="mt-2 space-y-2">
              {activeSources.map((s) => (
                <li key={s.id} className="flex gap-3 text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  <span>{s.reveals}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="measure mt-3 text-sm text-muted-foreground">
            Right now you're combining <span className="figure">{activeSources.length}</span> separate
            database{activeSources.length === 1 ? "" : "s"} just to describe one person.
          </p>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Onboard the offline and online data</p>
          <p className="measure mt-1 text-sm text-muted-foreground">
            {canOnboard
              ? "You have both an offline source and an online source switched on — enough to onboard."
              : "Turn on at least one offline source and one online source to unlock onboarding."}
          </p>

          <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Set the offline data volume">
            <button
              type="button"
              onClick={() => setBulk(false)}
              aria-pressed={!bulk}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                !bulk ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Say it's just email addresses
            </button>
            <button
              type="button"
              onClick={() => setBulk(true)}
              aria-pressed={bulk}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                bulk ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              Say it's a full CRM export
            </button>
          </div>

          {!bulk ? (
            <p className="measure mt-3 text-sm text-muted-foreground">
              That's a small amount of offline data, so it can simply be imported into a database or
              DMP. No onboarding platform needed.
            </p>
          ) : (
            <div className="mt-3">
              <p className="measure text-sm text-muted-foreground">
                That's a large amount of offline data, so it needs an onboarding platform such as
                LiveRamp. Step through the process:
              </p>

              <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Step through onboarding">
                <button
                  type="button"
                  onClick={() => setOnboardStep((s) => Math.min(s + 1, ONBOARD_STEPS.length))}
                  disabled={!canOnboard || onboardDone}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                    !canOnboard || onboardDone
                      ? "border-border text-muted-foreground opacity-50"
                      : "border-primary bg-primary/10 text-foreground"
                  )}
                >
                  Run the next step
                </button>
                <button
                  type="button"
                  onClick={() => setOnboardStep(0)}
                  className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  Restart onboarding
                </button>
              </div>

              <ol className="mt-3 space-y-2">
                {ONBOARD_STEPS.map((step, i) => (
                  <li
                    key={step.title}
                    className={cn(
                      "flex gap-3 text-sm",
                      i < onboardStep ? "text-foreground" : "text-muted-foreground opacity-60"
                    )}
                  >
                    <span className="figure shrink-0">{i + 1}</span>
                    <span>
                      <span className="block text-foreground">{step.title}</span>
                      {i < onboardStep && <span className="measure block text-muted-foreground">{step.detail}</span>}
                    </span>
                  </li>
                ))}
              </ol>

              {onboardDone && (
                <p className="measure mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
                  The offline and online records are now one unified customer profile — visible across
                  channels instead of split across two databases nobody was cross-referencing.
                </p>
              )}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Your marketing team swears they know the customer, but their picture is only ever built from
      whatever database they happen to query. Miss the point-of-sale system and half of what you
      actually know about that person quietly disappears — and nobody notices until a report is
      wrong.
    </p>
  ),
  objectives: [
    "List the online and offline systems customer data typically sits in",
    "Explain when offline data can simply be imported versus when it must be onboarded into a DMP or CDP",
    "Describe what leaving data siloed by department costs a business",
  ],
  Body,
  takeaways: [
    "Customer data typically sits in separate online systems — analytics, CRM, ERP, marketing automation — and offline systems such as POS, offline CRM and ERP, and transactional records, often across multiple databases.",
    "Small amounts of offline data, such as just an email address, can be imported directly, but larger volumes need to be onboarded into a DMP or CDP through a platform such as LiveRamp.",
    "Leaving data siloed by department costs you visibility into your audience and campaign performance, which leads to poor decisions, missed opportunities, and wasted ad spend.",
  ],
  checkYourself: [
    {
      question:
        "Your company has only ever collected customers' email addresses offline. Do you need an onboarding platform to bring that into your DMP?",
      answer: (
        <p>
          No. A small amount of offline data, such as just email addresses, can simply be imported
          into a database or DMP. Onboarding platforms such as LiveRamp are for larger volumes of
          offline data.
        </p>
      ),
    },
    {
      question: "What is a data silo, and what does it cost you if your customer data stays in one?",
      answer: (
        <p>
          A data silo is a collection of data controlled by one department and isolated from the rest
          of the organization. Leaving data fragmented across silos costs you visibility into your
          audiences and campaign performance, which leads to poor decision-making, missed
          opportunities, and unnecessary ad spend.
        </p>
      ),
    },
    {
      question: "Put the onboarding process in order: match, unify, anonymize, upload.",
      answer: (
        <p>
          Upload the offline data, anonymize the personally identifiable information, match it against
          online data, then unify the result into one customer profile.
        </p>
      ),
    },
  ],
};

export default lesson;
