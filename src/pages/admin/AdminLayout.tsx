import { NavLink, Outlet, Link } from "react-router-dom";
import { ArrowLeft, BarChart3, BookOpenCheck, KeyRound, Megaphone, MessageCircleQuestion, UserPlus, Users, UsersRound } from "lucide-react";

import { ThemeToggle } from "@/components/journey/ThemeToggle";
import { useResetRequests } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin", label: "Overview", icon: BarChart3, end: true },
  { to: "/admin/people", label: "People", icon: Users },
  { to: "/admin/add", label: "Add people", icon: UserPlus },
  { to: "/admin/cohorts", label: "Cohorts", icon: UsersRound },
  { to: "/admin/content", label: "Content insights", icon: BookOpenCheck },
  { to: "/admin/questions", label: "AI questions", icon: MessageCircleQuestion },
  { to: "/admin/password-help", label: "Password help", icon: KeyRound, badge: "reset" as const },
  { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
];

/** The admin console shell: its own navigation, separate from the journey. */
export default function AdminLayout() {
  const { data: requests = [] } = useResetRequests();

  const link = (item: (typeof NAV)[number], compact = false) => (
    <NavLink
      key={item.to}
      to={item.to}
      end={item.end}
      className={({ isActive }) =>
        cn(
          "flex shrink-0 items-center gap-3 rounded-lg text-sm transition-colors",
          compact ? "px-3 py-2" : "px-3 py-2",
          isActive ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground"
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className={compact ? "" : "flex-1"}>{item.label}</span>
      {item.badge === "reset" && requests.length > 0 && (
        <span className="figure rounded-full bg-floor px-1.5 text-xs leading-5 text-primary-foreground" aria-label={`${requests.length} pending`}>
          {requests.length}
        </span>
      )}
    </NavLink>
  );

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-[260px] flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="border-b border-sidebar-border p-4">
          <span className="font-display text-lg text-foreground">Admin console</span>
          <p className="text-xs text-muted-foreground">AdTech Journey onboarding</p>
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Admin">
          {NAV.map((item) => link(item))}
        </nav>
        <div className="border-t border-sidebar-border p-2">
          <Link to="/dashboard" className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to learning
          </Link>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-background lg:hidden">
        <div className="flex h-14 items-center gap-3 px-4">
          <Link to="/dashboard" aria-label="Back to learning" className="-m-2 p-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" aria-hidden="true" />
          </Link>
          <span className="font-display text-base text-foreground">Admin console</span>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-2 pb-2" aria-label="Admin">
          {NAV.map((item) => link(item, true))}
        </nav>
      </header>

      <main id="main" className="lg:ml-[260px]">
        <div className="mx-auto max-w-7xl px-4 py-8 md:px-8">
          <Outlet />
        </div>
      </main>
      <ThemeToggle />
    </div>
  );
}
