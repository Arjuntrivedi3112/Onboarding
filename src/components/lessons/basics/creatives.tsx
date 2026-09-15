import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type CreativeId = "graphic" | "animated" | "video" | "audio" | "native" | "rich";

type Creative = {
  id: CreativeId;
  label: string;
  senses: "seen" | "heard";
  what: string;
  formats: string[];
  inTheSlot: string;
};

/**
 * The book's three file types come first, because they are what a creative
 * actually is. The last three are how the file is dressed for the slot.
 */
const CREATIVES: Creative[] = [
  {
    id: "graphic",
    label: "Static graphic",
    senses: "seen",
    what: "A single image file. The plain banner most people picture when they hear the word ad.",
    formats: ["GIF", "JPEG"],
    inTheSlot: "One flat picture, sized to the slot, with a click-through behind it.",
  },
  {
    id: "animated",
    label: "Animated graphic",
    senses: "seen",
    what: "The same idea, moving. A short loop of frames, or a small interactive unit built in HTML5 — the web's own markup and animation stack, which replaced Flash for this job.",
    formats: ["GIF", "HTML5"],
    inTheSlot: "Frames or code that plays inside the slot, then settles on an end frame.",
  },
  {
    id: "video",
    label: "Video",
    senses: "seen",
    what: "A video file with its own playback. Placed before a piece of content it is pre-roll; dropped into the middle of it, mid-roll.",
    formats: ["MOV", "FLV", "MP4"],
    inTheSlot: "A player fills the slot and runs the file, usually with a skip control.",
  },
  {
    id: "audio",
    label: "Audio",
    senses: "heard",
    what: "A sound file with nothing to look at. This is the creative in a podcast or a music stream, and it is the reason the definition says sees or hears.",
    formats: [],
    inTheSlot: "Nothing renders visually. The file plays between segments of the stream.",
  },
  {
    id: "native",
    label: "Native",
    senses: "seen",
    what: "A creative built to match the look of the content around it — the publisher's own headline style, typeface, and layout — so it reads as part of the page rather than a box bolted onto it.",
    formats: ["JPEG", "HTML5"],
    inTheSlot: "A headline, an image, and a disclosure label in the publisher's own styling.",
  },
  {
    id: "rich",
    label: "Rich media",
    senses: "seen",
    what: "An interactive unit that can expand, play video, or respond to the user inside the ad itself. Heavier to build, and it needs a slot that permits it.",
    formats: ["HTML5"],
    inTheSlot: "A unit that can grow past the slot's resting size once the user engages with it.",
  },
];

function Body() {
  const [active, setActive] = useState<CreativeId>("graphic");
  const current = CREATIVES.find((c) => c.id === active) ?? CREATIVES[0];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A <span className="text-foreground">creative</span> is the file that contains the actual
          advertisement a user sees or hears. Not the campaign, not the targeting, not the deal —
          the file. Everything else in this industry exists to decide which creative goes into
          which ad space, and to check afterward whether that was a good idea.
        </p>
        <p>
          The most common types are graphical files, either static or animated; video files; and
          audio files. That last one is easy to forget, and it is why the definition says sees or
          hears rather than just sees.
        </p>
        <p>
          Creatives come in various formats. For graphics you will see GIF, JPEG, and HTML5, which
          replaced Flash for interactive units. For video, MOV, FLV, and MP4.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Drop each kind of creative into the ad space from the last lesson. Watch two things
          change together: what renders inside the container, and what file types the publisher has
          to accept for it to render at all.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a creative type">
          {CREATIVES.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setActive(option.id)}
              aria-pressed={active === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                active === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <div className="rounded-lg border border-border bg-secondary p-4">
            <div className="mb-4 h-3 w-32 rounded bg-muted-foreground/20" aria-hidden="true" />
            <div className="flex flex-wrap gap-4">
              <div className="min-w-[8rem] flex-1 space-y-2" aria-hidden="true">
                <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
                <div className="h-2.5 w-11/12 rounded bg-muted-foreground/20" />
                <div className="h-2.5 w-4/5 rounded bg-muted-foreground/20" />
                <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
              </div>
              <div className="w-44 shrink-0">
                <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-primary p-1.5">
                  <div className="flex h-full w-full flex-col items-center justify-center rounded bg-primary/10 px-2 text-center">
                    <span className="text-sm text-foreground">{current.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {current.senses === "heard" ? "plays, shows nothing" : "renders here"}
                    </span>
                  </div>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">The ad space, filled.</p>
              </div>
            </div>
          </div>

          <p className="measure mt-4 text-foreground">{current.what}</p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">Usual file formats</p>
          {current.formats.length > 0 ? (
            <ul className="mt-2 flex flex-wrap gap-2">
              {current.formats.map((format) => (
                <li
                  key={format}
                  className="figure rounded-md border border-border-strong bg-secondary px-2 py-1 text-sm text-foreground"
                >
                  {format}
                </li>
              ))}
            </ul>
          ) : (
            <p className="measure mt-1 text-muted-foreground">
              An audio file, delivered by whatever the streaming platform accepts. The standard
              format list everyone quotes covers graphics and video only.
            </p>
          )}

          <p className="mt-4 text-xs uppercase text-muted-foreground">What the slot does with it</p>
          <p className="measure mt-1 text-muted-foreground">{current.inTheSlot}</p>
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The file is not free to be anything it likes. A publisher's slot declares what it will
          accept — dimensions, file types, weight, whether a unit may expand — and a creative that
          misses any of those is simply not served. A campaign that looks fine in a design review
          and delivers nothing is very often a creative the inventory would not take.
        </p>
        <p>
          It also matters that a creative is a file rather than a page. The same file can be served
          into thousands of different slots on thousands of different sites, which is exactly what
          makes the rest of this industry possible.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign goes live and delivers nothing. Before anyone blames the targeting or the budget,
      someone will ask which creative was trafficked and in what format — because a file the
      publisher's slot will not accept never becomes an ad at all, no matter how good the media
      plan behind it was.
    </p>
  ),
  objectives: [
    "Define a creative as a file, and name the three most common types",
    "Match a creative type to the formats it usually ships in",
    "Explain why an audio creative counts as a creative even though nothing renders",
  ],
  Body,
  takeaways: [
    "A creative is the file that contains the actual advertisement a user sees or hears — most commonly a graphical file, a video file, or an audio file.",
    "Graphics ship as GIF, JPEG, or HTML5, which replaced Flash; video ships as MOV, FLV, or MP4.",
    "Native and rich media are not new file types but ways of dressing the same files for the slot, so the slot's own rules decide whether they can run.",
  ],
  checkYourself: [
    {
      question: "A colleague says the creative is the banner they see on the page. What are they missing?",
      answer: (
        <p>
          The banner on the page is one rendering of the creative. The creative is the file itself,
          which is why the same one can run in many slots on many sites at once — and why an audio
          ad, which renders nothing at all, is just as much a creative.
        </p>
      ),
    },
    {
      question: "A publisher's slot accepts JPEG and GIF only. An advertiser hands you a rich media unit that expands on hover. What happens?",
      answer: (
        <p>
          It cannot run there. Rich media needs HTML5 and a slot that permits expansion, so this
          pairing fails before targeting is ever consulted. Either the advertiser supplies a static
          fallback in an accepted format, or the buy moves to inventory that takes the unit.
        </p>
      ),
    },
  ],
};

export default lesson;
