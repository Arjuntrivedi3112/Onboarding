import { useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, EmptyState, PageHeader, buttonClass, inputClass, relativeTime } from "@/components/admin/ui";
import { useAdminActions, useAdminAnnouncements, useCohorts } from "@/lib/admin/api";
import { useAuth } from "@/lib/auth/AuthProvider";

/** Messages pinned to learners' dashboards (and sent to their notification bell). */
export default function AnnouncementsPage() {
  const { user } = useAuth();
  const { data: items = [] } = useAdminAnnouncements();
  const { data: cohorts = [] } = useCohorts();
  const { announce, deleteAnnouncement } = useAdminActions();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [cohortId, setCohortId] = useState("");

  const publish = async () => {
    try {
      await announce.mutateAsync({ title: title.trim(), body: body.trim(), cohortId: cohortId || null, createdBy: user!.id });
      toast.success("Announcement published");
      setTitle("");
      setBody("");
    } catch (e) {
      toast.error("Couldn't publish", { description: e instanceof Error ? e.message : undefined });
    }
  };

  return (
    <div>
      <PageHeader title="Announcements" description="Shown at the top of learners' dashboards, and as a notification." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card title="New announcement">
          <div className="space-y-3">
            <label className="block space-y-1.5 text-sm text-foreground">
              Title
              <input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="e.g. Office hours this Thursday" />
            </label>
            <label className="block space-y-1.5 text-sm text-foreground">
              Message
              <textarea
                value={body}
                maxLength={5000}
                rows={5}
                onChange={(e) => setBody(e.target.value)}
                className="w-full rounded-lg border border-input bg-background p-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
            <label className="block space-y-1.5 text-sm text-foreground">
              Who sees it
              <select value={cohortId} onChange={(e) => setCohortId(e.target.value)} className={inputClass}>
                <option value="">Everyone</option>
                {cohorts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" onClick={publish} disabled={!title.trim() || !body.trim() || announce.isPending} className={buttonClass.primary}>
              <Megaphone className="h-4 w-4" aria-hidden="true" />
              Publish
            </button>
          </div>
        </Card>

        <Card title="Published">
          {items.length === 0 ? (
            <EmptyState>Nothing published yet.</EmptyState>
          ) : (
            <ul className="space-y-4">
              {items.map((a) => (
                <li key={a.id} className="flex gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground">{a.title}</p>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">{a.body}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.cohort_id ? cohorts.find((c) => c.id === a.cohort_id)?.name ?? "A cohort" : "Everyone"} · {relativeTime(a.published_at)}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => window.confirm("Remove this announcement?") && deleteAnnouncement.mutate(a.id)}
                    aria-label={`Remove ${a.title}`}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
