import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { ChannelDetail, type ChannelProfile } from "./_shared";

interface DeviceEntry {
  id: string;
  label: string;
  ctv: boolean;
  reason: string;
}

const DEVICES: DeviceEntry[] = [
  {
    id: "smarttv",
    label: "Smart TV",
    ctv: true,
    reason: "Named explicitly by the IAB Tech Lab as connected TV (CTV) — an internet-connected device used to watch over-the-top (OTT) video.",
  },
  {
    id: "console",
    label: "Games console",
    ctv: true,
    reason: "Also named explicitly as CTV, alongside smart TVs and streaming devices.",
  },
  {
    id: "stick",
    label: "Streaming stick",
    ctv: true,
    reason: "The third device type the IAB Tech Lab names as CTV.",
  },
  {
    id: "settop",
    label: "Set-top box",
    ctv: false,
    reason:
      "Not itself defined as CTV. It appears only as one of the data sources — alongside Internet Protocol TV (IPTV) and connected TV/OTT devices — that make addressable TV possible.",
  },
  {
    id: "laptop",
    label: "Laptop",
    ctv: false,
    reason: "Explicitly excluded. The IAB Tech Lab does not count desktop computers or laptops as CTV, no matter what is streaming on them.",
  },
  {
    id: "phone",
    label: "Smartphone",
    ctv: false,
    reason: "Explicitly excluded, for the same reason as laptops — a phone is not counted as CTV.",
  },
  {
    id: "tablet",
    label: "Tablet",
    ctv: false,
    reason: "Explicitly excluded, for the same reason as laptops and phones.",
  },
];

type ChannelKey = "ctv" | "dooh" | "search";

const CTV_PROFILE: ChannelProfile = {
  title: "Connected TV (CTV)",
  description: "Internet-connected devices — smart TVs, gaming consoles, streaming devices — used to watch OTT video.",
  formats: [{ label: "Pre-roll" }, { label: "Mid-roll" }, { label: "Interactive overlays" }, { label: "Sponsored content" }],
  keyFeatures: [
    "TV-quality viewing experience",
    "Precise digital targeting, unlike linear broadcast",
    "Improved attribution versus traditional TV",
    "Supports addressable advertising",
  ],
  techDetails:
    "CTV advantages over traditional TV include precise targeting, improved attribution, and detailed measurement. Addressable TV goes further, showing different ads to different viewers during the exact same program, using data drawn from IPTV, connected TV/OTT devices and services, and set-top boxes.",
};

const DOOH_PROFILE: ChannelProfile = {
  title: "Digital out-of-home (DOOH)",
  description:
    "Digital screens — typically LED displays — in high-traffic public spaces: city streets, shopping malls, transit hubs.",
  formats: [
    { label: "Digital billboards" },
    { label: "Transit screens" },
    { label: "Mall kiosks" },
    { label: "Airport displays" },
  ],
  keyFeatures: [
    "Dynamic content — video, animation, interactive experiences",
    "Targeting by location, time of day, and weather",
    "Measurable, real-time performance data",
  ],
  techDetails:
    "Unlike a traditional static billboard, DOOH updates its own content, and supports the same location-, time-, and weather-based targeting a dynamic audio ad uses. Common examples: digital billboards in city centers, bus-shelter and train-station screens, interactive mall kiosks, and airport digital signage.",
};

const SEARCH_PROFILE: ChannelProfile = {
  title: "Search advertising",
  description: "Text ads placed alongside search engine results, triggered by keywords and the user's active intent.",
  formats: [{ label: "Text" }, { label: "Shopping" }, { label: "Local" }, { label: "App install" }, { label: "Call-only" }],
  keyFeatures: [
    "Targeting by keyword, location, device, and time of day",
    "Reaches people at the moment they are actively looking",
    "Supplied by search engines and by publishers as promoted listings",
  ],
  techDetails:
    "Search ads appear on search engine results pages (SERPs) at the exact moment someone is actively seeking information, a product, or a service. Supply comes from both search engines — Google, for instance — and from publishers, often in the form of promoted listings on e-commerce sites.",
};

const CHANNEL_PROFILES: Record<ChannelKey, ChannelProfile> = {
  ctv: CTV_PROFILE,
  dooh: DOOH_PROFILE,
  search: SEARCH_PROFILE,
};

function Body() {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [addressable, setAddressable] = useState(false);
  const [channel, setChannel] = useState<ChannelKey>("ctv");

  const device = DEVICES.find((d) => d.id === selectedDevice) ?? null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          In the AdTech ecosystem, TV splits into layered terms that are easy to blur together.{" "}
          <span className="text-foreground">Advanced TV</span> is the umbrella: any form of TV other
          than a traditional broadcast, cable, or satellite connection.{" "}
          <span className="text-foreground">Over-the-top (OTT)</span> refers to the devices or
          services that stream digital content to a connected TV — Netflix, Hulu, and Amazon Prime
          are examples.{" "}
          <span className="text-foreground">Connected TV (CTV)</span> is narrower still: the
          internet-connected devices used to watch that OTT video — smart TVs, gaming consoles,
          streaming devices — and the IAB Tech Lab (the Interactive Advertising Bureau's technical
          standards body) explicitly does not count desktop computers, laptops, smartphones, or
          tablets as CTV.
        </p>
        <p>
          <span className="text-foreground">Addressable TV</span> aims to show different ads to
          different viewers during the exact same program, using data collected through Internet
          Protocol TV (IPTV), connected TV/OTT devices and services, and set-top boxes. Together,
          these formats give advertisers precise targeting, improved attribution, and detailed
          measurement that traditional TV cannot match.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Pick a device and get the IAB Tech Lab's ruling on whether it counts as CTV, and why. Then
          switch on addressable mode to see two households watching the same program get two
          different ads.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a device to classify">
          {DEVICES.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => setSelectedDevice(d.id)}
              aria-pressed={selectedDevice === d.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selectedDevice === d.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>

        {device && (
          <div className="mt-4 rounded-lg border border-border bg-card p-5">
            <p className="text-xs uppercase text-muted-foreground">Is this CTV?</p>
            <p className="measure mt-1 text-foreground">{device.ctv ? "Yes." : "No."}</p>
            <p className="measure mt-2 text-sm text-muted-foreground">{device.reason}</p>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Toggle addressable TV mode">
          <button
            type="button"
            onClick={() => setAddressable((a) => !a)}
            aria-pressed={addressable}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              addressable
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {addressable ? "Turn off addressable mode" : "Turn on addressable mode"}
          </button>
        </div>

        {addressable && (
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Household A — same program</p>
              <p className="measure mt-1 text-foreground">Sees a local car dealership spot.</p>
              <p className="mt-2 text-sm text-muted-foreground">Signal: set-top box data suggests a recent auto search.</p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">Household B — same program</p>
              <p className="measure mt-1 text-foreground">Sees a streaming-service promotion.</p>
              <p className="mt-2 text-sm text-muted-foreground">Signal: connected TV/OTT usage suggests high streaming engagement already.</p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Reference: the three profiles</h3>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a channel to inspect">
          {(Object.keys(CHANNEL_PROFILES) as ChannelKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setChannel(key)}
              aria-pressed={channel === key}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                channel === key
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {CHANNEL_PROFILES[key].title}
            </button>
          ))}
        </div>
        <div className="mt-4">
          <ChannelDetail profile={CHANNEL_PROFILES[channel]} />
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A media plan lists "CTV" inventory that turns out to include a laptop stream, or "Advanced TV"
      and "CTV" get used as if they mean the same thing. Both mistakes change what you are actually
      buying, and the IAB Tech Lab's own exclusions are the fastest way to catch either one before
      the budget is committed.
    </p>
  ),
  objectives: [
    "Define Advanced TV, OTT, CTV, and addressable TV, and name which devices the IAB Tech Lab excludes from CTV",
    "Explain what makes digital out-of-home (DOOH) different from a static billboard",
    "Explain how search advertising targets, and where its supply comes from",
  ],
  Body,
  takeaways: [
    "Advanced TV is the umbrella term for anything beyond traditional broadcast, cable, or satellite; CTV is the specific slice the IAB Tech Lab defines — smart TVs, gaming consoles, and streaming devices — explicitly excluding desktops, laptops, phones, and tablets.",
    "Addressable TV shows different ads to different households watching the exact same program, drawing on data from IPTV, connected TV/OTT devices and services, and set-top boxes.",
    "DOOH updates its own creative by location, time of day, and even weather, while search reaches someone at the moment they are actively looking, with supply coming from both search engines and publishers' own promoted listings.",
  ],
  checkYourself: [
    {
      question: "Someone streams a show in a browser on their laptop. Does that count as CTV?",
      answer: (
        <p>
          No. The IAB Tech Lab explicitly excludes desktop computers and laptops from CTV, regardless
          of what is being streamed on them.
        </p>
      ),
    },
    {
      question: "What data sources feed addressable TV's targeting?",
      answer: (
        <p>
          IPTV, connected TV/OTT devices and services, and set-top boxes — the same three sources the
          book names together.
        </p>
      ),
    },
    {
      question: "A vendor's media plan lists \"CTV\" inventory that turns out to include mobile in-app video views. What's wrong, and what should you ask for?",
      answer: (
        <p>
          Mobile is not CTV under the IAB Tech Lab's definition — phones and tablets are explicitly
          excluded. Ask the vendor for a device-level breakdown so only smart TVs, consoles, and
          streaming devices are counted against the CTV line.
        </p>
      ),
    },
  ],
};

export default lesson;
