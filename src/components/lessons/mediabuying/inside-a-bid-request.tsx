import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface BidField {
  id: string;
  object: string;
  title: string;
  json: string;
  detail: string;
  /** Added to the base bid when this field is present. */
  uplift: number;
  required?: boolean;
}

const BASE_BID = 1.0;

const FIELDS: BidField[] = [
  {
    id: "imp",
    object: "Imp",
    title: "Impression",
    json: '{\n  "id": "1",\n  "banner": { "w": 300, "h": 250 }\n}',
    detail:
      "The opportunity itself: an ID, the ad type — banner, video, or native — and its dimensions. Without this object there is no opportunity to evaluate at all.",
    uplift: 0,
    required: true,
  },
  {
    id: "device",
    object: "Device",
    title: "Device",
    json: '{\n  "ua": "Mozilla/5.0 ...",\n  "os": "iOS",\n  "make": "Apple",\n  "model": "iPhone"\n}',
    detail:
      "The user agent, operating system, and make and model of the device the ad would render on. Lets a DSP target by platform.",
    uplift: 0.5,
  },
  {
    id: "user",
    object: "User",
    title: "User",
    json: '{\n  "id": "9c4f2a...",\n  "gender": "F",\n  "yob": 1994\n}',
    detail:
      "Identifiers, gender, and year of birth. The strongest single signal for audience targeting, and the first thing missing when a user has opted out.",
    uplift: 1.2,
  },
  {
    id: "geo",
    object: "Geo",
    title: "Geo",
    json: '{\n  "lat": 40.71,\n  "lon": -74.01,\n  "country": "USA",\n  "region": "NY"\n}',
    detail: "Latitude, longitude, country, and region. Powers geographic targeting and local pricing.",
    uplift: 0.3,
  },
  {
    id: "publisher",
    object: "Publisher",
    title: "Publisher",
    json: '{\n  "id": "pub-772",\n  "domain": "example.com",\n  "name": "Example Daily"\n}',
    detail:
      "The publisher's ID, domain, and name, plus optional data segments the publisher attaches to its own inventory.",
    uplift: 0.4,
  },
];

function Body() {
  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(FIELDS.map((f) => [f.id, true]))
  );
  const [requested, setRequested] = useState(false);

  const toggle = (id: string) => {
    const field = FIELDS.find((f) => f.id === id);
    if (field?.required) return;
    setIncluded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const hasImp = included.imp;
  const bid = hasImp
    ? BASE_BID + FIELDS.filter((f) => !f.required && included[f.id]).reduce((sum, f) => sum + f.uplift, 0)
    : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The RTB Project — formerly the OpenRTB Consortium, now simply OpenRTB — is a group led by
          the Interactive Advertising Bureau (IAB), made up of AdTech companies from both the demand
          and supply sides. Launched in November 2010, it defines a common API specification: the
          shared language DSPs, SSPs, and exchanges use to trade impressions in real time.
        </p>
        <p>
          In practice, that means every bid request and bid response is a JSON document built from
          a small set of standard objects. What follows is what a DSP actually receives, and what
          each piece buys it in targeting.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Toggle objects out of the bid request and request a bid. The impression object is
          required — without it there's nothing to evaluate — but every other object is optional
          context that raises or lowers what a DSP is willing to pay.
        </p>

        <div className="space-y-3">
          {FIELDS.map((field) => (
            <div
              key={field.id}
              className={cn(
                "rounded-lg border p-4 transition-colors",
                included[field.id] ? "border-border bg-card" : "border-border opacity-50"
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase text-muted-foreground">{field.object}</p>
                  <p className="text-foreground">{field.title}</p>
                </div>
                <button
                  type="button"
                  onClick={() => toggle(field.id)}
                  aria-pressed={included[field.id]}
                  disabled={field.required}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors disabled:opacity-60",
                    included[field.id]
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {field.required ? "Always included" : included[field.id] ? "Included" : "Stripped out"}
                </button>
              </div>
              <p className="measure mt-2 text-sm text-muted-foreground">{field.detail}</p>
              <pre className="mt-3 overflow-x-auto rounded-lg border border-border bg-secondary p-3 font-mono text-sm text-muted-foreground">
                {field.json}
              </pre>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setRequested(true)}
          className="mt-4 min-h-[2.75rem] rounded-lg border border-primary bg-primary/10 px-4 text-sm text-foreground transition-colors"
        >
          Request a bid
        </button>

        {requested && (
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Bid response</p>
            {bid !== null ? (
              <p className="mt-1 text-foreground">
                Bid <span className="figure text-2xl">${bid.toFixed(2)}</span>
                <span className="text-muted-foreground"> CPM</span>
              </p>
            ) : (
              <p className="mt-1 text-nobid">No bid — the impression object was stripped out</p>
            )}
            <p className="measure mt-2 text-sm text-muted-foreground">
              {bid !== null
                ? "Every object beyond the impression is optional, but each one a DSP can see moves the price. Strip the user object, and the strongest targeting signal goes with it."
                : "A DSP cannot evaluate an opportunity it cannot see. No impression object means no ad type, no dimensions, and nothing to bid on."}
            </p>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Why RTB benefits both sides</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">For advertisers</h4>
            <ul className="space-y-1.5">
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>Real-time performance tracking, with immediate adjustment</span>
              </li>
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>Precise targeting using first-party and third-party data</span>
              </li>
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>Built-in fraud detection that cuts spend on invalid traffic</span>
              </li>
            </ul>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">For publishers</h4>
            <ul className="space-y-1.5">
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>Higher CPMs, driven by competitive bidding</span>
              </li>
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>A wider buyer pool, which improves fill rates</span>
              </li>
              <li className="flex gap-2 text-sm text-muted-foreground">
                <span aria-hidden="true" className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span>Dynamic floor pricing that responds to real-time demand</span>
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      The first time you open a raw bid request log, it will look like noise. It isn't — it's a
      small, standardized set of objects, and knowing what each one contributes is what lets you
      tell a targeting problem from a data problem.
    </p>
  ),
  objectives: [
    "Name the five most common OpenRTB objects in a bid request and what each one contains",
    "Explain what OpenRTB is and why DSPs, SSPs, and exchanges all adopted it",
    "Say which benefits of RTB matter to an advertiser, and which matter to a publisher",
  ],
  Body,
  takeaways: [
    "OpenRTB is the shared JSON specification — launched by the IAB-led RTB Project in November 2010 — that lets DSPs, SSPs, and exchanges trade impressions in a common format.",
    "A bid request is built from objects — Impression, Device, User, Geo, and Publisher among them — and a DSP missing one of them has that much less to price a bid on.",
    "RTB benefits advertisers through real-time tracking, precise targeting, and fraud detection, and benefits publishers through higher CPMs, wider buyer pools, and dynamic floor pricing.",
  ],
  checkYourself: [
    {
      question: "A bid request arrives with no User object — the cookie was blocked. What can a DSP still work with?",
      answer: (
        <p>
          The Impression, Device, Geo, and Publisher objects. That's enough to bid on ad type,
          dimensions, device, location, and the page's own content — just not on anything tied to
          who the person is. The bid is usually still possible, just less precisely targeted.
        </p>
      ),
    },
    {
      question: "What does OpenRTB actually standardize?",
      answer: (
        <p>
          A shared JSON API specification — the format bid requests and bid responses are written
          in, and the object types each one is built from. It is what lets a DSP built by one
          company understand a bid request sent by an exchange built by another.
        </p>
      ),
    },
  ],
};

export default lesson;
