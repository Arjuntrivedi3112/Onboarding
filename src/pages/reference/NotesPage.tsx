import { useNavigate, useParams } from "react-router-dom";

import { SessionDetailView } from "@/components/modules/SessionDetailView";
import { SessionNotesModule } from "@/components/modules/SessionNotesModule";
import { useSessions } from "@/hooks/useSessions";

export default function NotesPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const { sessions, doubts, setSessions, setDoubts, isRefreshing, failed, retry } = useSessions();

  const selected = sessionId ? sessions.find((session) => session.id === sessionId) : undefined;

  return (
    <div>
      <h1 className="sr-only">Session notes</h1>

      {failed && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-foreground">
            Couldn't reach GitHub, so anything added elsewhere isn't here yet.
          </p>
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-[2.75rem] items-center rounded-lg border border-border-strong px-4 text-sm text-foreground hover:bg-secondary"
          >
            Try again
          </button>
        </div>
      )}

      {isRefreshing && (
        <p className="mb-4 text-sm text-muted-foreground" aria-live="polite">
          Checking for updates…
        </p>
      )}

      {sessionId && selected ? (
        <SessionDetailView
          sessionId={sessionId}
          onBack={() => navigate("/notes")}
          sessions={sessions}
          doubts={doubts}
          onDoubtsChange={setDoubts}
          onSessionsChange={setSessions}
        />
      ) : (
        <SessionNotesModule
          onSelectSession={(id) => navigate(`/notes/${id}`)}
          sessions={sessions}
          doubts={doubts}
          onSessionsChange={setSessions}
          onDoubtsChange={setDoubts}
        />
      )}
    </div>
  );
}
