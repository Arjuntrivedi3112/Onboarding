import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { IdentifierGrid, toggleClass } from "./_shared";

const COOKIE_USES = [
  { title: "Website personalization", detail: "Remembering language, theme, and currency." },
  {
    title: "Authentication",
    detail: "Storing a session ID so a user stays logged in without re-entering credentials.",
  },
  { title: "eCommerce functionality", detail: "Remembering which products a user viewed, carted, or bought." },
  {
    title: "Analytics and measurement",
    detail: "Storing an identifier that groups a user's pages, clicks, and completed goals under one session.",
  },
  {
    title: "Behavioral targeting and advertising",
    detail: "Identifying a user by past behavior to show relevant ads, and to know which ads they viewed or clicked.",
  },
];

type Visit = {
  id: number;
  site: string;
  firstPartyCookie: string;
  thirdPartyCookie: string | null;
  recognized: boolean;
};

const SITES = [
  { id: "techcrunch.com", label: "Visit techcrunch.com" },
  { id: "sportsdaily.com", label: "Visit sportsdaily.com" },
] as const;

function Body() {
  const [blocked, setBlocked] = useState(false);
  const [sspCookie, setSspCookie] = useState<string | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [counter, setCounter] = useState(1);

  function visit(site: string) {
    const firstPartyCookie = `${site} session=fp${counter}`;
    let thirdPartyCookie: string | null = null;
    let recognized = false;

    if (!blocked) {
      if (sspCookie) {
        thirdPartyCookie = sspCookie;
        recognized = true;
      } else {
        thirdPartyCookie = `ssp1.com uid=tp${counter}`;
        setSspCookie(thirdPartyCookie);
      }
    }

    setVisits((prev) => [...prev, { id: counter, site, firstPartyCookie, thirdPartyCookie, recognized }]);
    setCounter((c) => c + 1);
  }

  function toggleBlocked() {
    setBlocked((b) => !b);
    setSspCookie(null);
    setVisits([]);
  }

  function reset() {
    setBlocked(false);
    setSspCookie(null);
    setVisits([]);
    setCounter(1);
  }

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          The HTTP protocol that governs communication between a browser and a server is inherently
          stateless: it receives a request and sends a response, and remembers nothing about the
          visitor who sent it. Web cookies — small files placed on a device by a server — were
          created by Lou Montulli in 1994 to solve exactly that problem, letting a browser store a
          small piece of data and send it back with every later request.
        </p>
        <p>
          That is the entire mechanism behind "remembering" a visitor. Everything below is a
          variation on it.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">What cookies are used for</h3>
        <ul className="grid gap-2 sm:grid-cols-2">
          {COOKIE_USES.map((use) => (
            <li key={use.title} className="rounded-lg border border-border bg-card p-3">
              <span className="text-foreground">{use.title}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{use.detail}</span>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">First-party versus third-party</h3>
        <p className="measure mb-4 text-muted-foreground">
          Cookies have been the dominant way to identify a web visitor since the early internet, now
          restricted by privacy law such as the European Union's General Data Protection Regulation
          (GDPR) and browser features like Safari's Intelligent Tracking Prevention. But even before
          any restriction, cookies split into two categories that behave very differently — the
          distinction is which domain issued the cookie relative to the domain the visitor is on.
        </p>
        <IdentifierGrid ids={["firstparty", "thirdparty"]} label="Choose a cookie type" />
        <p className="measure mt-4 text-muted-foreground">
          Suppose you visit techcrunch.com and the page loads a script from an AdTech domain such as
          ssp1.com. A first-party cookie gets created for techcrunch.com; a separate third-party
          cookie gets created for ssp1.com, because ssp1.com is not the domain you are visiting.
          A first-party cookie set by techcrunch.com cannot be read by ssp1.com on some other site —
          that limit is exactly why AdTech relies on third-party cookies and on cookie syncing, the
          process of mapping one user ID (say, one stored in a data management platform) to another
          platform's ID (say, a demand-side platform), so the same person can be recognized across
          domains.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Visit techcrunch.com, then sportsdaily.com. Both pages load a tag from the same AdTech
          domain, ssp1.com. Watch which cookie gets recognized on the second site and which one
          never leaves the first. Then turn on browser blocking — standing in for Safari's
          Intelligent Tracking Prevention or Firefox's Enhanced Tracking Protection — and repeat the
          visits.
        </p>

        <div className="flex flex-wrap gap-2">
          {SITES.map((site) => (
            <button key={site.id} type="button" onClick={() => visit(site.id)} className={toggleClass(false)}>
              {site.label}
            </button>
          ))}
          <button type="button" onClick={toggleBlocked} aria-pressed={blocked} className={toggleClass(blocked)}>
            {blocked ? "Third-party cookies blocked (ITP on)" : "Block third-party cookies"}
          </button>
          <button type="button" onClick={reset} className={toggleClass(false)}>
            Reset simulation
          </button>
        </div>

        <div className="mt-4 space-y-2">
          {visits.length === 0 && (
            <p className="measure text-sm text-muted-foreground">No visits yet — try a site above.</p>
          )}
          {visits.map((v) => (
            <div
              key={v.id}
              className={cn(
                "rounded-lg border p-3",
                v.recognized ? "border-border-strong bg-card" : "border-border bg-secondary"
              )}
            >
              <p className="text-foreground">{v.site}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                First-party cookie written: <span className="figure">{v.firstPartyCookie}</span>
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {v.thirdPartyCookie ? (
                  <>
                    ssp1.com cookie: <span className="figure">{v.thirdPartyCookie}</span> —{" "}
                    {v.recognized ? "recognized as a returning visitor" : "new to ssp1.com"}
                  </>
                ) : (
                  "ssp1.com could not set or read a cookie — blocked"
                )}
              </p>
            </div>
          ))}
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Notice what the second visit proves: techcrunch.com's first-party cookie never travels to
          sportsdaily.com, but ssp1.com's third-party cookie does, because ssp1.com's tag runs on
          both pages. That single cookie is what lets an AdTech platform recognize one person across
          unrelated sites — and it is exactly what a browser blocking third-party cookies breaks.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A campaign manager asks why a retargeting audience suddenly shrank on Safari but not Chrome.
      The honest answer starts with knowing that "a cookie" is not one thing — a first-party cookie
      and a third-party cookie behave completely differently, and only one of them is what browsers
      are restricting.
    </p>
  ),
  objectives: [
    "Explain why cookies exist: HTTP is stateless, and a cookie is what lets a server recognize a repeat visitor",
    "Tell a first-party cookie from a third-party cookie by which domain set it",
    "Explain why a third-party cookie can recognize a user across sites while a first-party cookie cannot",
    "Say why third-party cookies are declining, naming at least one law and one browser feature",
  ],
  Body,
  takeaways: [
    "A cookie is a small piece of data a browser stores and resends with every request, invented to give the stateless HTTP protocol a way to remember a visitor.",
    "A first-party cookie is set by the domain the user is on and cannot be read anywhere else; a third-party cookie is set by an external domain's tag and can be read wherever that same tag runs, which is what makes cross-site tracking and cookie syncing possible.",
    "Third-party cookies are declining because of privacy law like the GDPR and browser defenses like Safari's Intelligent Tracking Prevention and Firefox's Enhanced Tracking Protection, and once they are blocked, cross-site recognition breaks.",
  ],
  checkYourself: [
    {
      question:
        "On techcrunch.com, a first-party cookie for techcrunch.com and a third-party cookie for ssp1.com both get set. On your next visit to sportsdaily.com, which one can ssp1.com read again?",
      answer: (
        <p>
          Only its own third-party cookie — ssp1.com can read the cookie it set, on any site where
          its tag runs. It cannot read techcrunch.com's first-party cookie; that one belongs to
          techcrunch.com alone.
        </p>
      ),
    },
    {
      question:
        "A user turns on Safari's Intelligent Tracking Prevention. Does that break your own site's login cookie?",
      answer: (
        <p>
          No. Intelligent Tracking Prevention targets third-party, cross-site trackers. A first-party
          session cookie used to keep someone logged in to your own site is not the thing it is
          built to stop.
        </p>
      ),
    },
  ],
};

export default lesson;
