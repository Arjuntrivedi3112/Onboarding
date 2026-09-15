import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type ReferrerName = "Direct" | "Organic" | "Social" | "Website" | "Campaign";

interface Arrival {
  id: string;
  label: string;
  /** The literal value the Referer header would carry, or null if there isn't one. */
  refererLine: string | null;
  classification: ReferrerName;
  note: string;
  /** Index into REFERRER_LOSS_RULES to highlight, if this arrival is the protocol-loss case. */
  lossRuleIndex: number | null;
}

const ARRIVALS: Arrival[] = [
  {
    id: "typed",
    label: "Typed the URL directly, or used a bookmark",
    refererLine: null,
    classification: "Direct",
    note: "There is nothing to put in the Referer header — the browser was never sent from anywhere.",
    lossRuleIndex: null,
  },
  {
    id: "linkedin-utm",
    label: "Clicked a LinkedIn ad carrying UTM parameters",
    refererLine: "https://www.linkedin.com/",
    classification: "Campaign",
    note: "The landing page URL carries UTM parameters, so the Referer header is ignored entirely — the UTMs decide the source. Some platforms label this campaign; others read the UTMs further and call it paid social.",
    lossRuleIndex: null,
  },
  {
    id: "google-organic",
    label: "Clicked an unpaid Google search result",
    refererLine: "https://www.google.com/",
    classification: "Organic",
    note: "A search engine sent the visit and there are no UTM parameters overriding it, so it's classified organic. A paid search ad landing on a UTM-tagged page would be campaign instead.",
    lossRuleIndex: null,
  },
  {
    id: "https-to-http",
    label: "Followed a link from an https:// page to an http:// page",
    refererLine: null,
    classification: "Direct",
    note: "This is the one protocol combination that drops the Referer header in transit. The site has no idea the visit came from anywhere, so it records direct — not because the user typed the URL, but because the browser refused to disclose it.",
    lossRuleIndex: 0,
  },
  {
    id: "native-app",
    label: "Tapped a link inside a native mobile app with no UTM parameters",
    refererLine: null,
    classification: "Direct",
    note: "Native apps often don't send a Referer header at all. Without UTM parameters to fall back on, the visit records as direct even though it clearly came from somewhere.",
    lossRuleIndex: null,
  },
];

const REFERRER_TYPES: { name: ReferrerName; description: string }[] = [
  {
    name: "Direct",
    description:
      "The referrer information isn't known — a typed URL or bookmark, a hop between subdomains, a native-app link with no UTM parameters, or a technical loss in transit.",
  },
  {
    name: "Organic",
    description:
      "Traffic from a search engine such as Google Search, Bing, or DuckDuckGo. Paid search ads are normally classified as campaign traffic instead.",
  },
  {
    name: "Social",
    description: "Visits from social platforms such as Facebook, LinkedIn, X, and YouTube.",
  },
  {
    name: "Website",
    description: "A user clicked a link on another website and landed on the advertiser's site.",
  },
  {
    name: "Campaign",
    description:
      "The landing page URL carries UTM parameters. The Referer header is ignored and the UTMs decide the source — some platforms label these more granularly as paid social or paid search.",
  },
];

const REFERRER_LOSS_RULES: { from: string; to: string; passed: boolean }[] = [
  { from: "https://", to: "http://", passed: false },
  { from: "http://", to: "https://", passed: true },
  { from: "http://", to: "http://", passed: true },
  { from: "https://", to: "https://", passed: true },
];

function Body() {
  const [arrivalId, setArrivalId] = useState<string>(ARRIVALS[0].id);
  const arrival = ARRIVALS.find((a) => a.id === arrivalId) ?? ARRIVALS[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The simplest way a site identifies where a visitor came from is a field called Referer,
          included with every browser request sent to a web server. Yes — Referer, with one r. It's
          a famous typo: the person who wrote the original HTTP specification misspelled "referrer,"
          and by the time anyone noticed, it had already shipped in browsers everywhere. The
          misspelled header name is what actually appears on the wire to this day.
        </p>
        <p>
          One more term you'll see below: a UTM (Urchin Tracking Module) parameter is a tag added
          to the end of a URL — utm_source, utm_medium, utm_campaign — that a platform can read
          instead of trusting the Referer header at all.
        </p>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border bg-card p-4">
        <pre className="whitespace-pre text-sm text-muted-foreground">
          <code>{`GET / HTTP/1.1
Host: avenga.com
DNT: 1
Accept-Language: en-us
Accept-Encoding: gzip, deflate
`}<span className={cn("text-foreground", arrival.refererLine && "text-primary")}>
  {arrival.refererLine ? `Referer: ${arrival.refererLine}` : "(no Referer header sent for this arrival)"}
</span>{`
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6)`}</code>
        </pre>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick how a visitor arrived. The request above rewrites its Referer line to match, and the
          card below shows how the platform would classify it.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose how the visitor arrived">
          {ARRIVALS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setArrivalId(a.id)}
              aria-pressed={arrivalId === a.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                arrivalId === a.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {a.label}
            </button>
          ))}
        </div>

        <p className="measure mt-4 text-sm text-muted-foreground">{arrival.note}</p>

        <h4 className="mb-3 mt-6 text-foreground">Referrer classifications</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {REFERRER_TYPES.map((r) => (
            <div
              key={r.name}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                arrival.classification === r.name ? "border-primary bg-primary/10" : "border-border bg-card"
              )}
            >
              <h5 className="mb-1 text-sm text-foreground">{r.name}</h5>
              <p className="text-sm text-muted-foreground">{r.description}</p>
            </div>
          ))}
        </div>

        <h4 className="mb-3 mt-6 text-foreground">When is the referrer lost?</h4>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="px-3 py-2 text-left text-muted-foreground">Protocol change</th>
                <th className="px-3 py-2 text-left text-muted-foreground">Referrer passed or lost</th>
              </tr>
            </thead>
            <tbody>
              {REFERRER_LOSS_RULES.map((rule, i) => (
                <tr
                  key={`${rule.from}-${rule.to}`}
                  className={cn(
                    "border-b border-border/50 transition-colors",
                    arrival.lossRuleIndex === i && "bg-primary/10"
                  )}
                >
                  <td className="px-3 py-2 font-mono text-sm text-foreground">
                    {rule.from} to {rule.to}
                  </td>
                  <td className="px-3 py-2">
                    <span className={rule.passed ? "text-foreground" : "text-destructive"}>
                      {rule.passed ? "Referrer passed" : "Referrer lost"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Only a drop from a secure page to an unsecure one loses the referrer. Since most websites
          now use https://, this kind of referrer loss is far less of a concern than it used to be.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Each time a user arrives from a different channel, a new session begins and that
          session's referrer is captured — one record for the LinkedIn ad, a separate record for
          the organic search visit two days later, another for the direct return the day after
          that. None of those records knows about the others on its own. It's stitching that
          sequence of separately captured arrivals back together, in order, that turns a pile of
          session records into the single customer journey the attribution models in the next two
          lessons actually operate on.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A stakeholder will ask why a visit is showing up as "direct" when they know exactly which ad
      the person clicked. The answer is almost always one of a handful of specific, well-understood
      reasons the Referer header didn't arrive — and knowing them is what separates "the tracking
      is broken" from "here is exactly what happened and why."
    </p>
  ),
  objectives: [
    "Explain how the Referer field lets a platform identify where a visitor came from",
    "Classify an arrival into direct, organic, social, website, or campaign",
    "State the one protocol change that loses the referrer, and name three other reasons a visit records as direct",
    "Explain how sessionization turns separately captured arrivals into one reconstructed journey",
  ],
  Body,
  takeaways: [
    "The simplest signal a platform has for where a visitor came from is the Referer field sent with every browser request — spelled with one r, a holdover typo from the original HTTP specification that never got fixed.",
    "Visits are classified as direct, organic, social, website, or campaign, and UTM parameters on the landing page override whatever the Referer field says the moment they're present.",
    "Only an https-to-http hop drops the referrer in transit; every other protocol combination passes it through, and each new arrival starts a fresh session that gets recorded, which is how a full journey gets reconstructed one touchpoint at a time.",
  ],
  checkYourself: [
    {
      question: "Which of the four protocol transitions in the table above loses the referrer?",
      answer: (
        <p>
          Only https:// to http://. Every other direction — including both same-protocol cases —
          passes the referrer through intact.
        </p>
      ),
    },
    {
      question:
        "A visit is marked direct. List two different real reasons that could be true, beyond the user typing the URL.",
      answer: (
        <p>
          A hop between subdomains (say, from publisher1.com to blog.publisher1.com), a native-app
          link with no UTM parameters, or a technical loss such as an https-to-http downgrade. All
          four look identical in the report — "direct" — even though only one of them means the
          user actually typed anything.
        </p>
      ),
    },
    {
      question:
        "If direct can mean four different things and they all look the same in the report, how would you tell them apart when it actually matters?",
      answer: (
        <p>
          Often you can't from the referrer alone — that's the honest answer. You'd need a
          secondary signal: checking whether the previous session on the same device ended on a
          subdomain of your own site, confirming whether your own app links carry UTM parameters at
          all, or simply noting that https adoption has made the protocol-loss case rare enough to
          usually rule out. Referrer data answers "where," not "why," and pretending otherwise is
          how people over-trust a direct bucket that is really four buckets wearing one label.
        </p>
      ),
    },
  ],
};

export default lesson;
