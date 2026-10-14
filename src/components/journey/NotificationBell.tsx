import { Link } from "react-router-dom";
import { Bell, ClipboardList, Megaphone, Sparkles, Trophy } from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useNotifications } from "@/hooks/useLearnerData";
import { cn } from "@/lib/utils";

const ICONS = { assignment: ClipboardList, announcement: Megaphone, badge: Trophy, nudge: Sparkles, info: Bell } as const;

function timeAgo(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

/** Unread count plus a short list: assignments, nudges and announcements from admins. */
export function NotificationBell() {
  const { items, unread, markAllRead } = useNotifications();

  return (
    <Popover onOpenChange={(open) => !open && unread > 0 && markAllRead()}>
      <PopoverTrigger
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        data-tour="notifications"
        className="interactive relative -m-1.5 rounded-lg p-1.5 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="figure absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-primary px-1 text-xs leading-none text-primary-foreground">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-80 p-0">
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm text-foreground">Notifications</p>
        </div>
        {items.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">You're all caught up.</p>
        ) : (
          <ul className="max-h-96 overflow-y-auto">
            {items.map((n) => {
              const Icon = ICONS[n.kind as keyof typeof ICONS] ?? Bell;
              const body = (
                <>
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className={cn("block text-sm", n.read_at ? "text-muted-foreground" : "text-foreground")}>{n.title}</span>
                    {n.body && <span className="mt-0.5 block text-xs text-muted-foreground">{n.body}</span>}
                    <span className="figure mt-1 block text-xs text-muted-foreground">{timeAgo(n.created_at)}</span>
                  </span>
                  {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="unread" />}
                </>
              );
              return (
                <li key={n.id} className="border-b border-border last:border-0">
                  {n.link ? (
                    <Link to={n.link} className="flex gap-3 px-4 py-3 hover:bg-secondary">
                      {body}
                    </Link>
                  ) : (
                    <div className="flex gap-3 px-4 py-3">{body}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}
