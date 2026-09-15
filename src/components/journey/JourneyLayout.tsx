import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, MessageSquare, X } from "lucide-react";

import { AIChatPanel } from "@/components/ai/AIChatPanel";
import { JourneySidebar } from "@/components/journey/JourneySidebar";

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
        <div className="mx-auto max-w-4xl px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>

      <button
        type="button"
        onClick={() => setAskOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex min-h-[2.75rem] items-center gap-2 rounded-full border border-border bg-card px-4 text-sm text-foreground shadow-lg hover:border-border-strong"
      >
        <MessageSquare className="h-4 w-4" aria-hidden="true" />
        Ask a question
      </button>

      <AIChatPanel isOpen={askOpen} onClose={() => setAskOpen(false)} />
    </div>
  );
}
