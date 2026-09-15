import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

type Tier = "premium" | "remnant" | "long-tail";

const TIERS: Array<{ id: Tier; label: string; blurb: string }> = [
  {
    id: "premium",
    label: "Premium",
    blurb:
      "The publisher's most valuable space. Typically well-known sites and high-traffic pages such as a homepage, or highly visible placements like the top of a page.",
  },
  {
    id: "remnant",
    label: "Remnant",
    blurb:
      "Inventory the publisher was unable to sell directly to advertisers through direct deals and its other primary monetization channels. It is the leftover space, and the publisher is willing to sell it for less than the standard price.",
  },
  {
    id: "long-tail",
    label: "Long tail",
    blurb:
      "Space found on small sites and blogs. A large chunk of it is sold through Google AdSense, and long-tail publishers often go looking for better-paying alternatives — joining affiliate programs and networks, for example.",
  },
];

/** One row per ad slot on the open web, so the tier counts below are real counts. */
const SLOTS: Array<{ site: string; placement: string; tier: Tier }> = [
  { site: "National news site — homepage", placement: "Top of the page", tier: "premium" },
  { site: "National news site — homepage", placement: "Right rail, first position", tier: "premium" },
  { site: "National news site — sports front", placement: "Top of the page", tier: "premium" },
  { site: "National news site — homepage", placement: "Bottom of the page", tier: "remnant" },
  { site: "National news site — 2019 archive article", placement: "Mid-article", tier: "remnant" },
  { site: "National news site — 2019 archive article", placement: "Right rail, third position", tier: "remnant" },
  { site: "One-person recipe blog", placement: "Mid-article", tier: "long-tail" },
  { site: "One-person recipe blog", placement: "Sidebar", tier: "long-tail" },
];

const ZOOM_STOPS = [
  {
    id: "slot",
    label: "Zoom in on the slot",
    eyebrow: "The container",
    line: "The ad slot is the space on the page reserved for displaying ads. Nothing is in it yet.",
  },
  {
    id: "space",
    label: "Zoom in on the space",
    eyebrow: "The area inside it",
    line: "The ad space is the area inside the slot that actually displays the ad — the one impression available in this slot right now.",
  },
  {
    id: "site",
    label: "Zoom out to the supply",
    eyebrow: "The whole supply",
    line: "Inventory is every piece of ad space the publisher has to sell, across every page.",
  },
] as const;

type ZoomId = (typeof ZOOM_STOPS)[number]["id"];

function Body() {
  const [zoom, setZoom] = useState<ZoomId>("slot");
  const [tier, setTier] = useState<Tier | null>(null);

  const stop = ZOOM_STOPS.find((s) => s.id === zoom) ?? ZOOM_STOPS[0];
  const matching = tier ? SLOTS.filter((slot) => slot.tier === tier) : SLOTS;
  const activeTier = TIERS.find((t) => t.id === tier);

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          An <span className="text-foreground">ad slot</span> is the specific space on a website
          reserved for displaying ads. It is a fixed position in the page layout, and it is the
          publisher's decision: where the ads go, how many there are, and what size they are.
        </p>
        <p>
          Inside each slot sits an <span className="text-foreground">ad tag</span> — a small piece
          of code that communicates with the ad server to load and render the actual advertisement.
          The slot is empty until that conversation happens. Nothing about the page is hardcoded to
          a particular advertiser.
        </p>
        <p>
          An <span className="text-foreground">ad space</span> is the actual impression available in
          that slot. You will hear the two words used interchangeably all day long, and the
          distinction still matters: the slot is the container, the space is the area inside it that
          displays the ad.
        </p>
        <p>
          Picture a billboard by a road. The billboard itself — the frame bolted to the ground — is
          the ad slot. The white section inside the frame, where the poster goes, is the ad space.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Step the zoom out one stop at a time. Watch the same rectangle change name as you pull
          back: at the first stop it is a container, at the second it is the one impression inside
          that container, and at the third it is one item in a catalog the publisher is trying to
          sell.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a zoom level">
          {ZOOM_STOPS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setZoom(option.id)}
              aria-pressed={zoom === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                zoom === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">{stop.eyebrow}</p>
          <p className="measure mt-1 text-foreground">{stop.line}</p>

          {zoom !== "site" ? (
            <div className="mt-5">
              {/* A wireframe article page with one slot in the right rail. */}
              <div className="rounded-lg border border-border bg-secondary p-4">
                <div className="mb-4 h-3 w-32 rounded bg-muted-foreground/20" aria-hidden="true" />
                <div className="flex gap-4">
                  <div className="flex-1 space-y-2" aria-hidden="true">
                    <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
                    <div className="h-2.5 w-11/12 rounded bg-muted-foreground/20" />
                    <div className="h-2.5 w-4/5 rounded bg-muted-foreground/20" />
                    <div className="h-2.5 w-full rounded bg-muted-foreground/20" />
                    <div className="h-2.5 w-3/4 rounded bg-muted-foreground/20" />
                  </div>
                  <div className="w-40 shrink-0">
                    <div className="flex h-28 items-center justify-center rounded-lg border-2 border-dashed border-primary p-1.5">
                      {zoom === "space" ? (
                        <div className="flex h-full w-full flex-col items-center justify-center rounded bg-primary/10 text-center">
                          <span className="text-sm text-foreground">Ad space</span>
                          <span className="text-sm text-muted-foreground">the ad renders here</span>
                        </div>
                      ) : (
                        <span className="text-sm text-primary">Ad slot</span>
                      )}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {zoom === "space"
                        ? "The white part of the billboard."
                        : "The billboard frame."}
                    </p>
                  </div>
                </div>
              </div>

              <p className="measure mt-3 text-sm text-muted-foreground">
                {zoom === "space"
                  ? "One page view, one ad space, one impression. Load the page again and the slot is the same slot, but the space is a fresh impression that has to be filled all over again."
                  : "The ad tag inside this slot calls the ad server and asks it for something to render. Until the answer comes back, the slot holds nothing."}
              </p>
            </div>
          ) : (
            <div className="mt-5">
              <div
                className="flex flex-wrap gap-2"
                role="group"
                aria-label="Highlight one type of inventory"
              >
                {TIERS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTier(tier === option.id ? null : option.id)}
                    aria-pressed={tier === option.id}
                    className={cn(
                      "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                      tier === option.id
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <p className="measure mt-3 text-sm text-muted-foreground">
                Showing <span className="figure">{matching.length}</span> of{" "}
                <span className="figure">{SLOTS.length}</span> ad spaces.
                {activeTier ? ` ${activeTier.blurb}` : " Select a type to see only that part of the supply."}
              </p>

              <ul className="mt-3 space-y-2">
                {SLOTS.map((slot, index) => {
                  const dimmed = tier !== null && slot.tier !== tier;
                  return (
                    <li
                      key={`${slot.site}-${slot.placement}-${index}`}
                      className={cn(
                        "flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3 transition-colors",
                        dimmed
                          ? "border-border bg-card text-muted-foreground opacity-50"
                          : "border-border-strong bg-card"
                      )}
                    >
                      <span className={cn("text-sm", dimmed ? "" : "text-foreground")}>
                        {slot.site} — {slot.placement}
                      </span>
                      <span className="text-xs uppercase text-muted-foreground">{slot.tier}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Inventory: the whole supply</h3>
        <div className="measure space-y-4 text-muted-foreground">
          <p>
            <span className="text-foreground">Inventory</span>, also called ad inventory, is the
            name given to all the ad space available on a website. Inventory and ad space get used
            interchangeably too, but inventory usually describes the overall supply rather than one
            opening.
          </p>
          <p>
            If it helps: the slots are the parking spaces, and the inventory is the whole parking
            lot the publisher is renting out. There are three main types.
          </p>
        </div>

        <ul className="mt-4 space-y-3">
          {TIERS.map((t) => (
            <li key={t.id} className="rounded-lg border border-border bg-card p-4">
              <p className="text-foreground">{t.label} inventory</p>
              <p className="measure mt-1 text-sm text-muted-foreground">{t.blurb}</p>
            </li>
          ))}
        </ul>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          These three are not fixed grades stamped on a page. The same slot can be premium on
          Monday and remnant on Friday, because the label describes how the publisher managed to
          sell it, not what the page is made of.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A publisher tells you they have "a lot of inventory" and an advertiser complains their ad
      "did not fill the space." Those are two different objects on the same page, and mixing them
      up is how people end up debugging the wrong thing — a layout problem gets treated as a demand
      problem, or the other way around.
    </p>
  ),
  objectives: [
    "Point at a page and say which rectangle is the slot and which is the space",
    "Explain what the ad tag inside a slot is talking to, and why",
    "Sort a publisher's ad space into premium, remnant, and long tail, and say what put it there",
  ],
  Body,
  takeaways: [
    "The ad slot is the container reserved on the page; the ad space is the area inside it that displays the ad, which is the impression actually available.",
    "Inside every slot an ad tag communicates with the ad server to load and render the advertisement, so the slot is empty until that call returns.",
    "Inventory is a publisher's whole supply of ad space, split into premium, remnant, and long tail by how it can be sold rather than by how the page looks.",
  ],
  checkYourself: [
    {
      question: "A publisher adds a second slot to every article page. Has their inventory grown, and by how much?",
      answer: (
        <p>
          Yes — inventory is the total ad space available, so adding slots adds supply. But the
          amount depends on traffic, not layout: a new slot on a page nobody visits creates almost
          no ad space, because ad space is the impression available in the slot. A second slot on
          the homepage is worth far more than a second slot on a 2019 archive page.
        </p>
      ),
    },
    {
      question: "A publisher says the top-of-homepage placement is premium, and the identical unit at the bottom of the same page goes remnant. What actually differs?",
      answer: (
        <p>
          Visibility and demand, which together decide how it gets sold. Premium is the most
          valuable space — high-traffic pages, highly visible placements — and it sells directly.
          Remnant is what the publisher could not sell through direct deals and its other primary
          monetization channels, so it goes for less than the standard price.
        </p>
      ),
    },
    {
      question: "You are advising a food blogger with 20,000 monthly readers who is unhappy with what AdSense pays. What is going on, and what would you suggest?",
      answer: (
        <p>
          This is long-tail inventory: small sites and blogs, a large chunk of which is sold through
          Google AdSense. It is not that the blogger is doing anything wrong — there is simply not
          enough of any single audience for a direct deal. The usual move is to look for better
          monetization alternatives, such as joining affiliate programs and networks, where the
          payout is tied to conversions rather than to raw impression volume.
        </p>
      ),
    },
  ],
};

export default lesson;
