/**
 * Pure data and rules for the channel-explorer simulator (unit-tested).
 *
 * Channel facts follow the channels lessons: display (ad tag in an iframe),
 * video (VAST / VMAP / SIMID), CTV (IAB Tech Lab definition, addressable TV),
 * audio (reuses VAST, dynamic ads), DOOH (location / time / weather), mobile
 * in-app (SDK, IDFA / GAID, postback attribution), native (components,
 * disclosure) and search (keyword intent on the SERP).
 */

export type ChannelId = "display" | "video" | "ctv" | "audio" | "dooh" | "mobile" | "native" | "search";

export interface ChannelInfo {
  id: ChannelId;
  label: string;
  /** The standard or mechanism that governs how the ad is delivered. */
  standard: string;
  standardDetail: string;
  targeting: string;
  measurement: string;
  formats: string[];
  /** Length of the playable ad in seconds, for channels with a player. */
  adSeconds?: number;
}

export const CHANNELS: ChannelInfo[] = [
  {
    id: "display",
    label: "Display",
    standard: "Ad tag (HTML / JavaScript)",
    standardDetail: "The tag calls an ad server or exchange, waits out the RTB auction, then renders the creative in an isolated iframe.",
    targeting: "The page's context plus cookie or user-ID data available to the RTB auction.",
    measurement: "Impressions, clicks and CTR; viewable once 50% of the ad is on screen for 1 second.",
    formats: ["Banner 728×90", "Banner 300×250", "Skyscraper", "Interstitial"],
  },
  {
    id: "video",
    label: "Video",
    standard: "VAST · VMAP · SIMID",
    standardDetail: "VAST delivers the ad into the video player, VMAP places the breaks, SIMID adds interactivity (replacing VPAID).",
    targeting: "Like display, plus the content of the video the ad runs in.",
    measurement: "VAST quartile events — start, 25%, 50%, 75%, complete; viewable at 50% on screen for 2 seconds.",
    formats: ["Pre-roll", "Mid-roll", "Post-roll", "Outstream", "Rewarded"],
    adSeconds: 15,
  },
  {
    id: "ctv",
    label: "CTV",
    standard: "VAST into the TV app's player",
    standardDetail: "Smart TVs, gaming consoles and streaming devices — the IAB Tech Lab excludes desktops, laptops, phones and tablets.",
    targeting: "Household level. Addressable TV shows different ads to different homes watching the same programme.",
    measurement: "Quartile and completion events, with better attribution than traditional TV.",
    formats: ["Pre-roll", "Mid-roll", "Interactive overlay", "Sponsored content"],
    adSeconds: 30,
  },
  {
    id: "audio",
    label: "Audio",
    standard: "VAST (latest version)",
    standardDetail: "Audio reuses VAST because audio and video files are similar enough to share one delivery protocol.",
    targeting: "Dynamic ads rewrite the script by listener location, time of day and weather.",
    measurement: "Player-fired quartile and completion events, plus companion-banner impressions and clicks.",
    formats: ["Pre-roll audio", "Mid-roll audio", "Ad pods", "Dynamic ads", "Companion banner"],
    adSeconds: 30,
  },
  {
    id: "dooh",
    label: "DOOH",
    standard: "Screen's own media player",
    standardDetail: "No browser and no cookies — a scheduled player on an LED screen in a public space swaps the content itself.",
    targeting: "Location, time of day and weather — not the individual walking past.",
    measurement: "Plays per screen and real-time performance data rather than per-person clicks.",
    formats: ["Digital billboard", "Transit screen", "Mall kiosk", "Airport display"],
  },
  {
    id: "mobile",
    label: "Mobile in-app",
    standard: "Vendor SDK in the app",
    standardDetail: "There is no page and no ad tag: the app developer integrates the AdTech vendor's SDK, which renders the ad.",
    targeting: "Device IDs — IDFA on iOS, GAID on Android.",
    measurement: "Installs attributed through a postback URL.",
    formats: ["Banner", "Interstitial", "Rewarded video", "Native", "Playable"],
  },
  {
    id: "native",
    label: "Native",
    standard: "OpenRTB Native (components)",
    standardDetail: "The ad arrives as parts — headline, image, description — often over an API, and the site styles them to match its own content.",
    targeting: "The surrounding content and the reader's audience segments.",
    measurement: "Engagement such as clicks and reads; it must carry a clear paid-advertisement disclosure.",
    formats: ["In-feed", "Content recommendation", "Branded content", "Promoted listing"],
  },
  {
    id: "search",
    label: "Search",
    standard: "Search engine keyword auction",
    standardDetail: "Text ads on the results page (SERP), triggered when a query matches the advertiser's keywords.",
    targeting: "Keyword intent, plus location, device and time of day.",
    measurement: "Clicks and conversions from people who were actively looking.",
    formats: ["Text", "Shopping", "Local", "App install", "Call-only"],
  },
];

export function channelById(id: ChannelId): ChannelInfo {
  return CHANNELS.find((c) => c.id === id) ?? CHANNELS[0];
}

/* -------------------------------------------------------------------------- */
/* VAST quartiles                                                              */
/* -------------------------------------------------------------------------- */

export const QUARTILES = [
  { event: "start", label: "start", at: 0 },
  { event: "firstQuartile", label: "25%", at: 0.25 },
  { event: "midpoint", label: "50%", at: 0.5 },
  { event: "thirdQuartile", label: "75%", at: 0.75 },
  { event: "complete", label: "100%", at: 1 },
] as const;

export type QuartileEvent = (typeof QUARTILES)[number]["event"];

/** Which VAST tracking events have fired once playback reaches `progress` (0–1). Nothing fires before play. */
export function firedQuartiles(progress: number, started: boolean): QuartileEvent[] {
  if (!started) return [];
  return QUARTILES.filter((q) => progress >= q.at).map((q) => q.event);
}

/* -------------------------------------------------------------------------- */
/* The media-planner challenge                                                 */
/* -------------------------------------------------------------------------- */

export interface Brief {
  id: string;
  client: string;
  brief: string;
  answer: ChannelId;
  why: string;
}

export const BRIEFS: Brief[] = [
  {
    id: "coffee",
    client: "Coffee chain",
    brief: "Reach commuters at train stations each morning with a breakfast offer that switches to a hot-drink message when it rains.",
    answer: "dooh",
    why: "Public screens on the go, targeted by location, time of day and weather — that's DOOH.",
  },
  {
    id: "car",
    client: "Car brand",
    brief: "Run a 30-second spot on the living-room big screen, shown only to households in the market for a new car.",
    answer: "ctv",
    why: "The big screen at home, bought by household — addressable connected TV.",
  },
  {
    id: "mealkit",
    client: "Meal-kit service",
    brief: "Talk to podcast listeners during their commute, phones in pockets and screens off, with a message that changes by city.",
    answer: "audio",
    why: "Sound on, screen off: a dynamic audio ad served with VAST.",
  },
];

export type BriefAnswers = Record<string, ChannelId | "">;

export function briefIsCorrect(brief: Brief, answer: ChannelId | "" | undefined): boolean {
  return answer === brief.answer;
}

/** The challenge: every brief matched to its best channel. */
export function allBriefsMatched(answers: BriefAnswers): boolean {
  return BRIEFS.every((b) => briefIsCorrect(b, answers[b.id]));
}

export function correctCount(answers: BriefAnswers): number {
  return BRIEFS.filter((b) => briefIsCorrect(b, answers[b.id])).length;
}
