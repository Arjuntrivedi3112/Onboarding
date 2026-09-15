import { useMemo, useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { toggleClass } from "./_shared";

const DIMENSIONS = [
  "Country", "Device type", "Browser", "Time of day", "Campaign",
  "Line item", "Creative", "Publisher domain", "OS", "OS version", "Geolocation",
] as const;

type Row = { country: string; device: string; campaign: string; impressions: number; clicks: number };

const ROWS: Row[] = [
  { country: "Poland", device: "Mobile", campaign: "Spring sale", impressions: 82_000, clicks: 410 },
  { country: "Poland", device: "Desktop", campaign: "Spring sale", impressions: 41_000, clicks: 180 },
  { country: "Germany", device: "Mobile", campaign: "Spring sale", impressions: 76_000, clicks: 350 },
  { country: "Germany", device: "Desktop", campaign: "Brand awareness", impressions: 52_000, clicks: 96 },
  { country: "France", device: "Mobile", campaign: "Brand awareness", impressions: 63_000, clicks: 140 },
  { country: "France", device: "Desktop", campaign: "Spring sale", impressions: 29_000, clicks: 88 },
];

type GroupKey = "country" | "device" | "campaign";
const GROUP_OPTIONS: { id: GroupKey; label: string }[] = [
  { id: "country", label: "Group by country" },
  { id: "device", label: "Group by device" },
  { id: "campaign", label: "Group by campaign" },
];

const COUNTRIES = Array.from(new Set(ROWS.map((r) => r.country)));

const AGE_STAGES = [
  { id: 0, label: "This month", detail: "14 Sep, 14:00 — 3,204 impressions logged this hour" },
  { id: 1, label: "1–12 months old", detail: "14 Sep (whole day) — 76,000 impressions" },
  { id: 2, label: "Over 1 year old", detail: "Spring sale campaign, all time — 1,240,000 impressions" },
] as const;

function Body() {
  const [groupBy, setGroupBy] = useState<GroupKey>("country");
  const [excluded, setExcluded] = useState<string[]>([]);
  const [ageIndex, setAgeIndex] = useState(0);
  const [advertiserTz, setAdvertiserTz] = useState(false);

  const included = ROWS.filter((r) => !excluded.includes(r.country));

  const grouped = useMemo(() => {
    const map = new Map<string, { impressions: number; clicks: number }>();
    for (const row of included) {
      const key = row[groupBy];
      const current = map.get(key) ?? { impressions: 0, clicks: 0 };
      map.set(key, { impressions: current.impressions + row.impressions, clicks: current.clicks + row.clicks });
    }
    return Array.from(map.entries());
  }, [included, groupBy]);

  const grandTotal = included.reduce((sum, r) => sum + r.impressions, 0);

  const toggleCountry = (country: string) => {
    setExcluded((prev) => (prev.includes(country) ? prev.filter((c) => c !== country) : [...prev, country]));
  };

  const stage = AGE_STAGES[ageIndex];

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          A dimension is an attribute used to break down and analyze data — country, device type,
          campaign, and so on. Subdimensions, or drill-downs, let you go one level deeper inside a
          dimension: country, then carrier, then line item, then ad.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Common dimensions</h3>
        <div className="flex flex-wrap gap-2">
          {DIMENSIONS.map((d) => (
            <span key={d} className="rounded-md border border-border bg-card px-2.5 py-1 text-sm text-muted-foreground">
              {d}
            </span>
          ))}
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card p-3">
          <p className="text-xs uppercase text-muted-foreground">Example drill-down</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-sm">
            {["Country", "Carrier", "Line item", "Ad"].map((level, i, arr) => (
              <span key={level} className="flex items-center gap-1.5">
                <span className="text-foreground">{level}</span>
                {i < arr.length - 1 && <span className="text-muted-foreground">then</span>}
              </span>
            ))}
          </div>
        </div>
        <p className="measure mt-3 text-sm text-muted-foreground">
          Case study: one AdOps reporting dashboard was built to collect, aggregate, normalize,
          process, and visualize data from an ad mediator platform, so publishers could filter
          reports by demand partner, device, and time interval. Three groups ended up using it —
          AdOps, system users, and employees — which is a reminder that a report is rarely built for
          only one audience.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Filtering</h3>
        <div className="measure space-y-3 text-muted-foreground">
          <p>
            Filtering — also called segmentation — narrows the dataset a report uses, independently
            of which dimension organizes it. You can filter down to two countries and still choose to
            group the result by device instead of by country.
          </p>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Date range", example: "1 Jan – 31 Jan" },
            { label: "Campaign hierarchy", example: "advertiser then IO then line item then ad" },
            { label: "Geographic or technical", example: "country equals Poland or Germany" },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border border-border bg-card p-3">
              <p className="text-foreground">{f.label}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{f.example}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it — a small report builder</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Switch the grouping dimension and the same six rows of raw data regroup, while the grand
          total holds steady. Then exclude a country and watch the total actually drop — filtering
          and grouping are two different levers, and this is what tells them apart.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose a dimension to group by">
          {GROUP_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setGroupBy(option.id)}
              aria-pressed={groupBy === option.id}
              className={toggleClass(groupBy === option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Exclude a country">
          {COUNTRIES.map((country) => (
            <button
              key={country}
              type="button"
              onClick={() => toggleCountry(country)}
              aria-pressed={!excluded.includes(country)}
              className={toggleClass(!excluded.includes(country))}
            >
              {excluded.includes(country) ? `Include ${country}` : `Exclude ${country}`}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary text-muted-foreground">
              <tr>
                <th className="p-3 font-normal capitalize">{groupBy === "device" ? "Device" : groupBy}</th>
                <th className="p-3 font-normal">Impressions</th>
                <th className="p-3 font-normal">Clicks</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map(([key, totals], index) => (
                <tr key={key} className={index > 0 ? "border-t border-border" : undefined}>
                  <td className="p-3 text-foreground">{key}</td>
                  <td className="figure p-3 text-foreground">{totals.impressions.toLocaleString()}</td>
                  <td className="figure p-3 text-foreground">{totals.clicks.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="measure mt-2 text-sm text-muted-foreground">
          Grand total across the included rows: <span className="figure text-foreground">{grandTotal.toLocaleString()}</span> impressions.
        </p>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Technical considerations of reporting</h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Delays</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Reports lag real-time events. Approximated data can appear within minutes, but
              billing-grade accuracy typically takes up to 24 hours.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Reporting time zone</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Two systems in different time zones produce reports that will not align until you
              confirm and standardize which zone each one is reporting in.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <p className="text-foreground">Data retention</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Last month at hourly granularity, 1 to 12 months at daily granularity, and past a year,
              campaign-level summaries only.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Same event, watched age</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Set how old this data is">
              {AGE_STAGES.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setAgeIndex(s.id)}
                  aria-pressed={ageIndex === s.id}
                  className={toggleClass(ageIndex === s.id)}
                >
                  {s.label}
                </button>
              ))}
            </div>
            <div className="mt-3 rounded-lg border border-border bg-card p-4">
              <p className="text-sm text-foreground">{stage.detail}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Same campaign, same events — only the granularity the platform still bothers to keep
                has changed.
              </p>
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase text-muted-foreground">Same event, watched time zone</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Choose which system's time zone to read the event in">
              <button
                type="button"
                onClick={() => setAdvertiserTz(false)}
                aria-pressed={!advertiserTz}
                className={toggleClass(!advertiserTz)}
              >
                Read in the publisher's time zone (UTC)
              </button>
              <button
                type="button"
                onClick={() => setAdvertiserTz(true)}
                aria-pressed={advertiserTz}
                className={toggleClass(advertiserTz)}
              >
                Read in the advertiser's time zone (UTC+2)
              </button>
            </div>
            <div
              className={cn(
                "mt-3 rounded-lg border p-4",
                advertiserTz ? "border-primary bg-primary/10" : "border-border bg-card"
              )}
            >
              <p className="figure text-sm text-foreground">
                {advertiserTz ? "15 Sep, 01:40" : "14 Sep, 23:40"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                One event, logged once. Read in UTC it belongs to the 14th; read two hours ahead it
                belongs to the 15th — so a daily report can disagree with itself before anything is
                actually wrong.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Someone will ask you to slice a report a new way and expect the grand total not to move — and
      then separately ask why yesterday's numbers keep changing today. Knowing which of those is
      grouping, which is filtering, and which is just how reporting infrastructure works saves you
      from chasing a bug that was never there.
    </p>
  ),
  objectives: [
    "Say what a dimension is and give an example drill-down from a broad dimension to a narrow one",
    "Explain what filtering does to a report and distinguish it from choosing a dimension to group by",
    "Name three technical factors that can make two reports of the same campaign disagree even when nothing is wrong",
  ],
  Body,
  takeaways: [
    "A dimension is the attribute you break a report down by — country, device, campaign — and a subdimension drills one level deeper inside a dimension, like carrier inside country.",
    "Filtering narrows which rows a report includes at all, separate from which dimension organizes them — you can filter to two countries and still choose to group by device instead of by country.",
    "Two identical events can produce two different-looking reports for reasons that have nothing to do with tracking accuracy — a reporting delay, a mismatched time zone, or data that has already aged into a coarser retention tier.",
  ],
  checkYourself: [
    {
      question:
        "A report grouped by country shows Poland as the top performer. Regrouped by device it shows mobile as the top performer. Is one of these wrong?",
      answer: (
        <p>
          No. They are two different dimensions over the same underlying data, and their grand
          totals should still match — only the breakdown changes with the grouping.
        </p>
      ),
    },
    {
      question:
        "You pull yesterday's numbers at 9am and they look low. You pull the same day again tomorrow and they look noticeably higher. What should you check before assuming tracking broke?",
      answer: (
        <p>
          Reporting delay. Approximate data can appear within minutes, but billing-grade accuracy
          often takes up to 24 hours to fully settle, so an early pull of yesterday's data is
          expected to look incomplete.
        </p>
      ),
    },
    {
      question:
        "The publisher's dashboard logs an event at 11:40pm on the 14th; the advertiser's system logs the same event on the 15th. What's the likely cause?",
      answer: (
        <p>
          Mismatched reporting time zones. The fix is to confirm and standardize which zone each
          system reports in before comparing daily totals — not to assume one side counted an extra
          event.
        </p>
      ),
    },
  ],
};

export default lesson;
