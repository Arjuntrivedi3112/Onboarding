import type { LessonContent } from "@/components/journey/lesson-content";

/** The four verbs the book uses to define an ad server. */
const FOUR_JOBS = [
  {
    verb: "Store",
    line: "Hold the creatives — HTML5 banners, video files, image assets and third-party tags — somewhere they can be pulled from instantly.",
  },
  {
    verb: "Select",
    line: "Decide which of the eligible campaigns should win this particular slot, for this particular person, right now.",
  },
  {
    verb: "Deliver",
    line: "Get the chosen creative into the slot, usually by way of a content delivery network, before the reader notices a gap.",
  },
  {
    verb: "Track",
    line: "Log what happened — impressions, clicks, conversions, viewability, engagement — and feed it back into reports.",
  },
];

function Body() {
  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Ad servers are the backbone of digital advertising — determining which ad appears, where,
          when, and to whom. Everything in this section follows the journey of a single ad from
          request to display.
        </p>
        <p>
          The definition itself is dry:{" "}
          <span className="text-foreground">
            an ad server is a technology platform that automates storing, selecting, delivering and
            tracking digital ads
          </span>
          . It exists so that the right ad is shown to the right user at the right time, while
          performance data is collected along the way.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Four verbs, one machine</h3>
        <ul className="grid gap-3 sm:grid-cols-2">
          {FOUR_JOBS.map((job, index) => (
            <li key={job.verb} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">
                Job <span className="figure">{index + 1}</span>
              </p>
              <p className="mt-1 text-foreground">{job.verb}</p>
              <p className="mt-1 text-sm text-muted-foreground">{job.line}</p>
            </li>
          ))}
        </ul>
        <p className="measure mt-3 text-sm text-muted-foreground">
          If you remember nothing else about ad servers, remember those four. Every component
          inside one exists to do a piece of one of them.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          In simple terms, an ad server functions like a high-speed dispatch center — constantly
          scanning the digital landscape, making split-second decisions, and delivering tailored
          ads to the right audience at the right time. A dispatcher does not make the deliveries
          and does not own the packages. It knows what is available, who is asking, what the rules
          are, and it decides in the moment.
        </p>
        <p>
          That decision is not made by a single program. An ad server runs on a set of tightly
          integrated systems, each with a specific job, that together power the entire ad delivery
          process. A later lesson opens the box and names all nine of them.
        </p>
      </div>

      <section className="rounded-lg border border-border bg-secondary p-5">
        <p className="text-xs uppercase text-muted-foreground">Where this section goes next</p>
        <ol className="measure mt-2 space-y-2 text-muted-foreground">
          <li>
            <span className="text-foreground">The four stages of one served ad</span> — the request,
            the decision, the delivery and the tracking, with a clock running.
          </li>
          <li>
            <span className="text-foreground">What changes when an auction joins in</span> — how
            real-time bidding (RTB) — a live auction that decides who fills the slot while the page
            is still loading — slots into the same chain.
          </li>
          <li>
            <span className="text-foreground">Whose ad server is whose</span> — the publisher's
            server and the advertiser's server, the same technology doing opposite jobs.
          </li>
          <li>
            <span className="text-foreground">Inside the box, and the code in the slot</span> — the
            nine subsystems, then the ad tags and ad markup that connect them to a page.
          </li>
        </ol>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      In your first week someone will say "check the ad server" and expect you to know which
      machine they mean and what it was supposed to have done. Every later argument in this job —
      a discrepancy, an underdelivering campaign, a slot that renders blank — is an argument about
      one of four things this box does.
    </p>
  ),
  objectives: [
    "Define an ad server in one sentence using the four verbs: store, select, deliver, track",
    "Explain why an ad server is described as a dispatch center rather than a warehouse",
    "Name the stage of the serving process where a given problem would have to have occurred",
  ],
  Body,
  takeaways: [
    "An ad server is a technology platform that automates storing, selecting, delivering and tracking digital ads.",
    "Its whole purpose is getting the right ad to the right user at the right time, and collecting the performance data that proves it happened.",
    "It behaves like a high-speed dispatch center: it owns no media and makes no creative, it just decides, in milliseconds, what goes where.",
  ],
  checkYourself: [
    {
      question: "A campaign is reported as delivering impressions, but the advertiser says nobody ever saw the ad. Which of the four jobs is in question?",
      answer: (
        <p>
          Tracking — specifically viewability, which the ad server logs alongside impressions,
          clicks, conversions and engagement. An impression counted is not the same as an ad seen,
          and the ad server records both kinds of fact.
        </p>
      ),
    },
    {
      question: "Why does it matter that an ad server selects rather than simply stores?",
      answer: (
        <p>
          Because storage is the easy half. A publisher may have dozens of eligible campaigns for
          one slot, each with its own targeting, flight dates and budget. The value of the ad
          server is that it resolves all of that into one creative, for one person, in
          milliseconds — and can explain afterwards why that one won.
        </p>
      ),
    },
  ],
};

export default lesson;
