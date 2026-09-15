import { useState } from "react";

import type { LessonContent } from "@/components/journey/lesson-content";
import { cn } from "@/lib/utils";
import { StackNode, ChainArrow } from "./_shared";

const GAMA_PLAYERS = [
  { id: "google", letter: "G", name: "Google" },
  { id: "apple", letter: "A", name: "Apple" },
  { id: "meta", letter: "M", name: "Meta" },
  { id: "amazon", letter: "A", name: "Amazon" },
];

const INDEPENDENT_CHIPS = ["DSP", "SSP", "Ad exchange", "Ad server", "DMP", "Data broker"];

type EcosystemSide = "independent" | "walled";

const INDEPENDENT_CHAIN = ["Publisher", "SSP", "Exchange", "DSP", "Ad server"];
const WALLED_CHAIN = ["Publisher's audience", "The platform (owns data, inventory, tools)", "Advertiser"];

const WHO_STILL_WORKS: Record<EcosystemSide, string[]> = {
  independent: [
    "An agency trading desk (ATD) still manages the buy — choosing which DSP, setting targeting, watching pacing.",
    "AdOps still traffics tags — once in the publisher's ad server, once in the advertiser's — and reconciles what each one reports.",
  ],
  walled: [
    "An ATD still manages the buy — but through the platform's own ad-buying interface instead of an open-market DSP.",
    "AdOps still sets up and adjusts the campaign — inside the platform's own tools, since there is no third-party ad server to traffic a tag into.",
  ],
};

type RoleView = "adops" | "trafficking";

const TRAFFICKING_PHASES = [
  { label: "Set up", text: "Build the campaign in the ad server, load creatives, and traffic the ad tags." },
  { label: "Monitor", text: "Watch delivery, pacing, and discrepancies once the campaign is live." },
  { label: "Optimize", text: "Adjust campaigns and header-bidding wrapper settings as needed." },
];

function Body() {
  const [ecosystemSide, setEcosystemSide] = useState<EcosystemSide>("independent");
  const [roleView, setRoleView] = useState<RoleView>("adops");

  const chain = ecosystemSide === "independent" ? INDEPENDENT_CHAIN : WALLED_CHAIN;

  return (
    <div className="space-y-8">
      <div className="measure space-y-4 text-muted-foreground">
        <p>
          Every platform in the last three lessons is technology. None of it runs itself — a company
          owns each piece, and a person is accountable for what it does. This lesson is about those
          companies and job titles, and about one structural choice that removes several of those
          platforms at once: whether the inventory sits behind a walled garden.
        </p>
      </div>

      <section>
        <h3 className="mb-3 text-lg text-foreground">Walled gardens</h3>
        <p className="measure mb-4 text-muted-foreground">
          The AdTech ecosystem splits into two groups: independent AdTech companies, and{" "}
          <span className="text-foreground">walled gardens</span> — a closed ecosystem where one
          platform or technology provider controls access to its own users, data, and advertising
          inventory. In AdTech you will often hear the term{" "}
          <span className="text-foreground">GAMA</span> — Google, Apple, Meta, and Amazon —
          considered among the most prominent walled gardens.
        </p>

        <div className="rounded-lg border border-border bg-card p-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {GAMA_PLAYERS.map((player) => (
              <div
                key={player.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3"
              >
                <span className="figure flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-sm text-foreground">
                  {player.letter}
                </span>
                <span className="text-sm text-foreground">{player.name}</span>
              </div>
            ))}
          </div>
          <p className="measure mt-3 text-sm text-muted-foreground">
            These platforms keep their audiences and data inside their own ecosystem, requiring a
            brand to use their advertising tools to reach that audience at all. Inside a walled
            garden, buying, targeting, and measurement all happen with the platform's own tools —
            because the platform owns the users, the data, and the inventory all at once.
          </p>
        </div>

        <p className="measure mt-4 text-muted-foreground">
          The other half of the ecosystem is the independent AdTech covered so far — DSPs, SSPs, ad
          exchanges, ad servers, DMPs, and data brokers. Instead of one company controlling users,
          data, and inventory, these platforms interoperate with one another across the open web.
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {INDEPENDENT_CHIPS.map((label) => (
            <span
              key={label}
              className="rounded-lg border border-border bg-secondary px-3 py-1 text-sm text-muted-foreground"
            >
              {label}
            </span>
          ))}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">In the wild</h3>
        <p className="measure text-muted-foreground">
          The book describes a full-stack walled garden built for an over-the-top (OTT) streaming
          platform — a self-serve buying platform, an ad server, a data lake, a customer data
          platform (CDP), and custom application programming interfaces (APIs), all owned by the same
          client. Monetizing first-party data this way is exactly what a walled garden is for.
        </p>
      </section>

      <section>
        <h3 className="mb-1 text-lg text-foreground">Try it</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          Switch between an open, independent chain and a walled garden and watch how many separate
          companies the impression passes through. Fewer boxes does not mean fewer jobs — see which
          roles below still have work either way.
        </p>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Choose independent AdTech or a walled garden"
        >
          {(["independent", "walled"] as EcosystemSide[]).map((side) => (
            <button
              key={side}
              type="button"
              onClick={() => setEcosystemSide(side)}
              aria-pressed={ecosystemSide === side}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                ecosystemSide === side
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {side === "independent" ? "Independent AdTech" : "Walled garden"}
            </button>
          ))}
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="flex min-w-max items-center gap-1 pb-2">
            {chain.map((label, i) => (
              <div key={label} className="flex items-center">
                {i > 0 && <ChainArrow />}
                <StackNode label={label} active />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-border bg-card p-5">
          <p className="text-xs uppercase text-muted-foreground">Who still has work to do</p>
          <ul className="mt-2 space-y-2">
            {WHO_STILL_WORKS[ecosystemSide].map((line) => (
              <li key={line} className="flex gap-3 text-muted-foreground">
                <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                <span className="measure">{line}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg text-foreground">Agencies and trading desks</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">Advertising agency</h4>
            <p className="measure text-sm text-muted-foreground">
              An independent, external firm that creates, plans, and manages campaigns for a client —
              a business, a multinational corporation, a non-profit, or a government. Agencies once
              made their name on television commercials and print campaigns; today, most rely on
              advertising and marketing technology and are called interactive, creative, media, or
              digital agencies instead.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-2 text-foreground">Agency trading desk (ATD)</h4>
            <p className="measure text-sm text-muted-foreground">
              A unit <span className="text-foreground">within</span> an advertising agency that
              handles programmatic media buying on a brand's behalf. It has a services layer — media
              buyers, developers, account managers — and a technical layer of proprietary technology
              plus external tools such as a DSP. Most major agencies run their own trading desk.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-1">
              <StackNode label="Brand" />
              <ChainArrow />
              <StackNode label="Agency" />
              <ChainArrow />
              <StackNode label="ATD" />
              <ChainArrow />
              <StackNode label="DSP" active />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-lg text-foreground">AdOps vs. ad trafficking</h3>
        <p className="measure mb-4 text-sm text-muted-foreground">
          The two terms get used interchangeably, but one names the people and the other names the
          process. Toggle to compare.
        </p>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Compare AdOps and ad trafficking">
          {([
            { id: "adops", label: "AdOps — the people" },
            { id: "trafficking", label: "Ad trafficking — the process" },
          ] as { id: RoleView; label: string }[]).map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setRoleView(option.id)}
              aria-pressed={roleView === option.id}
              className={cn(
                "min-h-[2.75rem] rounded-lg border px-4 text-sm transition-colors",
                roleView === option.id
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        {roleView === "adops" ? (
          <div className="mt-4 space-y-4">
            <p className="measure text-muted-foreground">
              AdOps refers to the people responsible for carrying out the trafficking process below:
              setting up campaigns, trafficking tags, configuring header-bidding wrappers, and
              adjusting campaigns as needed. Both publishers and advertisers run AdOps teams.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="mb-2 text-foreground">Advertiser AdOps team</h4>
                <p className="measure text-sm text-muted-foreground">
                  Configures campaigns in the advertiser's own ad server and hands ad tags to the
                  publisher.
                </p>
              </div>
              <div className="rounded-lg border border-border bg-card p-4">
                <h4 className="mb-2 text-foreground">Publisher AdOps team</h4>
                <p className="measure text-sm text-muted-foreground">
                  Sets up the campaign, adds the advertiser's tags to the publisher's own ad server,
                  and launches it.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4 space-y-4">
            <p className="measure text-muted-foreground">
              Ad trafficking is the process of setting up, monitoring, and optimizing campaigns
              within ad servers and other AdTech platforms — the work itself, not the job title.
            </p>
            <ul className="grid gap-2 sm:grid-cols-3">
              {TRAFFICKING_PHASES.map((phase) => (
                <li key={phase.label} className="rounded-lg border border-border bg-card p-3">
                  <span className="block text-foreground">{phase.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{phase.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}

const lesson: LessonContent = {
  whyThisMatters: (
    <p>
      "We can't get the data" means something completely different depending on whether the
      inventory sits inside a walled garden or on the open web — and whether the person who can fix
      it sits at an agency's trading desk or on a publisher's AdOps team. Knowing the org chart, not
      just the platforms, tells you who to actually ask.
    </p>
  ),
  objectives: [
    "Define a walled garden and name the four companies GAMA stands for",
    "Say what an agency trading desk manages that the agency itself does not",
    "Distinguish AdOps, the team, from ad trafficking, the process it carries out",
  ],
  Body,
  takeaways: [
    "A walled garden is a closed ecosystem where one platform controls its own users, data, and inventory, forcing advertisers to buy through that platform's own tools instead of the open independent AdTech stack.",
    "An agency trading desk is a unit inside an advertising agency, combining a services layer of people with a technical layer of proprietary and third-party tools such as a DSP, to run programmatic buying on a brand's behalf.",
    "Ad trafficking is the process — setting up, monitoring, and optimizing a campaign inside an ad server — and AdOps is the name for the people who do that work, on both the publisher's and the advertiser's side.",
  ],
  checkYourself: [
    {
      question: "A brand wants to reach an audience that only exists inside one of the GAMA platforms. What changes about how they buy?",
      answer: (
        <p>
          They cannot route the buy through an independent DSP and an open exchange the way they
          would elsewhere. Because that platform owns its users, data, and inventory, buying,
          targeting, and measurement all have to happen through tools the platform itself provides.
        </p>
      ),
    },
    {
      question: "Your agency contact says their trading desk will handle programmatic. What are they telling you, precisely?",
      answer: (
        <p>
          That the buying will run through a unit inside the agency — its ATD — rather than the
          agency negotiating each placement by hand. The ATD's services layer will manage the
          campaign, and its technical layer, likely including a DSP, will actually place the bids.
        </p>
      ),
    },
  ],
};

export default lesson;
