import type { SimulationDefinition } from "@/simulations/types";

/**
 * The Simulation Lab: one hands-on simulator per curriculum section.
 *
 * Each simulator is code-split (load()) so the Lab gallery stays light. Copy
 * here describes the simulator, never the book's content — lessons stay the
 * single source of what is true about AdTech.
 */
export const SIMULATIONS: SimulationDefinition[] = [
  {
    id: "life-of-an-impression",
    sectionId: "basics",
    title: "Life of an impression",
    tagline: "Load a page, serve an ad, and watch a funnel turn into money.",
    minutes: 6,
    difficulty: "Beginner",
    relatedLessonIds: [
      "basics-ad-slots-space-and-inventory",
      "basics-impressions-and-viewability",
      "basics-click-to-conversion",
      "basics-pricing-models",
    ],
    whatYoullSee: [
      "Page loads filling ad slots and counting impressions",
      "Which impressions were actually viewable",
      "Clicks and conversions trickling out of the funnel",
      "What the same campaign costs under CPM, CPC and CPA",
    ],
    tryThis: [
      "Load the page a few times and watch impressions climb",
      "Move the slot below the fold and see viewability drop",
      "Raise the click-through rate and compare CPM vs CPC cost",
      "Find the pricing model that costs the advertiser least",
    ],
    challenge: {
      title: "Pick the cheapest deal",
      description: "With the scenario's rates, choose the pricing model that costs the advertiser the least for this campaign.",
      hint: "Work out the total under each model: impressions ÷ 1000 × CPM, clicks × CPC, conversions × CPA.",
    },
    load: () => import("@/simulations/life-of-an-impression/Simulation"),
  },
  {
    id: "ecosystem-flow",
    sectionId: "technology",
    title: "The AdTech stack in motion",
    tagline: "Follow money and data from advertiser to publisher, and see where the walls go up.",
    minutes: 6,
    difficulty: "Beginner",
    relatedLessonIds: [
      "technology-why-there-is-a-stack",
      "technology-the-buy-side",
      "technology-the-sell-side-and-the-auction",
      "technology-who-runs-the-stack",
    ],
    whatYoullSee: [
      "Each platform in the chain lighting up as a request passes through",
      "What every platform adds — and what it takes",
      "How a walled garden collapses the chain into one company",
    ],
    tryThis: [
      "Play the flow and pause on each platform to read its job",
      "Switch to walled garden and compare who is left",
      "Turn on fees and see how much of a dollar reaches the publisher",
    ],
    challenge: {
      title: "Trace the dollar",
      description: "Run the open-web flow with fees on, then identify which platform sits between the DSP and the SSP.",
      hint: "It runs the auction.",
    },
    load: () => import("@/simulations/ecosystem-flow/Simulation"),
  },
  {
    id: "channel-explorer",
    sectionId: "channels",
    title: "Channel and format studio",
    tagline: "Preview the same campaign across display, video, CTV, audio, DOOH, mobile and native.",
    minutes: 5,
    difficulty: "Beginner",
    relatedLessonIds: [
      "channels-mediums-vs-channels-and-the-web",
      "channels-video-ads-and-standards",
      "channels-mobile-and-social",
      "channels-native-ads",
      "channels-advanced-tv-dooh-and-search",
      "channels-rich-media-and-audio",
    ],
    whatYoullSee: [
      "A live mock-up of the ad in each channel",
      "The standard that governs each format (VAST, OpenRTB native, and so on)",
      "How targeting and measurement change channel to channel",
    ],
    tryThis: [
      "Flip through every channel and watch the mock-up change",
      "Play the video ad and watch its quartile events fire",
      "Match a campaign goal to the channel that suits it best",
    ],
    challenge: {
      title: "Media planner",
      description: "Match all three campaign briefs to the channel that fits each one best.",
      hint: "Think about where the audience is and how the ad is consumed: sound on, big screen, on the go.",
    },
    load: () => import("@/simulations/channel-explorer/Simulation"),
  },
  {
    id: "ad-serving-flow",
    sectionId: "adserving",
    title: "Serve an ad, step by step",
    tagline: "Watch an ad server decide, fetch, render and count — with a millisecond clock.",
    minutes: 5,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "adserving-what-an-ad-server-is",
      "adserving-four-stages-of-a-served-ad",
      "adserving-anatomy-of-an-ad-server",
      "adserving-ad-tags-and-ad-markup",
      "adserving-when-the-auction-joins-in",
    ],
    whatYoullSee: [
      "The ad tag firing and the request reaching the ad server",
      "The decision engine choosing between direct campaigns and programmatic",
      "The creative rendering and the impression being counted",
    ],
    tryThis: [
      "Auto-play the full sequence and watch the clock",
      "Step through manually and read what each component does",
      "Turn on the programmatic auction and see where it joins in",
    ],
    challenge: {
      title: "Under 200 ms",
      description: "Configure the serve so the whole sequence completes in under 200 ms.",
      hint: "Some options add a round trip. Which ones can you avoid for this placement?",
    },
    load: () => import("@/simulations/ad-serving-flow/Simulation"),
  },
  {
    id: "audience-narrowing",
    sectionId: "targeting",
    title: "Watch the audience narrow",
    tagline: "Stack targeting rules on a crowd of users, then pace a budget across the day.",
    minutes: 6,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "targeting-why-targeting-exists",
      "targeting-contextual-and-the-page",
      "targeting-behavioral-audiences",
      "targeting-geo-device-and-timing",
      "targeting-retargeting-and-demographics",
      "targeting-budget-control",
    ],
    whatYoullSee: [
      "A crowd of users shrinking as each targeting rule applies",
      "The trade-off between reach and precision",
      "A daily budget spending evenly or burning out by lunch",
    ],
    tryThis: [
      "Add geo, device and interest filters one at a time",
      "Over-target until reach collapses, then loosen one rule",
      "Switch pacing from ASAP to even and compare the spend curve",
    ],
    challenge: {
      title: "Reach the right 10–25%",
      description: "Combine filters so the audience lands between 10% and 25% of the crowd, with even pacing on.",
      hint: "Two or three filters usually get you there. Too many collapses reach.",
    },
    load: () => import("@/simulations/audience-narrowing/Simulation"),
  },
  {
    id: "metrics-lab",
    sectionId: "tracking",
    title: "Metrics and reconciliation lab",
    tagline: "Turn raw counts into eCPM, eCPC and eCPA — then reconcile two reports that disagree.",
    minutes: 6,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "tracking-impressions-and-clicks",
      "tracking-metrics-and-effective-metrics",
      "tracking-discrepancies-and-reconciliation",
      "tracking-client-side-vs-server-side-and-counting-methods",
    ],
    whatYoullSee: [
      "Effective metrics recalculating live as you change spend and counts",
      "Two systems counting the same campaign differently",
      "Whether a discrepancy is inside the industry's tolerance",
    ],
    tryThis: [
      "Change spend and impressions and watch eCPM move",
      "Make the publisher and advertiser counts drift apart",
      "Switch counting methods and see the gap explained",
    ],
    challenge: {
      title: "Within tolerance",
      description: "Adjust the scenario until the discrepancy between the two reports is within 10%, and eCPM is between $2 and $5.",
      hint: "Server-side counting and filtering bots both narrow the gap.",
    },
    load: () => import("@/simulations/metrics-lab/Simulation"),
  },
  {
    id: "rtb-auction",
    sectionId: "mediabuying",
    title: "The 100-millisecond auction",
    tagline: "Run a real-time bidding auction: set the floor, pick the auction type, watch who wins.",
    minutes: 7,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "mediabuying-programmatic-basics",
      "mediabuying-rtb-auction-in-100ms",
      "mediabuying-inside-a-bid-request",
      "mediabuying-auction-dynamics-and-floors",
      "mediabuying-header-bidding",
    ],
    whatYoullSee: [
      "A bid request fanning out to three DSPs and the bids coming back",
      "The exchange choosing a winner against a floor price",
      "How first-price and second-price auctions change what the winner pays",
    ],
    tryThis: [
      "Play the auction and watch the clock count to 100 ms",
      "Raise the floor until a DSP drops out",
      "Switch between first- and second-price and compare the clearing price",
      "Change one DSP's bid and see who wins now",
    ],
    challenge: {
      title: "Win it for Beta",
      description: "Make DSP Beta win the auction while paying less than $3.50.",
      hint: "Beta has to outbid the others, but in a second-price auction it pays just above the runner-up.",
    },
    load: () => import("@/simulations/rtb-auction/Simulation"),
  },
  {
    id: "identity-graph",
    sectionId: "identity",
    title: "Build an identity graph",
    tagline: "Link one person's devices with deterministic and probabilistic signals — and see what consent changes.",
    minutes: 6,
    difficulty: "Advanced",
    relatedLessonIds: [
      "identity-cookies-and-the-stateless-web",
      "identity-cross-device-resolution",
      "identity-life-after-third-party-cookies",
      "identity-privacy-rules-and-consent",
      "identity-privacy-preserving-tech",
    ],
    whatYoullSee: [
      "Devices and identifiers appearing as nodes",
      "Links forming from logins (certain) and shared signals (probable)",
      "Match confidence rising and falling as signals change",
      "What disappears when third-party cookies or consent go away",
    ],
    tryThis: [
      "Add a login and watch a deterministic link snap into place",
      "Add IP and location signals for probabilistic links",
      "Turn off third-party cookies and see which links break",
    ],
    challenge: {
      title: "One person, three devices",
      description: "Link the phone, laptop and TV into one profile with at least 80% confidence while third-party cookies are off.",
      hint: "Deterministic signals don't depend on third-party cookies.",
    },
    load: () => import("@/simulations/identity-graph/Simulation"),
  },
  {
    id: "dmp-pipeline",
    sectionId: "data",
    title: "Inside the data pipeline",
    tagline: "Collect raw events, normalise them into profiles, build segments and activate them.",
    minutes: 6,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "data-three-types-of-data",
      "data-where-data-comes-from",
      "data-how-a-dmp-collects-data",
      "data-normalization-and-profiles",
      "data-taxonomies-and-segments",
      "data-activating-segments",
    ],
    whatYoullSee: [
      "First-, second- and third-party events flowing into the platform",
      "Messy raw events normalised into clean profiles",
      "Segments filling up and being pushed to buying platforms",
    ],
    tryThis: [
      "Stream events and watch the profile store fill",
      "Turn data sources on and off and see segment sizes change",
      "Build a segment and activate it to a DSP",
    ],
    challenge: {
      title: "Build a usable segment",
      description: "Create a segment of at least 500 profiles using first-party data only, and activate it.",
      hint: "Turn off second- and third-party sources, then pick broad enough rules.",
    },
    load: () => import("@/simulations/dmp-pipeline/Simulation"),
  },
  {
    id: "attribution-lab",
    sectionId: "attribution",
    title: "Attribution model lab",
    tagline: "Build a customer journey and watch seven models hand out the credit differently.",
    minutes: 7,
    difficulty: "Advanced",
    relatedLessonIds: [
      "attribution-what-attribution-is",
      "attribution-how-online-attribution-works",
      "attribution-single-touch-models",
      "attribution-multi-touch-models",
      "attribution-cross-device",
    ],
    whatYoullSee: [
      "A journey of touchpoints leading to a conversion",
      "Credit bars redistributing as you switch models",
      "How the choice of model changes which channel looks best",
    ],
    tryThis: [
      "Build a four-step journey across different channels",
      "Compare first-touch and last-touch",
      "Try time decay and watch recent touches gain credit",
      "Use custom weights to build your own model",
    ],
    challenge: {
      title: "Make display matter",
      description: "Find a journey and model where Display earns at least 40% of the credit, without Display being the only touchpoint.",
      hint: "Position-based and first-touch models favour where a journey starts.",
    },
    load: () => import("@/simulations/attribution-lab/Simulation"),
  },
  {
    id: "build-rent-buy",
    sectionId: "buildbuy",
    title: "Build, rent or buy",
    tagline: "Answer the questions a real company faces and see which path the trade-offs point to.",
    minutes: 5,
    difficulty: "Intermediate",
    relatedLessonIds: [
      "buildbuy-the-adtech-dilemma",
      "buildbuy-building-your-own-platform",
      "buildbuy-renting-a-saas-platform",
      "buildbuy-buying-an-existing-platform",
      "buildbuy-side-by-side-tradeoffs",
      "buildbuy-choosing-your-path",
    ],
    whatYoullSee: [
      "Cost, time-to-market, control and risk meters for each path",
      "A recommendation that updates as your answers change",
      "Five-year cost curves for build, rent and buy",
    ],
    tryThis: [
      "Answer as a small startup, then as a large enterprise",
      "Max out the need for control and see what changes",
      "Compare five-year cost lines",
    ],
    challenge: {
      title: "Three companies, three answers",
      description: "Find answer sets that make each of Build, Rent and Buy the top recommendation at least once.",
      hint: "Budget and time-to-market pull hardest toward renting; control and scale toward building.",
    },
    load: () => import("@/simulations/build-rent-buy/Simulation"),
  },
  {
    id: "ai-optimizer",
    sectionId: "ai",
    title: "AI bidding and budget optimizer",
    tagline: "Let a model price bids and shift budget across channels — and watch it beat fixed rules.",
    minutes: 6,
    difficulty: "Advanced",
    relatedLessonIds: [
      "ai-why-ai-runs-modern-advertising",
      "ai-bidding-and-budget-optimization",
      "ai-fraud-detection-and-traffic-validation",
      "ai-across-every-channel",
    ],
    whatYoullSee: [
      "Bids priced per impression from predicted conversion probability",
      "Budget flowing to the channels that perform",
      "Fixed-rule bidding vs model bidding, side by side",
    ],
    tryThis: [
      "Run a day of auctions with a flat bid",
      "Switch to model bidding and compare cost per conversion",
      "Turn on budget reallocation and watch spend move",
    ],
    challenge: {
      title: "Beat the rules",
      description: "Get model bidding to a cost per conversion at least 25% lower than flat bidding.",
      hint: "Reallocation plus a sensible target CPA usually gets there.",
    },
    load: () => import("@/simulations/ai-optimizer/Simulation"),
  },
];

export function simulationById(id: string | undefined): SimulationDefinition | undefined {
  return SIMULATIONS.find((s) => s.id === id);
}

export function simulationForSection(sectionId: string): SimulationDefinition | undefined {
  return SIMULATIONS.find((s) => s.sectionId === sectionId);
}

export function simulationForLesson(lessonId: string): SimulationDefinition | undefined {
  return SIMULATIONS.find((s) => s.relatedLessonIds.includes(lessonId));
}
