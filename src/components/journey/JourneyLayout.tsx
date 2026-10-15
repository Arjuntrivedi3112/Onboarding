import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, MessageSquare, X } from "lucide-react";

import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { onOpenAskPanel } from "@/components/ai/askBus";
import { BadgeWatcher } from "@/components/journey/BadgeWatcher";
import { CommandPalette } from "@/components/journey/CommandPalette";
import { JourneySidebar } from "@/components/journey/JourneySidebar";
import { PageTransition } from "@/components/journey/PageTransition";
import { ProductTour } from "@/components/journey/ProductTour";
import { ThemeToggle } from "@/components/journey/ThemeToggle";
import { cn } from "@/lib/utils";

/**
 * The app shell: a persistent rail plus the routed content column.
 *
 * The sidebar lives here rather than inside each page so it is not remounted
 * on navigation and keeps its scroll position. Below `lg` the rail becomes a
 * sheet behind a menu button, which is what makes the app usable on a phone —
 * the previous fixed 280px offset left content unreadable under ~600px.
 */
export function JourneyLayout() {
  const location = useLocation();
  const [railOpen, setRailOpen] = useState(false);
  const [askOpen, setAskOpen] = useState(false);
  const [askPrefill, setAskPrefill] = useState<string | undefined>(undefined);
  // Simulators need room for a stage plus a side panel.
  const wide = location.pathname.startsWith("/lab/");

  useEffect(
    () =>
      onOpenAskPanel((prefill) => {
        setAskPrefill(prefill);
        setAskOpen(true);
      }),
    []
  );

  // Close the mobile sheet whenever navigation happens.
  useEffect(() => {
    setRailOpen(false);
  }, [location.pathname]);

  // Reading position should start at the top of each new lesson.
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!railOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setRailOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [railOpen]);

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop rail */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[280px] border-r border-sidebar-border lg:block">
        <JourneySidebar />
      </aside>

      {/* Mobile sheet */}
      {railOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setRailOpen(false)}
            className="absolute inset-0 bg-foreground/40"
          />
          <div className="absolute left-0 top-0 h-full w-[85vw] max-w-[320px] border-r border-sidebar-border shadow-xl">
            <JourneySidebar onNavigate={() => setRailOpen(false)} />
          </div>
        </div>
      )}

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          aria-label="Open menu"
          aria-expanded={railOpen}
          className="-m-2 p-2 text-muted-foreground hover:text-foreground"
        >
          {railOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="font-display text-base text-foreground">AdTech Journey</span>
      </header>

      <main id="main" className="lg:ml-[280px]">
        <div className={cn("mx-auto px-4 pb-28 pt-8 md:px-8", wide ? "max-w-6xl" : "max-w-4xl")}>
          <PageTransition>
            <Outlet />
          </PageTransition>
        </div>
      </main>

      <button
        type="button"
        onClick={() => {
          setAskPrefill(undefined);
          setAskOpen(true);
        }}
        data-tour="ask-question"
        aria-label="Ask a question"
        className="interactive fixed bottom-5 right-4 z-30 inline-flex min-h-[2.75rem] min-w-[2.75rem] items-center justify-center gap-2 rounded-full border border-border bg-card px-3 text-sm text-foreground shadow-lg hover:border-primary/40 sm:right-5 sm:px-4"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">Ask a question</span>
      </button>

      <ThemeToggle />
      <ProductTour />
      <AIChatPanel isOpen={askOpen} onClose={() => setAskOpen(false)} prefill={askPrefill} />
      <CommandPalette />
      <BadgeWatcher />
    </div>
  );
}
