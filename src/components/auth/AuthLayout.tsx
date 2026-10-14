import type { ReactNode } from "react";
import { BookOpen, FlaskConical, LineChart } from "lucide-react";

import { ThemeToggle } from "@/components/journey/ThemeToggle";
import { SupplyChainPulse } from "@/simulations/visuals/SupplyChainPulse";

const HIGHLIGHTS = [
  { icon: BookOpen, text: "The whole AdTech book, as 79 short lessons" },
  { icon: FlaskConical, text: "Hands-on simulations: run an auction, watch a bid travel" },
  { icon: LineChart, text: "Your progress, streaks and badges, saved to your account" },
];

/**
 * Shell for every sign-in and first-run page: a brand panel on the left
 * (hidden on phones) and a single focused form on the right.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <aside className="hidden flex-col justify-between border-r border-border bg-sidebar p-10 lg:flex">
        <span className="font-display text-xl text-foreground">AdTech Journey</span>
        <div>
          <SupplyChainPulse className="w-full max-w-lg" />
          <h2 className="mt-8 max-w-md font-display text-3xl text-foreground">
            Learn how a 100-millisecond auction decides every ad you see.
          </h2>
          <ul className="mt-6 space-y-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-muted-foreground">
                <Icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-sm text-muted-foreground">Built for IQM onboarding.</p>
      </aside>

      <main id="main" className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <span className="mb-8 block font-display text-lg text-foreground lg:hidden">AdTech Journey</span>
          <h1 className="font-display text-3xl text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </main>

      <ThemeToggle />
    </div>
  );
}
