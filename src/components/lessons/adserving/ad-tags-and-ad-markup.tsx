import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Job = "creative" | "track";

interface CodeLine {
  text: string;
  job?: Job;
}

interface TagType {
  id: string;
  name: string;
  blurb: string;
  placed: CodeLine[];
  returned: CodeLine[];
  returnedLabel: string;
  note: string;
}

const JOB_LABEL: Record<Job, string> = {
  creative: "Loads the creative",
  track: "Tracks the impression",
};

/** The five tag types the book names, each with a placed ad tag and the ad markup it gets back. */
const TAG_TYPES: TagType[] = [
  {
    id: "javascript",
    name: "JavaScript ad tag",
    blurb: "The most common tag on the open web: a script element the publisher's page executes.",
    placed: [
      { text: '<script src="https://ads.example.com/tag.js"' },
      { text: '        data-slot="leaderboard-728x90"></script>' },
    ],
    returnedLabel: "Ad markup the script writes into the page",
    returned: [
      { text: "(function () {" },
      {
        text: '  document.write(\'<img src="https://cdn.example.com/creative/128.jpg">\');',
        job: "creative",
      },
      { text: '  new Image().src = "https://track.example.com/imp?id=128";', job: "track" },
      { text: "})();" },
    ],
    note: "Because it runs as real script in the publisher's page, a JavaScript tag can do almost anything — which is exactly why iframe and SafeFrame tags exist, to take that power away again.",
  },
  {
    id: "iframe",
    name: "iframe ad tag",
    blurb: "Sandboxes the ad in its own document, so the ad's code cannot reach the publisher's page.",
    placed: [
      { text: '<iframe src="https://ads.example.com/serve?slot=sidebar-300x250"' },
      { text: '        width="300" height="250"></iframe>' },
    ],
    returnedLabel: "Ad markup rendered inside the iframe's own document",
    returned: [
      { text: '<img src="https://cdn.example.com/creative/300x250.png"', job: "creative" },
      { text: '     width="300" height="250">', job: "creative" },
      { text: '<img src="https://track.example.com/imp?id=300" width="1" height="1">', job: "track" },
    ],
    note: "The tradeoff for that isolation: the ad cannot resize itself or measure how much of it is actually on screen without a further API, which is what SafeFrame adds back.",
  },
  {
    id: "safeframe",
    name: "SafeFrame ad tag",
    blurb: "An iframe with a controlled application programming interface (API) reopened for viewability and resizing.",
    placed: [
      { text: '<script src="https://ads.example.com/safeframe.js"' },
      { text: '        data-slot="mrec-300x250"></script>' },
    ],
    returnedLabel: "Ad markup returned through the SafeFrame API",
    returned: [
      { text: "$sf.ext.register(300, 250);" },
      {
        text: 'renderCreative("https://cdn.example.com/creative/300x250.html");',
        job: "creative",
      },
      { text: 'reportViewability("https://track.example.com/view?id=301");', job: "track" },
    ],
    note: "Same sandbox as a plain iframe, but the publisher and the ad server agree in advance on exactly which calls — resize, report viewability — are allowed through it.",
  },
  {
    id: "img",
    name: "img ad tag",
    blurb: "The simplest possible tag: one request, no script execution at all.",
    placed: [{ text: '<img src="https://ads.example.com/serve?slot=banner-320x50"' }, { text: '     width="320" height="50">' }],
    returnedLabel: "What comes back",
    returned: [
      { text: "HTTP 200, Content-Type: image/png", job: "creative" },
      { text: "-> the creative's own image bytes, sent directly", job: "creative" },
    ],
    note: "There is no separate ad markup to parse. The single request for the image is the creative load and the impression at once — the ad server counts the request itself, which is also why a plain img tag is the classic shape of a bare tracking pixel.",
  },
  {
    id: "video",
    name: "Video ad tag (VAST)",
    blurb: "The video player, not the browser, requests and reads this one — following the Video Ad Serving Template (VAST) standard.",
    placed: [{ text: 'player.requestAds("https://ads.example.com/vast?slot=preroll-instream");' }],
    returnedLabel: "Ad markup: a VAST response the player parses",
    returned: [
      { text: "<VAST version=\"4.0\"><Ad><InLine>" },
      {
        text: '  <Impression><![CDATA[https://track.example.com/imp?id=500]]></Impression>',
        job: "track",
      },
      { text: "  <Creatives><Creative><Linear>" },
      {
        text: '    <MediaFiles><MediaFile><![CDATA[https://cdn.example.com/creative/500.mp4]]>',
        job: "creative",
      },
      { text: "    </MediaFile></MediaFiles>" },
      { text: "    <TrackingEvents>" },
      {
        text: '      <Tracking event="complete"><![CDATA[https://track.example.com/complete?id=500]]>',
        job: "track",
      },
      { text: "      </Tracking>" },
      { text: "    </TrackingEvents>" },
      { text: "  </Linear></Creative></Creatives>" },
      { text: "</InLine></Ad></VAST>" },
    ],
    note: "A video ad tracks more than one moment — the player fires a separate tracking call for each quartile of playback, not just once at the start.",
  },
];

function CodeBlock({ lines, label }: { lines: CodeLine[]; label: string }) {
  return (
    <div>
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <div className="measure mt-2 space-y-0.5 rounded-lg border border-border bg-secondary p-3 font-mono text-sm">
        {lines.map((line, index) => (
          <div
            key={index}
            className={cn(
              "flex flex-wrap items-baseline gap-2 whitespace-pre-wrap break-all border-l-2 pl-2",
              line.job === "creative"
                ? "border-primary text-foreground"
                : line.job === "track"
                  ? "border-accent text-foreground"
                  : "border-transparent text-muted-foreground"
            )}
          >
            <span>{line.text}</span>
            {line.job && (
              <span
                className={cn(
                  "text-xs uppercase",
                  line.job === "creative" ? "text-primary" : "text-accent"
                )}
              >
                {JOB_LABEL[line.job]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function Body() {
  const [tagId, setTagId] = useState<string>(TAG_TYPES[0].id);
  const tag = TAG_TYPES.find((entry) => entry.id === tagId) ?? TAG_TYPES[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every ad on a page sits behind two pieces of code, and it is worth keeping them apart. An{" "}
          <span className="text-foreground">ad tag</span> is a piece of code inserted into an ad slot
          to display an ad — it is placeholder and instruction, written once into the page, and it
          waits. Ad tags come in different types depending on how they are implemented: JavaScript ad
          tags, iframe ad tags, SafeFrame ad tags, img ad tags and video ad tags.
        </p>
        <p>
          <span className="text-foreground">Ad markup</span> is what the tag gets back — code
          retrieved from an ad server, or some other AdTech platform, via the tag and rendered in the
          slot. Ad markup always does two jobs at once: it loads the actual creative file into the ad
          slot, and it tracks the impression by loading tracking tags, or pixels, for measurement, ad
          verification and viewability.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Choose a tag type to see what sits in the page waiting, and what comes back to fill it.
          Each line of the returned markup is marked with whichever of ad markup's two jobs it is
          doing.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose an ad tag type">
          {TAG_TYPES.map((entry) => (
            <button
              key={entry.id}
              type="button"
              onClick={() => setTagId(entry.id)}
              aria-pressed={tagId === entry.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                tagId === entry.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {entry.name}
            </button>
          ))}
        </div>

        <div className="mt-4 space-y-4 rounded-lg border border-border bg-card p-5">
          <p className="measure text-sm text-muted-foreground">{tag.blurb}</p>

          <CodeBlock label="In the page: the ad tag" lines={tag.placed} />
          <CodeBlock label={tag.returnedLabel} lines={tag.returned} />

          <p className="measure text-sm text-muted-foreground">{tag.note}</p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice the pattern across all five: the tag itself never carries the creative. It only
          names a slot and points at an ad server. Every actual decision — which campaign, which
          creative, which tracking calls — happens later, inside the ad markup that comes back. That
          is what makes the same tag reusable across a million different impressions without ever
          being rewritten.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      When a slot renders blank, or a tracking number will not reconcile, the first question is
      always which of these two pieces of code broke — the tag that never fired, or the markup it
      got back that failed to load. Telling them apart is the difference between debugging a
      placement and debugging a campaign.
    </p>
  ),
  objectives: [
    "Define an ad tag and an ad markup, and say what separates them",
    "Name the five tag types the book identifies, by how each is implemented",
    "State ad markup's two jobs, and identify which job a given line of markup is doing",
  ],
  Body,
  takeaways: [
    "An ad tag is a piece of code placed in an ad slot to request an ad; ad markup is the code an ad server sends back through that tag to fill it.",
    "The book names five tag types by implementation — JavaScript, iframe, SafeFrame, img and video (VAST) — each trading off differently between simplicity and sandboxing.",
    "Ad markup always does two jobs: loading the creative file into the slot, and tracking the impression by loading pixels for measurement, verification and viewability.",
  ],
  checkYourself: [
    {
      question: "A publisher wants third-party script code in a slot to never be able to reach the rest of the page. Which tag type buys them that, and what do they give up for it?",
      answer: (
        <p>
          An iframe, or a SafeFrame if they still need viewability and resizing. Both isolate the
          returned markup into its own document so it cannot touch the publisher's page. The plain
          iframe gives up an easy way to measure how much of the ad is on screen — SafeFrame reopens
          just that one capability through a controlled API.
        </p>
      ),
    },
    {
      question: "Why does an img ad tag have no separate ad markup to inspect?",
      answer: (
        <p>
          Because the single request the img tag makes is both jobs at once. The response is the
          creative's own image bytes, and the ad server counts the request itself as the impression
          — there is no second document to parse the way there is with JavaScript, iframe, SafeFrame
          or video tags.
        </p>
      ),
    },
  ],
};

export default lesson;
