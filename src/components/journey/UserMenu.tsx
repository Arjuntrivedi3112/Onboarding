import { Link } from "react-router-dom";
import { ChevronsUpDown, Compass, HelpCircle, LogOut, ShieldCheck, UserRound } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { startProductTour } from "@/components/journey/ProductTour";
import { initialsFor, useAuth } from "@/lib/auth/AuthProvider";

/** The signed-in learner's avatar and account actions, pinned to the rail's foot. */
export function UserMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { profile, isAdmin, signOut } = useAuth();
  if (!profile) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tour="user-menu"
        className="interactive flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span
          aria-hidden="true"
          className="figure flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
        >
          {initialsFor(profile)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm text-foreground">{profile.full_name || profile.email}</span>
          <span className="block truncate text-xs text-muted-foreground">{isAdmin ? "Admin" : profile.email}</span>
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="top" className="w-60">
        <DropdownMenuLabel className="truncate font-normal text-muted-foreground">{profile.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/profile" onClick={onNavigate}>
            <UserRound className="mr-2 h-4 w-4" aria-hidden="true" />
            Profile and progress
          </Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin" onClick={onNavigate}>
              <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" />
              Admin console
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onSelect={() => {
            onNavigate?.();
            startProductTour();
          }}
        >
          <Compass className="mr-2 h-4 w-4" aria-hidden="true" />
          Take the tour
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/help" onClick={onNavigate}>
            <HelpCircle className="mr-2 h-4 w-4" aria-hidden="true" />
            Help
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
