import { useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The six-identifier deck lifted from the old IdentityModule. Every identity
 * lesson reuses this same card design, filtered down to the identifiers it
 * actually teaches, so "first-party cookie" in lesson one and "universal ID"
 * in a later lesson look like the same kind of object rather than a bespoke
 * layout invented per lesson.
 */
export type IdentifierStatus = "active" | "deprecated" | "restricted" | "emerging";

export interface IdentifierProfile {
  id: string;
  name: string;
  description: string;
  details: string;
  status: IdentifierStatus;
}

export const IDENTIFIERS: IdentifierProfile[] = [
  {
    id: "firstparty",
    name: "First-party cookies",
    description: "Set by the website you're visiting",
    details:
      "Created and read only by the domain you're on. Used for language, cart contents, and login sessions. It cannot recognize the same person on a different domain.",
    status: "active",
  },
  {
    id: "thirdparty",
    name: "Third-party cookies",
    description: "Set by a domain other than the one you're visiting",
    details:
      "Created by an external AdTech domain whose tag loads on the page you're on. The long-time backbone of cross-site tracking and retargeting, and the identifier being phased out by browser privacy features.",
    status: "deprecated",
  },
  {
    id: "maid",
    name: "Mobile ad IDs (MAID)",
    description: "IDFA on iOS, GAID on Android",
    details:
      "A device-level identifier used for attribution, audience targeting, and frequency capping. Apple's App Tracking Transparency now requires opt-in consent before an app can read it, and Google is phasing out GAID.",
    status: "restricted",
  },
  {
    id: "universal",
    name: "Universal IDs",
    description: "Cross-platform identifiers such as UID2 and ID5",
    details:
      "Interoperable across SSPs and DSPs, derived from first-party data such as a hashed email address or a device ID. Requires authentication, which is both its strength and its limit.",
    status: "emerging",
  },
  {
    id: "fingerprint",
    name: "Device fingerprinting",
    description: "A signature built from device characteristics",
    details:
      "Combines browser version, operating system, fonts, plugins, time zone, and settings into a signature. Effective without a single cookie, but invasive and increasingly blocked.",
    status: "restricted",
  },
  {
    id: "contextual",
    name: "Contextual signals",
    description: "Targeting based on page content, not the person",
    details:
      "Uses no identifier and no user data at all. Growing in importance precisely because every identifier above is getting harder to rely on.",
    status: "active",
  },
];

const STATUS_LABEL: Record<IdentifierStatus, string> = {
  active: "Active",
  deprecated: "Deprecated",
  restricted: "Restricted",
  emerging: "Emerging",
};

const STATUS_CLASS: Record<IdentifierStatus, string> = {
  active: "border-primary bg-primary/10 text-primary",
  deprecated: "border-destructive bg-destructive/10 text-destructive",
  restricted: "border-border-strong bg-secondary text-foreground",
  emerging: "border-accent bg-accent/10 text-accent-foreground",
};

/**
 * A selector over a subset of {@link IDENTIFIERS}, plus a detail panel for
 * whichever card is selected. `ids` controls which cards render and in what
 * order — each lesson passes only the identifiers it teaches.
 */
export function IdentifierGrid({ ids, label }: { ids: string[]; label: string }) {
  const options = ids
    .map((id) => IDENTIFIERS.find((identifier) => identifier.id === id))
    .filter((identifier): identifier is IdentifierProfile => Boolean(identifier));
  const [selectedId, setSelectedId] = useState(options[0]?.id);
  const selected = options.find((option) => option.id === selectedId) ?? options[0];

  if (!selected) return null;

  return (
    <div>
      <div
        className={cn("grid gap-2", options.length > 1 && "sm:grid-cols-2")}
        role="group"
        aria-label={label}
      >
        {options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => setSelectedId(option.id)}
            aria-pressed={selected.id === option.id}
            className={cn(
              "min-h-[2.75rem] rounded-lg border p-3 text-left transition-colors",
              selected.id === option.id
                ? "border-primary bg-primary/10"
                : "border-border hover:border-border-strong"
            )}
          >
            <span className="flex items-center justify-between gap-2">
              <span className="text-foreground">{option.name}</span>
              <span
                className={cn(
                  "shrink-0 rounded-full border px-2 py-0.5 text-xs uppercase",
                  STATUS_CLASS[option.status]
                )}
              >
                {STATUS_LABEL[option.status]}
              </span>
            </span>
            <span className="mt-0.5 block text-sm text-muted-foreground">
              {option.description}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-3 rounded-lg border border-border bg-card p-4">
        <p className="text-foreground">{selected.name}</p>
        <p className="measure mt-1 text-sm text-muted-foreground">{selected.details}</p>
      </div>
    </div>
  );
}

/** Shared toggle-button styling used across the identity lessons' "Try it" controls. */
export function toggleClass(active: boolean) {
  return cn(
    "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
    active
      ? "border-primary bg-primary/10 text-foreground"
      : "border-border text-muted-foreground hover:text-foreground"
  );
}
