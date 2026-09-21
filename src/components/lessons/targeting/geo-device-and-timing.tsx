import { useState } from "react";

import { IqmSpotlight } from "@/components/journey/IqmSpotlight";
import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

interface RequestField {
  id: string;
  label: string;
  raw: string;
  derived: string;
  note?: string;
}

/**
 * What one real ad request reveals, field by field, without anything being
 * stored about the visitor beforehand. The user-agent string is the book's
 * own literal example.
 */
const FIELDS: RequestField[] = [
  {
    id: "ip",
    label: "Device IP address",
    raw: "73.162.140.52",
    derived: "Maps to Chicago, Illinois, US via an external IP-to-location database.",
    note: "This is the coarsest signal here — typically accurate to country, region or city.",
  },
  {
    id: "gps",
    label: "GPS coordinates (native mobile apps only)",
    raw: "41.8781° N, 87.6298° W",
    derived: "Falls within a five-mile radius of a downtown Chicago point of sale.",
    note: "Far more precise than IP, but GPS data can be imprecise or manipulated, so providers aggregate and cross-reference multiple data points and sensors before trusting it.",
  },
  {
    id: "useragent",
    label: "User-agent header",
    raw: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/22A5297f Safari/605.1",
    derived: "The build tag 22A5297f identifies an iPhone 15 Pro Max running iOS 18.0.",
    note: "Every ad request carries this header. From it an advertiser reads the operating system, browser type and version, and device type, brand and model.",
  },
  {
    id: "timestamp",
    label: "Request timestamp",
    raw: "Friday, 16:42 local time",
    derived: "Falls inside a Friday 3 PM to 8 PM day-part window.",
    note: "Timestamps cost nothing extra to read — the request already carries one.",
  },
];

const DAYPART_TESTS = [
  { label: "Friday, 11:00 AM", inWindow: false },
  { label: "Friday, 4:15 PM", inWindow: true },
  { label: "Friday, 7:45 PM", inWindow: true },
  { label: "Saturday, 5:00 PM", inWindow: false },
] as const;

function Body() {
  const [selectedFieldId, setSelectedFieldId] = useState<string>(FIELDS[0].id);
  const selectedField = FIELDS.find((field) => field.id === selectedFieldId) ?? FIELDS[0];

  const [testIndex, setTestIndex] = useState(1);
  const test = DAYPART_TESTS[testIndex];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Three targeting methods need nothing stored about a person at all — they read facts the
          ad request already carries with it. Where the request came from, what it came from, and
          when it arrived are each, on their own, a usable targeting signal.
        </p>
      </div>

      <IqmSpotlight>
        IQM's geo-farming goes further than a standard IP lookup: it draws custom boundaries around
        a location rather than stopping at the zip code, so a healthcare advertiser can target
        exactly the block radius around a clinic instead of the whole surrounding zip.
      </IqmSpotlight>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Location, from the request alone</h3>
        <div className="measure space-y-3 text-sm text-muted-foreground">
          <p>
            When a user's browser sends an ad request, it includes the device's IP address. The ad
            server uses an external database to map that address to a geographic location —
            typically the country, region or city. For example, someone reading news articles on a
            laptop in Chicago could very well see ads promoting shops and restaurants in the
            Chicago area.
          </p>
          <p>
            Native mobile apps can go further, passing a smartphone's exact longitude and latitude
            from its GPS to the ad server. That lets the ad server target users within a radius of
            a specific point — within five miles of a store, say — which is far more accurate and
            precise than the IP address method. Even GPS data can occasionally be imprecise or
            manipulated, though, so data providers often aggregate and cross-reference multiple
            data points and sensors to improve reliability.
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Device and browser, from one header</h3>
        <p className="measure text-sm text-muted-foreground">
          Every ad request to the ad server carries a user-agent HTTP header. From it, advertisers
          can read the user's operating system, browser type and version, and device type, brand
          and model — for instance, identifying an iPhone or an Android smartphone. Targeting on
          hardware or software lets an advertiser reach a specific audience with a highly relevant
          message: a mobile-gaming company could promote its new Android game only to consumers on
          Android phones and tablets.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Select a field from one real ad request and see what it alone reveals about the person
          who sent it.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a field of the ad request">
          {FIELDS.map((field) => (
            <button
              key={field.id}
              type="button"
              onClick={() => setSelectedFieldId(field.id)}
              aria-pressed={selectedFieldId === field.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                selectedFieldId === field.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {field.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Raw value in the request</p>
          <p className="figure measure mt-1 break-all text-sm text-foreground">{selectedField.raw}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">What it derives</p>
          <p className="measure mt-1 text-foreground">{selectedField.derived}</p>

          {selectedField.note && (
            <p className="measure mt-3 border-t border-border pt-3 text-sm text-muted-foreground">
              {selectedField.note}
            </p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Day of week and time of day</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Displaying ads based on the day of the week, and even the time of day, lets advertisers
          reach their audience at the right moment and avoid wasting budget. A pizza restaurant
          could advertise its Friday night specials on Friday afternoons between 3 PM and 8 PM.
          Similarly, if a brand observes engagement peaking during certain hours, it can schedule
          ads to run during those windows — improving targeting efficiency, click-through rate,
          and conversions all at once.
        </p>

        <p className="measure mb-3 text-sm text-muted-foreground">
          Try a request timestamp against that Friday 3 PM to 8 PM schedule:
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a request timestamp to test">
          {DAYPART_TESTS.map((option, index) => (
            <button
              key={option.label}
              type="button"
              onClick={() => setTestIndex(index)}
              aria-pressed={testIndex === index}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                testIndex === index
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div
          className={cn(
            "mt-4 rounded-lg border p-5",
            test.inWindow ? "border-primary bg-primary/10" : "border-border bg-card"
          )}
        >
          <p className="text-xs uppercase text-muted-foreground">Result</p>
          <p className="measure mt-1 text-foreground">
            {test.inWindow
              ? "Inside the Friday specials window — the pizza ad serves."
              : "Outside the Friday specials window — the ad is held back so the budget is not spent on a moment nobody will act on."}
          </p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          None of these three methods needs a profile built over time — location, device and
          timing are read fresh from every single request. That is exactly why they are combined
          so freely with contextual, behavioral and demographic targeting: they add precision at
          essentially no privacy cost.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign underperforming in one city, on one device, at the wrong hour is one of the most
      common tickets you will get. Being able to read the ad request itself — IP, user-agent,
      timestamp — is often faster than waiting on a data team, because the answer is already
      sitting in the request.
    </p>
  ),
  objectives: [
    "Explain how an ad server derives a location from an IP address, and why GPS from a mobile app is more precise",
    "Read a user-agent header and say what it reveals about operating system, browser and device",
    "Explain why day-parting improves both efficiency and engagement, using the Friday pizza example",
  ],
  Body,
  takeaways: [
    "IP address gives a coarse location; native mobile GPS gives precise coordinates for radius targeting, though GPS itself can be imprecise or manipulated.",
    "Every ad request carries a user-agent header naming the operating system, browser type and version, and device type, brand and model — no profile required.",
    "Scheduling ads to the day of the week and time of day avoids wasted budget and improves click-through rate and conversions by matching real engagement peaks.",
  ],
  checkYourself: [
    {
      question:
        "A campaign wants to reach shoppers within five miles of a single store. Is IP-based geolocation good enough?",
      answer: (
        <p>
          Usually not on its own. IP address typically resolves to a country, region or city —
          coarser than a five-mile radius. That level of precision needs GPS coordinates from a
          native mobile app, cross-referenced against other signals since GPS alone can be
          imprecise or manipulated.
        </p>
      ),
    },
    {
      question:
        "Why would a brand bother reading engagement data to set a day-part schedule instead of just running ads around the clock?",
      answer: (
        <p>
          Because running ads at every hour spends budget on moments when almost nobody converts.
          Matching the schedule to observed engagement peaks — the way the pizza restaurant targets
          Friday 3 to 8 PM — reaches the same audience for less money and with a better
          click-through rate.
        </p>
      ),
    },
  ],
};

export default lesson;
