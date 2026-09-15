import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { PLATFORMS, StackNode, ChainArrow } from "./_shared";

/**
 * One impression, end to end. The millisecond split is illustrative — the book
 * gives the total (about 100 ms), not the breakdown — so the label says so and
 * every number on screen is summed from this array, never typed twice.
 */
const STAGES = [
  {
    id: "visit",
    node: "Page",
    title: "User visit",
    ms: 10,
    detail:
      "Someone opens a page or an app. An ad slot is empty, so the publisher's supply-side platform asks the exchange for a bid on that one impression.",
  },
  {
    id: "request",
    node: "SSP",
    title: "Bid request",
    ms: 15,
    detail:
      "The exchange broadcasts the impression to every connected demand-side platform, along with contextual and user-related information about it.",
  },
  {
    id: "evaluate",
    node: "Exchange",
    title: "Bid evaluation",
    ms: 30,
    detail:
      "Each demand-side platform checks that information against its campaigns and decides whether to bid, how much to bid, and which creative it would serve.",
  },
  {
    id: "auction",
    node: "DSPs",
    title: "Auction",
    ms: 20,
    detail:
      "The exchange collects the bids and selects the highest one. The corresponding ad is chosen for delivery.",
  },
  {
    id: "win",
    node: "Winner",
    title: "Win notice",
    ms: 10,
    detail:
      "The winning buyer is told it won. Everyone else hears nothing and moves on to the next impression.",
  },
  {
    id: "serve",
    node: "Ad server",
    title: "Ad served",
    ms: 15,
    detail:
      "The publisher's ad server delivers the winning ad to the device, and the slot that was empty a moment ago has an ad in it.",
  },
] as const;

const TOTAL_MS = STAGES.reduce((sum, s) => sum + s.ms, 0);

function Body() {
  const [reached, setReached] = useState(0);
  const elapsed = STAGES.slice(0, reached).reduce((sum, s) => sum + s.ms, 0);
  const done = reached >= STAGES.length;
  const current = reached > 0 ? STAGES[reached - 1] : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Nobody sat down and designed this stack. It accumulated, one platform at a time, because
          every step between an advertiser and a page turned out to need software of its own — and
          because the whole negotiation now has to finish while a page is still loading.
        </p>
        <p>
          A <span className="text-foreground">demand-side platform (DSP)</span> — the tool an
          advertiser buys ads through — receives a bid request, decides whether to bid, how much,
          and which creative to serve. That cycle is called{" "}
          <span className="text-foreground">real-time bidding (RTB)</span>, the live auction held
          for a single ad slot, and it runs every time a user visits or refreshes a page. The book
          puts the whole cycle at about <span className="figure">100</span> milliseconds.
        </p>
        <p>
          This section walks the platforms that power programmatic advertising one at a time. Before
          any of them makes sense on its own, it helps to see the trip they collectively make.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">The map</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Six platforms, each with its own lesson ahead. For now, only their job titles matter.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((p) => (
            <li key={p.id} className="rounded-lg border border-border bg-card p-3">
              <span className="block text-foreground">{p.fullName}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{p.description}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Press advance to move one impression along the chain. Watch the clock: the whole trip has
          to land inside roughly <span className="figure">100</span> milliseconds, which is why no
          human is in the loop anywhere along it.
        </p>

        <div className="overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 pb-2">
            {STAGES.map((stage, i) => (
              <div key={stage.id} className="flex items-center">
                {i > 0 && <ChainArrow />}
                <StackNode label={stage.node} active={i < reached} dimmed={i >= reached} />
              </div>
            ))}
          </div>
        </div>

        <div
          className="mt-4 flex flex-wrap gap-2"
          role="group"
          aria-label="Move the impression along the chain"
        >
          <button
            type="button"
            onClick={() => setReached((r) => Math.min(r + 1, STAGES.length))}
            disabled={done}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              done
                ? "border-border text-muted-foreground opacity-50"
                : "border-primary bg-primary/10 text-foreground"
            )}
          >
            Advance the impression
          </button>
          <button
            type="button"
            onClick={() => setReached(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart the impression
          </button>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Elapsed</p>
          <p className="mt-1 text-foreground">
            <span className="figure text-2xl">{elapsed}</span>
            <span className="text-muted-foreground"> of </span>
            <span className="figure">{TOTAL_MS}</span>
            <span className="text-muted-foreground"> ms</span>
          </p>

          <p className="mt-4 text-xs uppercase text-muted-foreground">
            {current ? current.title : "Not started"}
          </p>
          <p className="measure mt-1 text-muted-foreground">
            {current
              ? current.detail
              : "The slot is empty and the page is still loading. Advance to send the request."}
          </p>

          {done && (
            <p className="measure mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
              Six handoffs between at least four separate companies, and the person who opened the
              page saw none of it. Every lesson that follows takes one node out of this chain and
              asks what it is actually doing in its share of those milliseconds.
            </p>
          )}
        </div>
        <p className="measure mt-3 text-sm text-muted-foreground">
          The per-stage split above is illustrative — it is there to show where the time goes, not
          to quote a benchmark. The figure worth remembering is the total.
        </p>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Two things are worth noticing before moving on. First, the chain has a buy side and a sell
          side, and each platform belongs firmly to one of them. Second, an impression is sold
          individually — not a week of banner space, but this one slot, on this one page, for this
          one person, at this one moment.
        </p>
        <p>
          That is what forced the automation. You cannot negotiate a price per impression by email.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      In your first month someone will draw this chain on a whiteboard and then argue about one box
      in the middle of it. If you do not already know the shape of the whole trip, you will not know
      which box is being argued about, or why anyone cares that it costs twenty milliseconds.
    </p>
  ),
  objectives: [
    "Trace one impression from a page load to a served ad, naming each handoff",
    "Explain why the whole cycle has to finish in roughly 100 milliseconds",
    "Say which side of the market — buying or selling — each platform serves",
  ],
  Body,
  takeaways: [
    "The stack exists because ad space is now sold one impression at a time, and no human can negotiate at that speed.",
    "A single impression travels page to SSP to exchange to DSPs and back through an ad server, in a real-time bidding cycle of roughly 100 milliseconds.",
    "Every platform in the chain belongs to either the buy side or the sell side, and knowing which tells you most of what it does.",
  ],
  checkYourself: [
    {
      question:
        "A colleague says an impression is auctioned about 100 milliseconds after the page starts loading. What happens in that window?",
      answer: (
        <p>
          The publisher's supply-side platform sends a bid request to an exchange, the exchange
          broadcasts it to connected demand-side platforms, each decides whether and how much to
          bid, the exchange picks the winner, notifies it, and the publisher's ad server delivers
          the winning creative. The whole thing repeats on every visit and every refresh.
        </p>
      ),
    },
    {
      question:
        "Why can a publisher not simply sell its ad space the way a newspaper sells a page, and skip the stack entirely?",
      answer: (
        <p>
          It can, and publishers still do sell some inventory that way through direct deals. But
          direct deals rarely fill everything, and the leftover space is only worth selling if it can
          be sold per impression to whoever values that particular person most. That is a pricing
          decision made thousands of times a second, which is a machine's job, not a salesperson's.
        </p>
      ),
    },
  ],
};

export default lesson;
