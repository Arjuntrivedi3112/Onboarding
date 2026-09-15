import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

type NativeFormat = "recommendation" | "infeed" | "branded";

interface FeedItem {
  id: string;
  headline: string;
  source: string;
  isAd: boolean;
  format?: NativeFormat;
}

const FORMAT_INFO: Record<NativeFormat, { label: string; destination: "off-site" | "on-site"; blurb: string }> = {
  recommendation: {
    label: "Content recommendation",
    destination: "off-site",
    blurb:
      "Perhaps the most subtle native format. Labeled something like \"From the web\" or \"Recommended for you,\" and easily mistaken for actual site content.",
  },
  infeed: {
    label: "In-feed / in-content",
    destination: "off-site",
    blurb:
      "A text, image, or video unit placed directly in a content feed, or embedded within an article — blending into the flow of the surrounding material.",
  },
  branded: {
    label: "Branded / native content",
    destination: "on-site",
    blurb:
      "Hosted directly on the publisher's own site, and developed collaboratively with its editorial team — the one format that does not send the click elsewhere.",
  },
};

const FEED: FeedItem[] = [
  { id: "1", headline: "City council approves new transit line", source: "Newsroom staff", isAd: false },
  {
    id: "2",
    headline: "Recommended for you: 7 carry-on bags that survive a year of travel",
    source: "From the web",
    isAd: true,
    format: "recommendation",
  },
  {
    id: "3",
    headline: "This budgeting app is changing how young professionals save",
    source: "Sponsored",
    isAd: true,
    format: "infeed",
  },
  { id: "4", headline: "Local team wins overtime thriller", source: "Sports desk", isAd: false },
  {
    id: "5",
    headline: "Inside the lab: how our running shoe cuts recovery time in half",
    source: "Presented by a footwear brand, with our editorial team",
    isAd: true,
    format: "branded",
  },
];

const NATIVE_PROFILE: ChannelProfile = {
  title: "Native advertising",
  description:
    "Ads built to match the design, format, and behavior of the content around them, found mostly on content-rich sites — news sites, blogs, social networks.",
  formats: [
    { label: "Content recommendation" },
    { label: "In-feed / in-content" },
    { label: "Branded / native content" },
    { label: "Promoted listings" },
  ],
  keyFeatures: [
    "Blends with editorial content by design",
    "Must still carry a clear, prominent paid-advertisement disclaimer",
    "Higher engagement than a standard banner",
    "Less vulnerable to ad-blocking tools",
  ],
  techDetails:
    "Native ads are assembled from components — headline, image, description — styled to match the publisher's own site, and are often served through an API rather than an iframe, which is part of why they read as content rather than as a box bolted onto the page.",
};

function Body() {
  const [revealed, setRevealed] = useState(false);

  const adCount = FEED.filter((item) => item.isAd).length;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Native ads are designed to blend seamlessly with surrounding content by matching the
          design, format, and behavior of the webpage, application, or platform they sit on. That is
          the entire point of the format — a more natural, less interruptive experience for whoever
          is reading.
        </p>
        <p>
          That is also exactly why one rule exists regardless of how well an ad blends in: a native
          ad must include a clear and prominent disclaimer indicating that it is a paid
          advertisement. Blending in is the format; disclosing it is what keeps the format honest.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Read the feed below the way a visitor would.{" "}
          <span className="figure">{adCount}</span> of the five items are paid. See if you can spot
          them, then reveal the disclosures and check where each one actually sends a click.
        </p>

        <ul className="space-y-2">
          {FEED.map((item) => {
            const info = item.format ? FORMAT_INFO[item.format] : null;
            return (
              <li key={item.id} className="rounded-lg border border-border bg-card p-4">
                <p className="measure text-foreground">{item.headline}</p>
                <p className="mt-1 text-sm text-muted-foreground">{item.source}</p>

                {revealed && item.isAd && info && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-border-strong bg-secondary p-3">
                    <span className="text-xs uppercase text-foreground">{info.label}</span>
                    <span className="text-sm text-muted-foreground">
                      {info.destination === "off-site"
                        ? "Click leaves this site →"
                        : "Click stays on this site"}
                    </span>
                  </div>
                )}
                {revealed && item.isAd && info && (
                  <p className="measure mt-2 text-sm text-muted-foreground">{info.blurb}</p>
                )}
                {revealed && !item.isAd && (
                  <p className="mt-2 text-sm text-muted-foreground">Editorial content — not an ad.</p>
                )}
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Toggle disclosure labels">
          <button
            type="button"
            onClick={() => setRevealed((r) => !r)}
            aria-pressed={revealed}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              revealed
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {revealed ? "Hide disclosures" : "Reveal disclosures"}
          </button>
        </div>
      </section>

      <ChannelDetail profile={NATIVE_PROFILE} />

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Two of the three formats — content recommendation and in-feed/in-content — usually send a
          click off the publisher's own site to wherever the advertiser's page lives. Branded, or
          native, content is the exception: it is hosted directly on the publisher's site, developed
          together with the publisher's editorial team, which is why it can afford to read as
          editorial in the first place.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A native placement performs unusually well and someone asks whether it needs a disclosure
      label at all, since "it barely looks like an ad." It always does — the disclaimer is not
      optional, and knowing which of the three native formats you are looking at tells you whether
      that click is about to leave the site or stay on it.
    </p>
  ),
  objectives: [
    "Define native advertising and state the one rule that applies to it regardless of format",
    "Tell apart content recommendation, in-feed/in-content, and branded/native content ads",
    "Say whether a click on each of the three formats leaves the publisher's site or stays on it",
  ],
  Body,
  takeaways: [
    "Native ads match the design, format, and behavior of the content around them, but must still carry a clear, prominent paid-advertisement disclaimer.",
    "Content recommendation ads and in-feed/in-content ads both send a click off the publisher's site; branded, or native, content is hosted on it and built with the publisher's editorial team.",
    "Because native ads are built to look like content, disclosure — not placement — is what keeps the format honest.",
  ],
  checkYourself: [
    {
      question: "A native ad is styled so well that a reader would never guess it's paid. Does it still need a disclaimer?",
      answer: (
        <p>
          Yes, always. The rule applies regardless of how convincingly the ad blends in — arguably
          more so, since the better it blends in, the more the disclaimer is doing the work of
          telling the reader what they are looking at.
        </p>
      ),
    },
    {
      question: "How do you tell branded/native content apart from the other two native formats without reading the label?",
      answer: (
        <p>
          Follow the click. Content recommendation and in-feed/in-content ads both send the reader
          off the publisher's site; branded content keeps them on it, because it is hosted there and
          produced with the publisher's own editorial team.
        </p>
      ),
    },
    {
      question: "Marketing wants a sponsored article on your own homepage, co-written with your editorial team and styled like a regular story. Which format is that, and does it still need disclosure?",
      answer: (
        <p>
          That is branded, or native, content — and yes, it still needs the same clear, prominent
          disclaimer as any other native ad. Being on-site and editorial in tone changes where the
          click goes; it does not remove the disclosure requirement.
        </p>
      ),
    },
  ],
};

export default lesson;
