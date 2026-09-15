import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { DEFAULT_BIDS, highestBid, secondHighestBid } from "./_shared";

const STEP = 0.25;

function Stepper({
  label,
  value,
  onChange,
  min = 0,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card p-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, +(value - STEP).toFixed(2)))}
          className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Decrease ${label}`}
        >
          −
        </button>
        <span className="figure w-16 text-center text-foreground">${value.toFixed(2)}</span>
        <button
          type="button"
          onClick={() => onChange(+(value + STEP).toFixed(2))}
          className="flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

function Body() {
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEFAULT_BIDS.map((b) => [b.id, b.amount]))
  );
  const [model, setModel] = useState<"2p" | "1p">("2p");
  const [hardFloor, setHardFloor] = useState(4.25);
  const [softFloor, setSoftFloor] = useState(3.5);
  const [shading, setShading] = useState(false);

  const bids = DEFAULT_BIDS.map((b) => ({ ...b, amount: amounts[b.id] }));
  const eligible = bids.filter((b) => b.amount >= hardFloor);
  const rejected = bids.filter((b) => b.amount < hardFloor);

  let clearing: number | null = null;
  let regime = "";
  const winner = eligible.length > 0 ? highestBid(eligible) : null;
  const secondBid = eligible.length > 0 ? secondHighestBid(eligible) : null;
  let shadedBid: number | null = null;

  if (winner && secondBid) {
    if (model === "2p") {
      if (winner.amount < softFloor) {
        regime = "First price — soft-floor rule";
        clearing = winner.amount;
      } else {
        regime = "Second price";
        clearing = +(secondBid.amount + 0.01).toFixed(2);
      }
    } else {
      regime = shading ? "First price, bid shaded" : "First price";
      if (shading) {
        shadedBid = Math.max(hardFloor, +(secondBid.amount + 0.05).toFixed(2));
        clearing = shadedBid;
      } else {
        clearing = winner.amount;
      }
    }
  }

  const reduction = winner && clearing !== null ? +(winner.amount - clearing).toFixed(2) : null;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Auctions are the foundation of real-time bidding (RTB). Just like an auction for a house
          or a painting, ad inventory goes to the highest bidder — the only difference is that it
          settles in milliseconds, and the rules for what the winner actually pays have changed
          more than once.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Second-price auctions</h3>
        <p className="measure text-muted-foreground">
          In a second-price auction — also called a Vickrey auction — the highest bidder wins but
          pays just <span className="figure">$0.01</span> more than the second-highest bid. That
          amount is the{" "}
          <span className="text-foreground">clearing price</span>. The gap between the winning bid
          and the clearing price is called the reduction, or consumer surplus. Second-price auctions
          were the original RTB standard, valued for their predictability, fairness, and cost
          efficiency.
        </p>
        <p className="measure mt-2 text-sm text-muted-foreground">
          Example: Bidder A offers <span className="figure">$5.00</span>, bidder B offers{" "}
          <span className="figure">$4.00</span>. A wins but pays{" "}
          <span className="figure text-clearing">$4.01</span>, not <span className="figure">$5.00</span>.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">First-price auctions and bid shading</h3>
        <p className="measure text-muted-foreground">
          In a first-price auction, the winner pays exactly what it bid. Many exchanges shifted from
          second- to first-price auctions around 2017 and 2018, aiming for more transparency and to
          counter inefficiencies that header bidding had introduced into second-price auctions.
        </p>
        <p className="measure mt-2 text-muted-foreground">
          That shift meant advertisers paid more than they were used to for the same impressions, so
          many platforms introduced <span className="text-foreground">bid shading</span>: an
          algorithm that estimates a lower bid — close to what the advertiser would have paid under
          the old second-price model — from historical data, win rates, and market conditions. It
          helps advertisers control cost, but it is opaque: a vendor can adjust a shaded bid to
          protect its own margin, and the advertiser has no way to verify it, while the publisher
          simply receives less.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Floor prices</h3>
        <p className="measure text-muted-foreground">
          A floor price is the minimum CPM a publisher will accept. A{" "}
          <span className="text-foreground">hard floor</span> is a strict cutoff — a hard floor of{" "}
          <span className="figure">$4.25</span> rejects every bid of{" "}
          <span className="figure">$4.24</span> or less outright. A{" "}
          <span className="text-foreground">soft floor</span> is more forgiving: bids between the
          soft and hard floor can still win, but they clear at first price, while bids above the
          soft floor clear at second price as usual. It lets a publisher capture value from
          borderline bids without giving up pricing control entirely.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Adjust the three bids, the auction model, and the floors, and watch what the winner
          actually pays.
        </p>

        <div className="grid gap-2 sm:grid-cols-3">
          {bids.map((b) => (
            <Stepper key={b.id} label={b.dsp} value={b.amount} onChange={(v) => setAmounts((prev) => ({ ...prev, [b.id]: v }))} />
          ))}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Auction model</p>
            <div className="flex gap-2" role="group" aria-label="Choose the auction model">
              {(["2p", "1p"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setModel(m)}
                  aria-pressed={model === m}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                    model === m
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {m === "2p" ? "Second price" : "First price"}
                </button>
              ))}
              {model === "1p" && (
                <button
                  type="button"
                  onClick={() => setShading((s) => !s)}
                  aria-pressed={shading}
                  className={cn(
                    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                    shading
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {shading ? "Bid shading on" : "Enable bid shading"}
                </button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Stepper label="Hard floor" value={hardFloor} onChange={setHardFloor} />
            <Stepper label="Soft floor" value={softFloor} onChange={setSoftFloor} />
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          {rejected.length > 0 && (
            <div className="mb-4 space-y-1">
              <p className="text-xs uppercase text-muted-foreground">Rejected by the hard floor</p>
              {rejected.map((b) => (
                <p key={b.id} className="text-sm text-nobid">
                  {b.dsp} — <span className="figure">${b.amount.toFixed(2)}</span> is below the{" "}
                  <span className="figure">${hardFloor.toFixed(2)}</span> floor
                </p>
              ))}
            </div>
          )}

          {winner ? (
            <>
              <p className="text-xs uppercase text-muted-foreground">Winner</p>
              <p className="mt-1 text-foreground">
                {winner.dsp}, bid <span className="figure">${winner.amount.toFixed(2)}</span>
              </p>

              <p className="mt-4 text-xs uppercase text-muted-foreground">{regime}</p>
              <p className="mt-1 text-foreground">
                Pays <span className="figure text-2xl text-clearing">${clearing?.toFixed(2)}</span>
              </p>

              {shadedBid !== null && (
                <p className="measure mt-2 text-sm text-muted-foreground">
                  Bid shading estimated a lower bid of <span className="figure">${shadedBid.toFixed(2)}</span> —
                  close to what a second-price auction would have charged — instead of submitting the
                  full <span className="figure">${winner.amount.toFixed(2)}</span>.
                </p>
              )}

              {reduction !== null && model === "2p" && regime === "Second price" && (
                <p className="measure mt-2 text-sm text-muted-foreground">
                  Reduction (consumer surplus): <span className="figure">${reduction.toFixed(2)}</span> —
                  the gap between what {winner.dsp} bid and what it actually pays.
                </p>
              )}
            </>
          ) : (
            <p className="text-nobid">No bid clears the hard floor. The impression goes unsold.</p>
          )}
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A report will show a clearing price lower than the winning bid, and someone will ask if
      that's a bug. It isn't — it's the whole point of a second-price auction, and you'll need to
      explain it in one sentence.
    </p>
  ),
  objectives: [
    "Compute the clearing price in a second-price auction given two bids",
    "Explain why first-price auctions changed how advertisers bid, and what bid shading is meant to fix",
    "Distinguish a hard floor from a soft floor and say which auction model applies to a bid caught between them",
  ],
  Body,
  takeaways: [
    "In a second-price — or Vickrey — auction, the winner pays one cent above the second-highest bid; the gap between the two is the reduction, or consumer surplus.",
    "First-price auctions, which most exchanges adopted around 2017 and 2018, charge the winner exactly what it bid, which is why bid shading exists — to estimate a lower bid that approximates the old second-price outcome.",
    "A hard floor rejects any bid below it outright; a soft floor is more forgiving — bids between the soft and hard floor clear at first price, while bids above the soft floor still clear at second price.",
  ],
  checkYourself: [
    {
      question: "Bidder A bids $5.00 and bidder B bids $4.00 in a second-price auction. What does A actually pay, and what is the reduction?",
      answer: (
        <p>
          A pays <span className="figure">$4.01</span> — one cent above B's bid. The reduction, or
          consumer surplus, is <span className="figure">$0.99</span>: the gap between what A was
          willing to pay and what it actually paid.
        </p>
      ),
    },
    {
      question: "A publisher sets a hard floor of $4.25 and a soft floor of $3.50. A winning bid of $3.90 comes in. Which auction model applies, and what does the winner pay?",
      answer: (
        <p>
          The soft-floor rule applies, because <span className="figure">$3.90</span> is between the
          soft and hard floor. It clears at first price, so the winner pays exactly{" "}
          <span className="figure">$3.90</span>, not a
          second-price clearing amount.
        </p>
      ),
    },
    {
      question: "Why might a publisher be uneasy about bid shading, even though it helps advertisers control cost?",
      answer: (
        <p>
          Because it is opaque on both ends. A vendor can adjust a shaded bid to protect its own
          margin and the advertiser has no way to verify it's paying fair market value — and because
          shading lowers the final bid amount, it can reduce the publisher's revenue without the
          publisher ever seeing why.
        </p>
      ),
    },
  ],
};

export default lesson;
