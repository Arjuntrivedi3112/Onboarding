import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

import { SERVING_STEPS } from "./_shared";

/** Look up a serving step's short title by id, for cross-referencing below. */
function stepTitle(id: number) {
  return SERVING_STEPS.find((step) => step.id === id)?.title ?? `Step ${id}`;
}

interface Subsystem {
  id: string;
  number: number;
  name: string;
  short: string;
  detail: string;
  /** Serving-step ids (from the four-stages lesson) this subsystem is active during. */
  powers: number[];
  /** True when the subsystem runs continuously rather than at one point in the chain. */
  crossCutting?: boolean;
}

/** The book's nine ad-server subsystems, in the order it presents them. */
const SUBSYSTEMS: Subsystem[] = [
  {
    id: "decision-engine",
    number: 1,
    name: "Ad decision engine",
    short: "Decides which ad wins the slot.",
    detail:
      "The decision-maker. It processes millions of signals in real time — who the user is, what page they are on, which targeting rules apply, and which campaigns still have budget left — balancing logic and strategy to deliver the most relevant, best-performing ad without violating campaign rules or budgets.",
    powers: [3, 5],
  },
  {
    id: "inventory-management",
    number: 2,
    name: "Inventory management system",
    short: "Tracks which ad spaces exist and what qualifies to fill them.",
    detail:
      "Picture hosting a conference with hundreds of speakers and limited stage time. This system manages the “stages” — the ad spaces across websites, apps and devices. It tracks what inventory is available, organizes placements by format, location and priority, and matches them to the campaigns that qualify to fill those slots. Without it, no one would know where or when ads should appear.",
    powers: [3],
  },
  {
    id: "creative-repository",
    number: 3,
    name: "Creative repository",
    short: "Stores every creative file the ad server can serve.",
    detail:
      "Every ad needs a home before it is served. The repository securely stores HTML5 banners, video ads, image assets and third-party tags, and the ad server pulls from this vault to instantly serve creatives optimized for format, size and speed.",
    powers: [6],
  },
  {
    id: "targeting-module",
    number: 4,
    name: "Targeting and segmentation module",
    short: "Matches user data to campaign criteria.",
    detail:
      "This is where personalization happens. The targeting engine reads data from cookies, device IDs, geolocation or user segments and matches it to campaign criteria — whether that criteria is “women aged 25 to 34 in New York” or “returning users who abandoned cart last week.”",
    powers: [2, 3],
  },
  {
    id: "delivery-engine",
    number: 5,
    name: "Delivery engine",
    short: "Gets the chosen ad to the user in milliseconds.",
    detail:
      "The delivery engine takes the selected ad and gets it to the user in milliseconds. It connects with content delivery networks (CDNs) to reduce load times, and handles everything from rendering banners to autoplaying video.",
    powers: [6],
  },
  {
    id: "tracking-system",
    number: 6,
    name: "Tracking and measurement system",
    short: "Logs every impression, click and conversion.",
    detail:
      "Invisible tracking pixels, software development kits (SDKs) or beacons collect this data and feed it into dashboards for real-time insight. The system logs impressions, clicks, viewability, engagements and conversions.",
    powers: [7],
  },
  {
    id: "reporting-interface",
    number: 7,
    name: "Reporting and analytics interface",
    short: "Turns raw logs into decisions advertisers can act on.",
    detail:
      "This module transforms raw data into actionable insight, so marketers can make better decisions faster. Advertisers and publishers log in to see campaign performance, budget pacing, engagement rates and recommendations for optimization.",
    powers: [],
    crossCutting: true,
  },
  {
    id: "frequency-control",
    number: 8,
    name: "Identity and frequency control layer",
    short: "Stops the same ad, or the wrong sequence of ads, from over-showing.",
    detail:
      "Nobody likes seeing the same ad a hundred times. This layer enforces frequency caps — for example, three impressions per user per day — user ID matching for cross-device delivery, and sequenced messaging: showing Story A before Story B.",
    powers: [3],
  },
  {
    id: "api-layer",
    number: 9,
    name: "API and integration layer",
    short: "Connects the ad server to everything around it.",
    detail:
      "Modern ad servers do not live in isolation. They need to work with dozens of systems: demand-side platforms (DSPs), customer relationship management (CRM) platforms, analytics platforms, consent managers and more. This layer provides the real-time connectivity, customization and automation that makes those connections possible.",
    powers: [],
    crossCutting: true,
  },
];

function Body() {
  const [selectedId, setSelectedId] = useState<string>(SUBSYSTEMS[0].id);
  const selected = SUBSYSTEMS.find((subsystem) => subsystem.id === selectedId) ?? SUBSYSTEMS[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          An ad server is not one program. It runs on a set of tightly integrated systems, each with
          a specific job, that together power the entire ad delivery process — the way a high-speed
          dispatch center runs on dispatchers, a map of vehicles and a radio, not just one person
          making calls.
        </p>
        <p>
          The book names nine of these subsystems. Six of them fire at a specific point in the
          seven-step chain from the previous lessons; the other three — reporting and the API layer
          among them — run continuously, in the background, rather than at one moment.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Select a subsystem to read what it does and, where it applies, which step of a served
          impression it is active during.
        </p>

        <div
          className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
          role="group"
          aria-label="Choose an ad-server subsystem"
        >
          {SUBSYSTEMS.map((subsystem) => (
            <button
              key={subsystem.id}
              type="button"
              onClick={() => setSelectedId(subsystem.id)}
              aria-pressed={selectedId === subsystem.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border p-3 text-left transition-colors",
                selectedId === subsystem.id
                  ? "border-primary bg-primary/10"
                  : "border-border bg-card hover:border-primary/30"
              )}
            >
              <p className="text-xs uppercase text-muted-foreground">
                <span className="figure">{subsystem.number}</span>
              </p>
              <p className="mt-1 text-sm text-foreground">{subsystem.name}</p>
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-xs uppercase text-muted-foreground">
              Subsystem <span className="figure">{selected.number}</span> of{" "}
              <span className="figure">{SUBSYSTEMS.length}</span>
            </p>
          </div>
          <h4 className="mt-1 text-lg text-foreground">{selected.name}</h4>
          <p className="measure mt-1 text-sm text-muted-foreground">{selected.short}</p>
          <p className="measure mt-3 text-muted-foreground">{selected.detail}</p>

          <div className="mt-4 border-t border-border pt-3">
            {selected.crossCutting ? (
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">Runs continuously</span> — this one has no single
                moment in the chain, because it works downstream of every step at once.
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="text-foreground">Active during: </span>
                {selected.powers.map((id, index) => (
                  <span key={id}>
                    {index > 0 ? ", " : ""}
                    {stepTitle(id)}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A programmatic environment, or a large-scale publisher's ad server, adds three more
          components on top of these nine — a real-time bidding engine, a header bidding manager and
          brand safety and verification tools. The lesson on auctions covers all three, since none of
          them exist until bidding enters the picture.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-secondary p-5">
        <p className="text-xs uppercase text-muted-foreground">Case study</p>
        <p className="measure mt-2 text-foreground">Personalized messaging tool</p>
        <p className="measure mt-1 text-sm text-muted-foreground">
          One platform built on these nine subsystems lets merchants build personalized onsite
          campaigns — targeted messaging that promotes a merchant's core business offers to the
          visitor currently on the page. It renders that personalized message within{" "}
          <span className="figure">50</span> milliseconds, inside the same delivery-engine budget
          that a banner ad has to work within.
        </p>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      "The ad server is broken" almost never means all of it. A blank slot points at the delivery
      engine or the creative repository; a user seeing an ad thirty times in a day points at the
      frequency control layer; a report that will not reconcile points at the reporting interface.
      Naming the subsystem is how you get from a vague complaint to the right fix.
    </p>
  ),
  objectives: [
    "Name the nine subsystems the book identifies inside an ad server",
    "Say which point in a served impression a given subsystem is active during, or that it runs continuously",
    "Distinguish the ad server's core nine subsystems from the extra components a programmatic auction adds",
  ],
  Body,
  takeaways: [
    "An ad server is nine tightly integrated subsystems, not one program: a decision engine, inventory management, a creative repository, targeting, delivery, tracking, reporting, frequency control and an API layer.",
    "Most of these fire at one specific point in the seven-step serving chain — campaign matching alone touches four of them — while reporting and the API layer run continuously in the background.",
    "The real-time bidding engine, header bidding manager and brand safety tools are not part of the core nine; they only appear once an auction is involved.",
  ],
  checkYourself: [
    {
      question: "A user reports seeing the exact same ad on every page load for a week straight. Which subsystem owns that bug?",
      answer: (
        <p>
          The identity and frequency control layer. It is the component responsible for enforcing
          frequency caps and user ID matching across devices — if the same creative keeps winning
          for the same person, the cap either was not set or is not being read correctly.
        </p>
      ),
    },
    {
      question: "Why does reporting count as a subsystem at all, if it does not run during the seven-step chain?",
      answer: (
        <p>
          Because the chain is only half the job. The tracking system logs raw events during
          serving, but someone still has to turn impressions, clicks and conversions into budget
          pacing and optimization recommendations afterward. That transformation is a distinct piece
          of engineering, not a byproduct of the other eight.
        </p>
      ),
    },
  ],
};

export default lesson;
