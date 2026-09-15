/**
 * The supply chain: the nine actors an impression passes between, at fixed
 * positions that never move between lessons.
 *
 * This is the backbone of the chain rail — the one persistent element in every
 * lesson. Because the order and x-positions are constant, the rail doubles as
 * a breadcrumb: the learner always knows which link of the chain they are in.
 */

export const CHAIN_ACTORS = [
  { id: "advertiser", label: "Advertiser", token: "--chain-advertiser" },
  { id: "agency", label: "Agency", token: "--chain-agency" },
  { id: "dsp", label: "DSP", token: "--chain-dsp" },
  { id: "dmp", label: "DMP", token: "--chain-dmp" },
  { id: "exchange", label: "Exchange", token: "--chain-exchange" },
  { id: "ssp", label: "SSP", token: "--chain-ssp" },
  { id: "adserver", label: "Ad server", token: "--chain-adserver" },
  { id: "publisher", label: "Publisher", token: "--chain-publisher" },
  { id: "user", label: "User", token: "--chain-user" },
] as const;

export type ChainActorId = (typeof CHAIN_ACTORS)[number]["id"];

/**
 * Which links of the chain each section is about. The rail dims everything
 * else, so the learner can see at a glance where the current material sits.
 *
 * An empty array means "the whole chain" — used by sections that are about
 * the system as a whole rather than one link.
 */
export const SECTION_CHAIN_FOCUS: Record<string, ChainActorId[]> = {
  // The vocabulary applies everywhere, so nothing is dimmed.
  basics: [],
  // The platforms themselves.
  technology: ["dsp", "dmp", "exchange", "ssp", "adserver"],
  // Where the ad surfaces: the publisher's page and the person looking at it.
  channels: ["publisher", "user"],
  // The ad server's job, and delivery to the page.
  adserving: ["adserver", "publisher", "user"],
  // Deciding who to reach happens on the buy side, fed by audience data.
  targeting: ["advertiser", "agency", "dsp", "dmp"],
  // Counting what happened spans the serving end of the chain.
  tracking: ["adserver", "publisher", "user"],
  // The auction: demand meets supply.
  mediabuying: ["dsp", "exchange", "ssp"],
  // Recognising the person.
  identity: ["dmp", "user"],
  // Collecting and segmenting behaviour.
  data: ["dmp", "dsp"],
  // Assigning credit, from the advertiser's point of view, back to the person.
  attribution: ["advertiser", "dsp", "user"],
  // A strategy decision made by the advertiser or agency about the stack.
  buildbuy: ["advertiser", "agency", "dsp"],
  // Cross-cutting.
  ai: [],
};

export function chainFocusFor(sectionId: string): ChainActorId[] {
  return SECTION_CHAIN_FOCUS[sectionId] ?? [];
}
