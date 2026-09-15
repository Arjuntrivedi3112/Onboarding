import { cn } from "@/lib/utils";

/**
 * The five stages of the DMP workflow, shared across the collection,
 * normalization-and-profile, and activation lessons so the map is authored
 * once. Each lesson renders the same five boxes with a different stage — or
 * pair of stages — in focus, so the learner never loses their bearings
 * moving from one lesson to the next.
 */
export interface DmpStage {
  id: number;
  title: string;
  summary: string;
  detail: string;
  chips: string[];
}

export const DMP_STAGES: DmpStage[] = [
  {
    id: 1,
    title: "Collection",
    summary: "Gather data from multiple sources",
    detail:
      "A data management platform (DMP) gathers data through integrations with demand-side platforms, ad exchanges, supply-side platforms and CRM systems, and through tags — JavaScript snippets or HTML pixels — placed directly on a website or in an app.",
    chips: ["Website behavior", "App interactions", "Ad engagement", "CRM data", "Third-party data"],
  },
  {
    id: 2,
    title: "Normalization",
    summary: "Clean and standardize incoming data",
    detail:
      "Raw events arrive in whatever shape their source used. Normalization gathers the IDs on each cookie, deletes redundant or useless records, and transforms the source's data schema into the DMP's own schema, then enriches it with extra data points such as geolocation and OS or browser attributes.",
    chips: ["Schema transformation", "ID gathering", "Redundancy removal", "Enrichment"],
  },
  {
    id: 3,
    title: "Profile building",
    summary: "Merge events into one profile per person",
    detail:
      "Cleaned, enriched events are merged into individual user profiles. Behavior is linked across devices and sessions, and profiles that share an identifier are combined so no two profiles claim the same person.",
    chips: ["Cross-device matching", "Attribute inference", "Profile merging", "Master ID"],
  },
  {
    id: 4,
    title: "Segmentation",
    summary: "Group profiles into targetable audiences",
    detail:
      "Profiles are grouped into segments using conditions on general information, behavior and demographics. Taxonomies keep the naming consistent, so the same person is never split across two mismatched labels.",
    chips: ["Behavioral segments", "Interest categories", "Demographic groups", "Custom audiences"],
  },
  {
    id: 5,
    title: "Activation",
    summary: "Send segments where they can be used",
    detail:
      "Finished segments are pushed to demand-side platforms for targeting, synced with publishers for on-site personalization, exported to social platforms, and used for retargeting and email campaigns.",
    chips: ["DSP integration", "Publisher sync", "Social activation", "Email targeting"],
  },
];

export function getDmpStage(id: number): DmpStage {
  const found = DMP_STAGES.find((s) => s.id === id);
  if (!found) throw new Error(`Unknown DMP stage: ${id}`);
  return found;
}

/**
 * The stage row reused by the collection, normalization-and-profile, and
 * activation lessons. A stage inside `activeIds` renders as a real button
 * when `onSelect` is supplied; every other stage — and every stage when no
 * `onSelect` is given at all — renders as a plain, dimmed label. That keeps a
 * lesson that only teaches one or two stages from leaving a dead control on
 * the page.
 */
export function DmpStageNav({
  activeIds,
  selected,
  onSelect,
}: {
  activeIds: number[];
  selected: number;
  onSelect?: (id: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <div
        className="flex min-w-max items-center gap-1 pb-2"
        role="group"
        aria-label="DMP workflow stage"
      >
        {DMP_STAGES.map((stage, i) => {
          const isActive = activeIds.includes(stage.id);
          const isSelected = stage.id === selected;
          const shared = cn(
            "flex min-h-[2.75rem] min-w-[7rem] flex-col items-center justify-center rounded-lg border px-3 py-2 text-center text-sm transition-colors",
            isSelected
              ? "border-primary bg-primary/10 text-foreground"
              : isActive
                ? "border-border text-foreground hover:border-border-strong"
                : "border-border text-muted-foreground opacity-50"
          );
          return (
            <div key={stage.id} className="flex items-center">
              {i > 0 && (
                <span aria-hidden="true" className="px-1 text-muted-foreground">
                  →
                </span>
              )}
              {isActive && onSelect ? (
                <button type="button" onClick={() => onSelect(stage.id)} aria-pressed={isSelected} className={shared}>
                  <span className="figure text-xs text-muted-foreground">{stage.id}</span>
                  <span>{stage.title}</span>
                </button>
              ) : (
                <span className={shared}>
                  <span className="figure text-xs text-muted-foreground">{stage.id}</span>
                  <span>{stage.title}</span>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/** The detail panel for one DMP stage: its prose, plus the chips it feeds. */
export function DmpStageDetail({ stage }: { stage: DmpStage }) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <p className="text-xs uppercase text-muted-foreground">
        Stage <span className="figure">{stage.id}</span>: {stage.title}
      </p>
      <p className="measure mt-2 text-muted-foreground">{stage.detail}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {stage.chips.map((chip) => (
          <span key={chip} className="rounded-full border border-border bg-secondary px-3 py-1 text-sm text-foreground">
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
