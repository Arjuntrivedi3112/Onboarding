import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { toggleClass, IdentifierGrid } from "./_shared";

type AttributeId = "browser" | "os" | "language" | "fonts" | "timezone" | "settings";

const ATTRIBUTES: Array<{ id: AttributeId; label: string; divisor: number }> = [
  { id: "browser", label: "Browser version", divisor: 4 },
  { id: "os", label: "Operating system", divisor: 5 },
  { id: "language", label: "Language", divisor: 8 },
  { id: "fonts", label: "Installed fonts and plugins", divisor: 50 },
  { id: "timezone", label: "Location and time zone", divisor: 20 },
  { id: "settings", label: "Browser settings", divisor: 6 },
];

const STARTING_POPULATION = 5_000_000;

function Body() {
  const [active, setActive] = useState<Set<AttributeId>>(new Set());
  const [contextual, setContextual] = useState(false);

  function toggle(id: AttributeId) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const divisor = ATTRIBUTES.filter((a) => active.has(a.id)).reduce((product, a) => product * a.divisor, 1);
  const remaining = Math.max(1, Math.round(STARTING_POPULATION / divisor));
  const isUnique = remaining <= 3;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Over the past decade, more users have deleted or blocked cookies through browser settings
          and ad-blocking extensions, making it harder for AdTech and analytics platforms to
          consistently identify and track them. Two very different responses grew out of that: keep
          identifying the device anyway, using signals a cookie was never needed for, or stop trying
          to identify anyone and target the page instead.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Device fingerprinting</h3>
        <p className="measure text-muted-foreground">
          Fingerprinting identifies and tracks a user based on their device's own characteristics —
          browser version, operating system, language, installed plugins and fonts, location and
          time-zone settings, and other browser settings. No single one of these is unique; even
          people who own the same phone model configure it slightly differently. Combined, they
          become a recognizable signature, used to identify the same device across different
          websites without a single cookie involved. It is less precise than a cookie, but it works
          as a fallback when cookies are blocked or deleted, and as a complement to improve
          confidence when cookies are present. Because it's largely invisible to the user and hard to
          opt out of, it is also controversial, and increasingly restricted by browsers.
        </p>
        <IdentifierGrid ids={["fingerprint"]} label="Device fingerprinting identifier card" />
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Starting from {STARTING_POPULATION.toLocaleString()} browsers, tick attributes on one at a
          time and watch "one in how many people share this exact combination" collapse toward one —
          without a single cookie being read.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Choose fingerprinting attributes">
          {ATTRIBUTES.map((attribute) => (
            <button
              key={attribute.id}
              type="button"
              onClick={() => toggle(attribute.id)}
              aria-pressed={active.has(attribute.id)}
              className={toggleClass(active.has(attribute.id))}
            >
              {attribute.label}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">This device is</p>
          <p className="figure mt-1 text-2xl text-foreground">
            1 in {remaining.toLocaleString()}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {active.size === 0
              ? "No attributes selected — every browser looks alike."
              : isUnique
                ? "Effectively unique. That combination of attributes is a fingerprint."
                : "browsers sharing this exact combination of attributes."}
          </p>
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Contextual targeting</h3>
        <p className="measure text-muted-foreground">
          Contextual targeting doesn't rely on user identity at all. Instead, it targets based on the
          content being consumed right now — an article about fitness gets a fitness ad, regardless
          of who is reading it. It's more privacy-friendly than any identity-based method, since no
          user-level data is needed, and as privacy regulation tightens and identity solutions get
          harder to scale, it's enjoying a renaissance. Its cost is relevance: because there's no
          user-level data behind it, an ad can only be as relevant as the page it appears on.
        </p>
        <IdentifierGrid ids={["contextual"]} label="Contextual signals identifier card" />
      </section>

      <section>
        <h3 className="mb-3 text-lg text-foreground">The same article, two approaches</h3>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setContextual((v) => !v)} aria-pressed={contextual} className={toggleClass(contextual)}>
            {contextual ? "Viewing: contextual targeting" : "Switch to contextual targeting"}
          </button>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-card p-4">
          <p className="text-xs uppercase text-muted-foreground">Article</p>
          <p className="mt-1 text-foreground">"Best budget home gym equipment for small apartments"</p>
          {contextual ? (
            <p className="measure mt-3 text-sm text-muted-foreground">
              Ad slot targets: home fitness gear. Zero device attributes read, zero identifiers used —
              the targeting comes entirely from the page's own topic.
            </p>
          ) : (
            <p className="measure mt-3 text-sm text-muted-foreground">
              Ad slot targets: whatever the reader's fingerprint or identifier says they're
              interested in — which might have nothing to do with this article at all.
            </p>
          )}
        </div>
      </section>

      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Neither approach is a full replacement for a lost identifier. Fingerprinting keeps
          identifying the device by other means; contextual targeting stops trying to identify
          anyone and reads the page instead. Which one a team reaches for depends on whether they
          need to know who is reading, or can get by knowing only what they're reading.
        </p>
      </div>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      A publisher with no logged-in users and heavy cookie blocking asks how they're supposed to
      target ads at all. The honest menu has exactly two entries: keep identifying the device through
      its own characteristics, or stop identifying anyone and target the content instead.
    </p>
  ),
  objectives: [
    "List the device and browser characteristics that make up a fingerprint",
    "Explain why fingerprinting emerged and why it's controversial",
    "Define contextual targeting and state its main advantage and disadvantage",
    "Say which of the two methods requires user-level data and which does not",
  ],
  Body,
  takeaways: [
    "Device fingerprinting combines non-unique attributes — browser version, operating system, language, fonts and plugins, time zone, browser settings — into a signature that narrows a huge population down toward one specific device, without a single cookie.",
    "Fingerprinting emerged because users increasingly delete or block cookies, and it's now restricted by many browsers precisely because it's largely invisible and hard for a user to opt out of.",
    "Contextual targeting drops user identity entirely and reads only the content of the page, which makes it privacy-friendly and resistant to the same restrictions, at the cost of only being as relevant as that page's own topic.",
  ],
  checkYourself: [
    {
      question: "A user has deleted every cookie on their device. Does that stop fingerprinting from identifying them?",
      answer: (
        <p>
          No — fingerprinting never relied on a stored cookie in the first place. It recomputes the
          same signature from device and browser characteristics on every visit, which is exactly why
          it works as a cookie fallback.
        </p>
      ),
    },
    {
      question:
        "Why might contextual advertising work worse on a generic news homepage than on a niche fitness blog?",
      answer: (
        <p>
          Contextual targeting is only as relevant as the content itself. A generic homepage covers
          every topic at once and gives a weak signal; a niche blog's pages are narrowly about one
          thing, giving contextual targeting far more to work with.
        </p>
      ),
    },
  ],
};

export default lesson;
