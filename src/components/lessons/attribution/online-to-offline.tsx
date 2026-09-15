import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";

const STEPS = [
  { label: "Mobile ad click", detail: "The user taps an ad on their phone." },
  { label: "Walks into the store", detail: "Days later, that same phone walks into a physical location." },
  { label: "Beacon pings the phone", detail: "A Bluetooth beacon in the store detects the device and logs it." },
  { label: "Purchase at the till", detail: "The user checks out, and the sale is recorded." },
] as const;

function Body() {
  const [step, setStep] = useState(0);
  const [hasBeacons, setHasBeacons] = useState(true);
  const [asksZip, setAsksZip] = useState(true);

  const atPurchase = step === STEPS.length - 1;
  const beaconWouldHaveFired = step >= 2;
  const attributed = hasBeacons || asksZip;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The previous lesson connected offline exposure to an online result. This one runs the
          same problem in reverse: attributing online activity — an ad view or a click — to a
          purchase that happens in a physical store.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Walk through one customer's path from ad click to purchase. Then try switching off the
          store's methods for closing the loop, one at a time, and see what happens to the sale at
          the end.
        </p>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            {STEPS.map((s, i) => (
              <span key={s.label} className="flex items-center gap-2">
                <span
                  className={cn(
                    "rounded-full px-3 py-1 text-sm",
                    i <= step ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-px w-6",
                      i < step ? "bg-primary" : "bg-border",
                      i === 2 && !hasBeacons && "border-t border-dashed border-destructive bg-transparent"
                    )}
                  />
                )}
              </span>
            ))}
          </div>

          <p className="measure mt-3 text-sm text-muted-foreground">{STEPS[step].detail}</p>
          {step === 2 && !hasBeacons && (
            <p className="measure mt-1 text-sm text-destructive">
              This store has no beacons installed, so this step never actually happens — nothing
              detects that the phone from the ad click is now standing in the store.
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
              disabled={atPurchase}
              className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>

          {atPurchase && (
            <div
              className={cn(
                "mt-4 rounded-lg border p-4",
                attributed ? "border-primary bg-primary/10" : "border-border-strong bg-secondary"
              )}
            >
              <p className="text-foreground">
                {attributed ? "Sale attributed to the mobile ad click." : "Sale not attributed — recorded as an anonymous walk-in."}
              </p>
              <p className="measure mt-1 text-sm text-muted-foreground">
                {attributed
                  ? hasBeacons && beaconWouldHaveFired
                    ? "The in-store beacon tied this device to the earlier ad click, so the purchase links back to the campaign that started it."
                    : "The beacon never fired, but the ZIP code collected at checkout was enough to match this sale against the campaign's location data."
                  : "No beacon detected the device in-store, and the cashier never asked for a ZIP code. There is nothing connecting this purchase back to the ad click at all — as far as the campaign report is concerned, it just didn't happen."}
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4" role="group" aria-label="Break the chain">
            <button
              type="button"
              onClick={() => setHasBeacons((v) => !v)}
              aria-pressed={!hasBeacons}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                !hasBeacons
                  ? "border-destructive bg-destructive/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {hasBeacons ? "Remove the store's beacons" : "Restore the store's beacons"}
            </button>
            <button
              type="button"
              onClick={() => setAsksZip((v) => !v)}
              aria-pressed={!asksZip}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                !asksZip
                  ? "border-destructive bg-destructive/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {asksZip ? "Stop asking for a ZIP code at checkout" : "Start asking for a ZIP code at checkout"}
            </button>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">Beacons</h4>
          <p className="text-sm text-muted-foreground">
            Bluetooth-enabled devices placed in brick-and-mortar stores that exchange signals with
            nearby smartphones and tablets. They can push notifications to devices within a certain
            radius, and the device data they collect is what ties an earlier ad click or in-app
            activity to an in-store purchase.
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <h4 className="mb-2 text-foreground">ZIP/postal codes at point of sale (POS)</h4>
          <p className="text-sm text-muted-foreground">
            The reverse of the offline-to-online technique from the last lesson: staff ask for a
            ZIP code at checkout, and it gets matched against the location data in the online
            campaign's reports. Not highly accurate on its own — best used as a supplementary
            signal alongside other attribution methods.
          </p>
        </div>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A retailer will ask whether their mobile ad spend is actually driving people into the store,
      not just to the website — and the answer depends entirely on whether the store has any way to
      recognize a phone that clicked an ad. Knowing what beacons and ZIP codes can and can't do is
      what keeps that conversation honest.
    </p>
  ),
  objectives: [
    "Explain what online-to-offline attribution is, and how it differs from offline-to-online attribution",
    "Explain how an in-store beacon ties an earlier ad click to a purchase",
    "Explain how a ZIP code collected at point of sale (POS) serves as a backup signal, and why it alone isn't highly accurate",
  ],
  Body,
  takeaways: [
    "Online-to-offline attribution runs the previous lesson's direction backward: instead of connecting an offline ad to an online visit, it connects an online ad click or view to a purchase that happens in a physical store.",
    "Bluetooth beacons placed in brick-and-mortar stores exchange signals with nearby phones and tablets, and the device data they collect is what ties an earlier ad click or app session to that in-store visit.",
    "Asking for a ZIP code at the point of sale and matching it against a campaign's location data is a usable backup, but on its own it isn't highly accurate — like most offline-online bridges, it works best as a supplementary signal alongside other methods.",
  ],
  checkYourself: [
    {
      question:
        "Using the walkthrough above, switch off both the store's beacons and the ZIP-code question, then step through to the purchase. What happens to the sale?",
      answer: (
        <p>
          It shows up as an anonymous walk-in, unattributed to anything. With no beacon to detect
          the phone in-store and no ZIP code collected at checkout, there is no signal left that
          connects the purchase back to the mobile ad click that started the journey.
        </p>
      ),
    },
    {
      question:
        "A retailer with no budget for in-store beacons still wants partial credit for their mobile ad spend. What's the lowest-cost option from this lesson, and what should they combine it with?",
      answer: (
        <p>
          Asking for a ZIP code at point of sale — no hardware required. On its own it isn't highly
          accurate, since you can't be sure a given ZIP code means someone actually saw the ad, so
          it's worth pairing with the coupons or online-survey methods from the previous lesson for
          cross-validation.
        </p>
      ),
    },
  ],
};

export default lesson;
