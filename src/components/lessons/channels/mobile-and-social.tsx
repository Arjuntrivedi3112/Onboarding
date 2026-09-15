import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

const SOCIAL_ADVANTAGES = [
  {
    title: "Retargeting",
    detail: "Reaching users again through email addresses they already gave a brand, often at a higher conversion rate.",
  },
  {
    title: "Advanced targeting",
    detail: "Platforms collect extensive demographic and behavioral data — name, age, location, interests, education.",
  },
  {
    title: "Cost-effectiveness",
    detail: "Often more affordable than display or video while still delivering strong reach and conversions.",
  },
  {
    title: "Higher engagement",
    detail: "Native in format, so social ads typically outperform standard banners and see less ad-blocking.",
  },
];

const MOBILE_WEB_STEPS = [
  "Ad tag fires in the mobile browser",
  "Browser calls the ad server or exchange",
  "Creative renders in an isolated iframe",
];

const INAPP_STEPS = [
  "The developer's SDK declares the ad space, medium, and format",
  "A device identifier — IDFA on iOS, GAID on Android — goes out with the request",
  "The ad renders natively, inside the app's own code",
  "A postback URL reports the install back to the advertiser",
];

const MOBILE_PROFILE: ChannelProfile = {
  title: "Mobile app advertising",
  description:
    "Ads inside mobile applications, rendered through a software development kit (SDK) rather than a browser — unlike mobile web, which relies on one.",
  formats: [
    { label: "Banner" },
    { label: "Interstitial" },
    { label: "Rewarded video" },
    { label: "Native" },
    { label: "Playable" },
    { label: "Offerwall" },
  ],
  keyFeatures: [
    "SDK-based rendering, not a browser tag",
    "Device-ID targeting — IDFA on iOS, GAID on Android",
    "Install attribution via a postback URL",
    "Developer chooses both the ad medium and the ad format",
  ],
  techDetails:
    "An app developer integrates the AdTech vendor's SDK, defines the available ad space, and selects both the ad medium — text, image, native, video — and the ad format — interstitial, banner, and so on. There is no page for a browser to load, so there is no ad tag; the SDK is doing that job instead.",
};

const SOCIAL_PROFILE: ChannelProfile = {
  title: "Social media advertising",
  description:
    "A distinct channel in its own right, even though a social network's ads could be delivered over web or mobile app. Most social platforms serve ads as native units in and next to the news feed.",
  formats: [
    { label: "Feed" },
    { label: "Story" },
    { label: "Carousel" },
    { label: "Video" },
    { label: "Lead-gen form" },
    { label: "Shopping" },
  ],
  keyFeatures: [
    "Retargeting via email addresses a user already gave the brand",
    "Advanced demographic and behavioral targeting",
    "Cost-effective reach compared with display or video",
    "Higher engagement, since the ads are native in format",
  ],
  techDetails:
    "Because most social ads render natively in the feed, they read as organic content rather than a bolted-on banner — which is exactly what drives both the engagement advantage and the reduced exposure to ad-blocking tools.",
};

function Body() {
  const [blocked, setBlocked] = useState(false);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Mobile app advertising — in-app advertising — puts ads inside a mobile application rather
          than a browser tab. Unlike mobile web advertising, which still relies on a browser to load
          an ad tag, in-app advertising requires a software development kit (SDK) to render ads at
          all, because there is no page and no browser doing that job.
        </p>
        <p>
          An app developer integrates the AdTech vendor's SDK into the application, defines the
          available ad space, and selects both the ad medium (text, image, native, video) and the ad
          format (interstitial, banner).
        </p>
        <p>
          Social media advertising could technically sit under web or mobile-app advertising, but it
          behaves differently enough to count as its own channel. Most platforms serve ads as native
          units in and next to the news feed, so they read as organic content.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What social offers that display and video don't</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {SOCIAL_ADVANTAGES.map((advantage) => (
            <li key={advantage.title} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{advantage.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{advantage.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The same ad, requested two ways. Trace the mobile web path from the last lesson next to the
          in-app SDK path, then switch on an ad blocker and see which one it can actually reach.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Toggle a mobile ad blocker">
          <button
            type="button"
            onClick={() => setBlocked((b) => !b)}
            aria-pressed={blocked}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              blocked
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {blocked ? "Turn off ad blocker" : "Turn on ad blocker"}
          </button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">Mobile web</p>
            <ol className="mt-2 space-y-2">
              {MOBILE_WEB_STEPS.map((step, i) => {
                const isRenderStep = i === MOBILE_WEB_STEPS.length - 1;
                const stalled = blocked && isRenderStep;
                return (
                  <li key={step} className="flex gap-3 text-sm">
                    <span className="figure mt-0.5 text-muted-foreground">{i + 1}.</span>
                    <span className={stalled ? "text-muted-foreground line-through" : "text-muted-foreground"}>
                      {step}
                    </span>
                  </li>
                );
              })}
            </ol>
            {blocked && (
              <p className="measure mt-3 rounded-md border border-border-strong bg-secondary p-3 text-sm text-foreground">
                Blocked. The ad blocker intercepts the browser's iframe before it can render.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-xs uppercase text-muted-foreground">In-app, via SDK</p>
            <ol className="mt-2 space-y-2">
              {INAPP_STEPS.map((step, i) => (
                <li key={step} className="flex gap-3 text-sm">
                  <span className="figure mt-0.5 text-muted-foreground">{i + 1}.</span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
            <p className="measure mt-3 text-sm text-muted-foreground">
              {blocked
                ? "Unaffected. There is no browser iframe here for a blocker to intercept — the SDK renders inside the app's own code."
                : "Runs the same whether or not a blocker is installed on the device."}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-1">
        <ChannelDetail profile={MOBILE_PROFILE} />
        <ChannelDetail profile={SOCIAL_PROFILE} />
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      An engineer asks why the in-app ad needs an SDK when the website just drops in a tag, and a
      marketer asks why an email list works so well for retargeting on social but nowhere else. Both
      questions have the same root: mobile app and social are channels with their own delivery
      mechanics, not just smaller versions of the web.
    </p>
  ),
  objectives: [
    "Explain why in-app advertising needs an SDK while mobile web advertising does not",
    "List what an app developer configures when integrating an ad SDK",
    "Name at least three advantages social advertising offers over display or video",
  ],
  Body,
  takeaways: [
    "Mobile web ads load through the browser and an ad tag, same as any web ad; in-app ads need the AdTech vendor's SDK because there is no browser rendering them.",
    "Integrating that SDK means the app developer defines the available ad space and picks both an ad medium (text, image, native, video) and an ad format (interstitial, banner, and similar).",
    "Social platforms mostly serve ads as native units in the feed, which drives higher engagement and less exposure to ad blockers, on top of the retargeting and demographic data the platform already holds.",
  ],
  checkYourself: [
    {
      question: "Why doesn't an ad blocker installed on a phone stop ads from appearing inside an app?",
      answer: (
        <p>
          Because in-app ads render through the app's own SDK rather than a browser iframe. There is
          no browser-level container for an ad blocker to intercept.
        </p>
      ),
    },
    {
      question: "What three things does an app developer choose when integrating an ad SDK?",
      answer: (
        <p>
          The available ad space, the ad medium (text, image, native, video), and the ad format
          (interstitial, banner, and so on).
        </p>
      ),
    },
    {
      question: "A campaign under-delivers on mobile web but hits its numbers in-app, and ad blocking is suspected. Where do you look first, and why would in-app be unaffected?",
      answer: (
        <p>
          Check the mobile web tag and iframe load path first — that's exactly what an ad blocker
          targets. The in-app path is unaffected because it never goes through a browser container;
          the SDK renders the ad as part of the app itself.
        </p>
      ),
    },
  ],
};

export default lesson;
