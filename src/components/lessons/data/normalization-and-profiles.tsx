import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { DmpStageNav, DmpStageDetail, getDmpStage } from "./_shared";

interface RawEvent {
  id: string;
  label: string;
  cookie?: string;
  email?: string;
  attrs?: Record<string, string>;
}

/**
 * Five events admitted in order. Event 4 is the one that triggers a merge:
 * cookie B and the hashed email h1 each already point at a different
 * existing profile, so the DMP combines them under that shared master ID.
 */
const EVENTS: RawEvent[] = [
  { id: "e1", label: "Cookie A adds an item to a cart", cookie: "cookie-a", attrs: { device_type: "desktop" } },
  { id: "e2", label: "Cookie B opens the site on a phone", cookie: "cookie-b", attrs: { device_type: "mobile" } },
  { id: "e3", label: "Cookie A logs in, hashed email h1 attached", cookie: "cookie-a", email: "h1", attrs: {} },
  { id: "e4", label: "Cookie B logs in with the same hashed email h1", cookie: "cookie-b", email: "h1", attrs: {} },
  { id: "e5", label: "A CRM row for h1 arrives, schema transformed to match", email: "h1", attrs: { company: "Acme Retail" } },
];

interface Profile {
  id: string;
  cookies: string[];
  email: string | null;
  attrs: Record<string, string>;
}

function buildProfiles(events: RawEvent[]): { profiles: Profile[]; mergedAt: string | null } {
  let profiles: Profile[] = [];
  let mergedAt: string | null = null;
  let nextId = 1;

  for (const e of events) {
    const matches = profiles.filter(
      (p) => (e.cookie && p.cookies.includes(e.cookie)) || (e.email && p.email === e.email)
    );

    if (matches.length === 0) {
      profiles.push({
        id: `Profile ${nextId++}`,
        cookies: e.cookie ? [e.cookie] : [],
        email: e.email ?? null,
        attrs: { ...e.attrs },
      });
    } else if (matches.length === 1) {
      const p = matches[0];
      if (e.cookie && !p.cookies.includes(e.cookie)) p.cookies.push(e.cookie);
      if (e.email) p.email = e.email;
      p.attrs = { ...p.attrs, ...e.attrs };
    } else {
      mergedAt = e.id;
      const mergedCookies = Array.from(new Set(matches.flatMap((m) => m.cookies).concat(e.cookie ? [e.cookie] : [])));
      const mergedAttrs = Object.assign({}, ...matches.map((m) => m.attrs), e.attrs);
      const merged: Profile = {
        id: matches[0].id,
        cookies: mergedCookies,
        email: e.email ?? matches.find((m) => m.email)?.email ?? null,
        attrs: mergedAttrs,
      };
      profiles = profiles.filter((p) => !matches.includes(p)).concat(merged);
    }
  }

  return { profiles, mergedAt };
}

function Body() {
  const [step, setStep] = useState(0);
  const [stage, setStage] = useState(2);

  const done = step >= EVENTS.length;
  const { profiles, mergedAt } = buildProfiles(EVENTS.slice(0, step));
  const justMerged = step > 0 && EVENTS[step - 1].id === mergedAt;
  const currentStage = getDmpStage(stage);

  return (
    <div className="space-y-8">
      <section>
        <h3 className="mb-1 text-lg text-foreground">Two stages, back to back</h3>
        <DmpStageNav activeIds={[2, 3]} selected={stage} onSelect={setStage} />
        <div className="mt-4">
          <DmpStageDetail stage={currentStage} />
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Once data is collected, it has to be normalized. That can mean gathering the IDs on web
          cookies, deleting redundant or useless data, transforming the source's data schema into the
          DMP's own schema, and enriching records with extra data points such as geolocation and OS or
          browser attributes. Normalization does two things: it puts every dataset into a common
          format, and it improves the value and quality of the data itself. During this stage each
          user is assigned a unique ID and attributes — age, gender, location, browser history,
          interests, purchase history — that later drive segmentation.
        </p>
        <p>
          A profile is a structured collection of the data gathered from events a DMP has tracked,
          representing one unique user. It can carry a profile ID, a list of cookie IDs, a list of
          hashed emails, a country last seen, a name, a device type, vendor and OS, a browser vendor,
          gender, company and company size, and a list of matching IDs. A profile often starts thin —
          just a cookie ID and a device type — and is extended as more data becomes available. When a
          new event carries an identifier the DMP already has on file, it updates the matching
          profile; when the identifier is unrecognized, a new profile is created instead.
        </p>
        <p>
          It's common for two profiles to end up sharing an identifier, such as the same cookie ID. When
          that happens, the DMP performs profile merging: combining the overlapping profiles into a
          single, unified record, so no two profiles claim the same identifier. Most DMPs anchor this
          to a master ID — a single ID tied to one profile, usually a persistent one such as a hashed
          email address. Any new event carrying that master ID adds its data to that one profile.
        </p>
      </div>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Admit five raw events into the DMP one at a time, and watch profiles build, extend, and
          merge.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Admit the next event">
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(s + 1, EVENTS.length))}
            disabled={done}
            className={cn(
              "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
              done ? "border-border text-muted-foreground opacity-50" : "border-primary bg-primary/10 text-foreground"
            )}
          >
            Admit the next event
          </button>
          <button
            type="button"
            onClick={() => setStep(0)}
            className="min-h-[2.75rem] rounded-lg border border-border px-4 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Restart
          </button>
        </div>

        <p className="measure mt-3 text-sm text-muted-foreground">
          {step === 0
            ? "No events admitted yet."
            : `Just admitted: ${EVENTS[step - 1].label}.`}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {profiles.length === 0 && (
            <p className="measure text-sm text-muted-foreground">No profiles exist yet.</p>
          )}
          {profiles.map((p) => (
            <div key={p.id} className="rounded-lg border border-border bg-card p-4">
              <p className="text-xs uppercase text-muted-foreground">{p.id}</p>
              <p className="mt-1 text-sm text-foreground">
                Cookies: <span className="text-muted-foreground">{p.cookies.join(", ") || "none"}</span>
              </p>
              <p className="mt-1 text-sm text-foreground">
                Hashed email: <span className="text-muted-foreground">{p.email ?? "none"}</span>
              </p>
              {Object.entries(p.attrs).length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {Object.entries(p.attrs).map(([k, v]) => (
                    <span key={k} className="rounded-full border border-border bg-secondary px-2 py-0.5 text-sm text-foreground">
                      {k}: {v}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {justMerged && (
          <p className="measure mt-3 rounded-lg border border-border bg-card p-4 text-sm text-muted-foreground">
            Master ID at work: cookie B and cookie A both point at hashed email h1, so their two
            profiles just merged into one unified record.
          </p>
        )}

        {done && (
          <p className="measure mt-3 text-sm text-muted-foreground">
            One profile ended up carrying two devices, a company attribute from a CRM row, and a
            master ID tying it all together. The other stayed thin, because it never shared an
            identifier with anything else.
          </p>
        )}
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          One case study describes a custom data management stack built from exactly these pieces:
          data collection and normalization, customer profile building, cookie syncing, low-latency
          APIs for retrieving visitor data, audience creation and export, and dynamic content
          formatting. The result was real-time customer insight and the ability to deliver
          personalized content the moment it was needed — the same normalization and profile-building
          work you just ran, chained together at production scale.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      Two cookies land in the DMP carrying the same hashed email — one from a laptop at night, one
      from a phone the next morning. Without profile merging, that's two separate half-empty records
      instead of one real person, and every targeting decision built on top of them gets weaker.
    </p>
  ),
  objectives: [
    "List what happens to raw data during normalization and enrichment",
    "Explain the difference between profile building and profile merging",
    "Say what a master ID is and why most DMPs use a persistent one, such as a hashed email",
  ],
  Body,
  takeaways: [
    "Normalization gathers IDs from cookies, strips out redundant or invalid data, transforms each source's schema into the DMP's own schema, and enriches records with details such as geolocation and browser attributes.",
    "A profile starts thin and is extended as more data arrives; an event with an identifier already on file updates the matching profile, and an unrecognized identifier creates a new one.",
    "Profile merging combines two profiles that share an identifier into a single record, and most DMPs anchor that merge to a persistent master ID such as a hashed email address.",
  ],
  checkYourself: [
    {
      question:
        "Two profiles both carry the hashed email h1 — one from a desktop cookie, one from a mobile cookie. What does the DMP do, and what identifier makes it possible?",
      answer: (
        <p>
          It merges them into one profile, keyed on the shared master ID — the hashed email they both
          carry.
        </p>
      ),
    },
    {
      question: "An event arrives with a cookie ID the DMP has never seen, and no email attached. What happens to it?",
      answer: <p>A new, thin profile is created for it, holding only what that event contained.</p>,
    },
    {
      question: "Why is storing DMP data described as conceptually simple but technically challenging?",
      answer: (
        <p>
          The idea of storage is simple, but the volume of data involved, the need to move it between
          systems, and the need to prevent data loss make the actual implementation difficult.
        </p>
      ),
    },
  ],
};

export default lesson;
