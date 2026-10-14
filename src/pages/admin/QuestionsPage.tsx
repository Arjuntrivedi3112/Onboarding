import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Card, EmptyState, PageHeader, inputClass, relativeTime } from "@/components/admin/ui";
import { curriculum, findLesson } from "@/curriculum";
import { useChatQuestions, useLearners } from "@/lib/admin/api";
import { cn } from "@/lib/utils";

/** What people ask the assistant: the clearest signal of where the book leaves gaps. */
export default function QuestionsPage() {
  const { data: questions = [], isLoading } = useChatQuestions(500);
  const { learners } = useLearners();
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("all");

  const nameOf = (id: string) => learners.find((l) => l.user.id === id)?.user.full_name ?? "A learner";
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return questions.filter((x) => {
      const ref = x.lesson_id ? findLesson(curriculum, x.lesson_id) : null;
      return (section === "all" || (section === "none" ? !ref : ref?.section.id === section)) && (!q || x.question.toLowerCase().includes(q));
    });
  }, [questions, query, section]);

  const bySection = useMemo(() => {
    const counts = new Map<string, number>();
    questions.forEach((x) => {
      const id = x.lesson_id ? findLesson(curriculum, x.lesson_id)?.section.id ?? "none" : "none";
      counts.set(id, (counts.get(id) ?? 0) + 1);
    });
    return counts;
  }, [questions]);
  const max = Math.max(1, ...bySection.values());

  return (
    <div>
      <PageHeader title="AI questions" description="Questions learners asked the assistant, newest first. Clusters point at lessons worth expanding." />

      <Card title="Questions by section" className="mb-6">
        <ul className="space-y-2">
          {curriculum.flatMap((p) => p.sections).map((s) => {
            const n = bySection.get(s.id) ?? 0;
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => setSection(section === s.id ? "all" : s.id)}
                  aria-pressed={section === s.id}
                  className={cn("grid w-full grid-cols-[10rem_minmax(0,1fr)_2.5rem] items-center gap-3 rounded text-left text-sm", section === s.id && "text-primary")}
                >
                  <span className="truncate text-muted-foreground">{s.title}</span>
                  <span className="h-4 rounded bg-secondary" aria-hidden="true">
                    <span className="block h-full rounded bg-primary" style={{ width: `${(n / max) * 100}%` }} />
                  </span>
                  <span className="figure text-right text-foreground">{n}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </Card>

      <div className="mb-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <label className="relative">
          <span className="sr-only">Search questions</span>
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search questions" className={cn(inputClass, "pl-9")} />
        </label>
        <select aria-label="Section" value={section} onChange={(e) => setSection(e.target.value)} className={inputClass}>
          <option value="all">All sections</option>
          <option value="none">Not on a lesson</option>
          {curriculum.flatMap((p) => p.sections).map((s) => (
            <option key={s.id} value={s.id}>
              {s.title}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState>No questions match.</EmptyState>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {filtered.map((q) => (
            <li key={q.id} className="p-4">
              <p className="text-foreground">
                “{q.question}”{q.blocked && <span className="ml-2 rounded-full border border-border px-2 text-xs text-muted-foreground">off-topic, declined</span>}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {nameOf(q.user_id)} · {q.lesson_id ? findLesson(curriculum, q.lesson_id)?.lesson.title ?? q.lesson_id : "general"} · {relativeTime(q.created_at)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
