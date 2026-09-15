import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

const RICH_MEDIA_FORMATS = [
  "Expandable ads",
  "Interstitials",
  "Video sliders",
  "AR/3D ads",
  "Gamified advertising",
  "Shoppable media",
];

const EMERGING_FORMATS = [
  "QR codes",
  "Vertical-video experiences on TV screens",
  "AI-generated pause-screen overlays with product placements",
];

type Location = "Miami" | "Chicago" | "Seattle";
type TimeOfDay = "Morning" | "Evening";
type Weather = "Sunny" | "Rainy";

function buildScript(location: Location, time: TimeOfDay, weather: Weather) {
  const greeting = time === "Morning" ? "Good morning" : "Good evening";
  const weatherLine =
    weather === "Rainy"
      ? "Stay dry — grab our waterproof jacket at 20 percent off, today only."
      : "Make the most of the sun — our lightweight jacket is 20 percent off, today only.";
  return `${greeting}, ${location}. ${weatherLine}`;
}

function buildCompanionBanner(location: Location, weather: Weather) {
  return `${weather === "Rainy" ? "Rain-ready" : "Sun-ready"} in ${location} — 20% off today`;
}

const AUDIO_PROFILE: ChannelProfile = {
  title: "Audio advertising",
  description:
    "Sound-led ads on streaming services, podcasts, and online radio — served with the latest version of VAST because audio and video files are similar enough to share it.",
  formats: [
    { label: "Pre-roll audio" },
    { label: "Mid-roll audio" },
    { label: "Ad pods" },
    { label: "Dynamic ads" },
    { label: "Companion / banner ads" },
  ],
  keyFeatures: [
    "Served by the latest version of VAST, the Video Ad Serving Template",
    "Dynamic ads change by listener, location, time of day, and weather",
    "Companion banners shown on screen while the audio plays",
    "Ad pods bundle several ads into a single pre-roll or mid-roll file",
  ],
  techDetails:
    "Audio ads reuse VAST rather than a format of their own, because audio and video files are similar enough for the same delivery protocol to work. A static ad announces the same message to everyone; a dynamic ad rewrites that message using whatever is known about the listener.",
};

function Body() {
  const [location, setLocation] = useState<Location>("Miami");
  const [time, setTime] = useState<TimeOfDay>("Morning");
  const [weather, setWeather] = useState<Weather>("Sunny");
  const [podSize, setPodSize] = useState(1);

  const script = buildScript(location, time, weather);
  const banner = buildCompanionBanner(location, weather);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Rich media is an interactive form of digital advertising that incorporates video,
          animation, audio, expandable content, and gamified features. None of that is decoration —
          the point is to boost engagement, click-through rate (CTR), and conversions past what a
          static image can do.
        </p>
        <p>
          As platforms evolve, brands are introducing newer formats on top of the standard set —
          quick-response (QR) codes, vertical-video experiences built for TV screens, and
          AI-generated immersive ads such as pause-screen overlays with product placements sitting
          inside the content itself.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Rich media formats</h3>
        <ul className="flex flex-wrap gap-2">
          {RICH_MEDIA_FORMATS.map((format) => (
            <li key={format} className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground">
              {format}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs uppercase text-muted-foreground">Emerging</p>
        <ul className="mt-2 space-y-1">
          {EMERGING_FORMATS.map((format) => (
            <li key={format} className="text-sm text-muted-foreground">
              {format}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Set the signals for one listener and watch a dynamic audio ad rewrite its own script — and
          its companion banner — to match. Then stack a second and third ad into the same pod to see
          why a pod is one file, not three separate calls.
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          <div role="group" aria-label="Choose a location">
            <p className="text-xs uppercase text-muted-foreground">Location</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Miami", "Chicago", "Seattle"] as Location[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLocation(option)}
                  aria-pressed={location === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    location === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Choose a time of day">
            <p className="text-xs uppercase text-muted-foreground">Time of day</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Morning", "Evening"] as TimeOfDay[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setTime(option)}
                  aria-pressed={time === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    time === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div role="group" aria-label="Choose the weather">
            <p className="text-xs uppercase text-muted-foreground">Weather</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["Sunny", "Rainy"] as Weather[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setWeather(option)}
                  aria-pressed={weather === option}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    weather === option
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Ad file — this pod</p>
          <div className="mt-2 space-y-3">
            {Array.from({ length: podSize }, (_, i) => (
              <div key={i} className="rounded-md border border-border-strong bg-secondary p-3">
                <p className="text-xs uppercase text-muted-foreground">
                  Ad <span className="figure">{i + 1}</span> of <span className="figure">{podSize}</span> in
                  this file
                </p>
                <p className="measure mt-1 text-foreground">{script}</p>
              </div>
            ))}
          </div>

          <p className="mt-4 text-xs uppercase text-muted-foreground">Companion banner, on screen</p>
          <p className="measure mt-1 text-foreground">{banner}</p>

          <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Change how many ads share this pod">
            <button
              type="button"
              onClick={() => setPodSize((n) => Math.min(n + 1, 3))}
              className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Add an ad to this pod
            </button>
            <button
              type="button"
              onClick={() => setPodSize(1)}
              className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Reset to one ad
            </button>
          </div>
          {podSize > 1 && (
            <p className="measure mt-3 text-sm text-muted-foreground">
              Still one file, one break — an ad pod, not <span className="figure">{podSize}</span>{" "}
              separate calls to the player.
            </p>
          )}
        </div>
      </section>

      <ChannelDetail profile={AUDIO_PROFILE} />
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A request for "just a simple audio spot" turns into a real conversation about what changes per
      listener and what stays fixed. Knowing the difference between a static ad, a dynamic ad, and a
      pod of several ads in one file is what lets you answer whether a script actually needs to
      change — or whether the request was already a static ad all along.
    </p>
  ),
  objectives: [
    "Name at least four rich media formats and explain what makes them richer than a static image",
    "Explain what makes an audio ad dynamic rather than static, and what an ad pod is",
    "State why audio ads can reuse VAST instead of needing their own delivery standard",
  ],
  Body,
  takeaways: [
    "Rich media covers interactive formats — expandable ads, interstitials, video sliders, AR/3D ads, gamified ads, shoppable media — built to lift engagement, click-through rate, and conversions past what a static image achieves.",
    "Audio ads ride the same VAST protocol as video because the files are similar enough, and a dynamic audio ad changes its script based on the listener's location, time of day, and even the weather, unlike a static ad that announces the same message to everyone.",
    "An ad pod bundles one or more ads back to back inside a single file, played within one pre-roll or mid-roll break — not stacked as separate calls.",
  ],
  checkYourself: [
    {
      question: "Why can audio ads reuse a video delivery standard instead of needing one of their own?",
      answer: (
        <p>
          Because audio and video files are similar enough that the latest version of VAST already
          covers what audio needs — there was no reason to build a separate protocol.
        </p>
      ),
    },
    {
      question: "What's the difference between a static and a dynamic audio ad?",
      answer: (
        <p>
          A static ad announces the same message to everyone. A dynamic ad changes what it says
          based on what's known about the listener — their location, the time of day, even the
          weather — while the companion banner on screen updates to match.
        </p>
      ),
    },
    {
      question: "Your podcast ad plays the identical script to every listener no matter the weather or where they are. Is it dynamic? What would make it so?",
      answer: (
        <p>
          No — that is a static ad. Making it dynamic means feeding in listener signals like
          location, time of day, and weather so the script itself changes, and updating the companion
          banner to match whatever the script now says.
        </p>
      ),
    },
  ],
};

export default lesson;
