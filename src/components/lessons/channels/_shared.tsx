/**
 * The channel detail card, lifted out of the old ChannelsModule.
 *
 * The module rendered one panel — ad formats, key features, technical details
 * — for whichever of the nine channels was selected. The lessons keep the same
 * panel, but each lesson owns the channels it teaches, so the data sits in the
 * lesson file and only the presentation is shared.
 */

export interface AdFormat {
  /** The format name, in sentence case. */
  label: string;
  /** Any dimension, duration or count that belongs with the label. */
  figure?: string;
}

export interface ChannelProfile {
  title: string;
  description: string;
  formats: AdFormat[];
  keyFeatures: string[];
  techDetails: string;
}

export function ChannelDetail({ profile }: { profile: ChannelProfile }) {
  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <h3 className="text-lg text-foreground">{profile.title}</h3>
      <p className="measure mt-1 text-muted-foreground">{profile.description}</p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs uppercase text-muted-foreground">Ad formats</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {profile.formats.map((format) => (
              <li
                key={format.figure ? `${format.label}-${format.figure}` : format.label}
                className="rounded-full bg-secondary px-3 py-1.5 text-sm text-foreground"
              >
                {format.label}
                {format.figure && (
                  <span className="figure ml-2 text-muted-foreground">{format.figure}</span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="text-xs uppercase text-muted-foreground">Key features</p>
          <ul className="mt-2 space-y-2">
            {profile.keyFeatures.map((feature) => (
              <li key={feature} className="flex gap-3 text-sm text-muted-foreground">
                <span
                  aria-hidden="true"
                  className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary"
                />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5 rounded-lg border border-border bg-secondary p-4">
        <p className="text-xs uppercase text-muted-foreground">Technical details</p>
        <p className="measure mt-1 text-sm text-muted-foreground">{profile.techDetails}</p>
      </div>
    </section>
  );
}
