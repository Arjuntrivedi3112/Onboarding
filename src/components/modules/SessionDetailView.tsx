import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Tag,
  Image as ImageIcon,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Maximize2,
  X as CloseIcon,
  Pencil,
  Check,
} from "lucide-react";
import type { Session, Doubt } from "./SessionNotesModule";
import { MOCK_SESSIONS, MOCK_DOUBTS } from "./SessionNotesModule";
import doubtsData from "../../../data/sessions/doubts.json";
import { saveDoubtsToGitHub, saveSessionsToGitHub, isGitHubConfigured, uploadSessionImageToGitHub, deleteSessionImageFromGitHub } from "@/lib/githubStorage";
import { useToast } from "@/hooks/use-toast";

interface SessionDetailViewProps {
  sessionId: string;
  onBack: () => void;
  sessions: Session[];
  doubts: Doubt[];
  onDoubtsChange: (doubts: Doubt[]) => void;
  onSessionsChange: (sessions: Session[]) => void;
}

export function SessionDetailView({ sessionId, onBack, sessions, doubts: allDoubts, onDoubtsChange, onSessionsChange }: SessionDetailViewProps) {
  // Find the session from parent data
  const session = sessions.find((s) => s.id === sessionId);

  // Filter doubts for this session
  const sessionDoubts = allDoubts.filter((d) => d.sessionId === sessionId);
  
  const [newDoubtText, setNewDoubtText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [viewerImageUrl, setViewerImageUrl] = useState<string | null>(null);
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [editDate, setEditDate] = useState<string>(session?.date || "");
  const [editTime, setEditTime] = useState<string>(session?.time || "");
  const { toast } = useToast();

  // Check if GitHub auto-commit is configured
  const githubConfigured = isGitHubConfigured();

  // Auto-save doubts to GitHub
  const saveDoubtsToGitHubAuto = async (updatedSessionDoubts: Doubt[]) => {
    if (!githubConfigured) return;

    // Merge with all doubts (not just this session)
    const otherDoubts = allDoubts.filter((d) => d.sessionId !== sessionId);
    const mergedDoubts = [...otherDoubts, ...updatedSessionDoubts];

    const success = await saveDoubtsToGitHub(mergedDoubts);

    if (success) {
      toast({
        title: "Saved to GitHub",
        description: "Doubts automatically committed.",
      });
    } else {
      toast({
        title: "Save failed",
        description: "Could not commit doubts to GitHub.",
        variant: "destructive",
      });
    }
  };

  if (!session) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Session not found.</p>
        <button
          onClick={onBack}
          className="mt-4 px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { 
      month: "long", 
      day: "numeric", 
      year: "numeric" 
    });
  };

  // Format timestamp for doubts
  const formatTimestamp = (isoStr: string) => {
    const date = new Date(isoStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Toggle doubt status between open and resolved
  const toggleDoubtStatus = (doubtId: string) => {
    const updatedSessionDoubts = sessionDoubts.map((d) =>
      d.id === doubtId
        ? { ...d, status: (d.status === "open" ? "resolved" : "open") as "open" | "resolved" }
        : d
    );
    
    // Update parent state
    const otherDoubts = allDoubts.filter((d) => d.sessionId !== sessionId);
    const mergedDoubts = [...otherDoubts, ...updatedSessionDoubts];
    onDoubtsChange(mergedDoubts);
    
    saveDoubtsToGitHubAuto(updatedSessionDoubts);
  };

  // Add a new doubt
  const handleAddDoubt = () => {
    if (!newDoubtText.trim()) return;

    const newDoubt: Doubt = {
      id: `d${Date.now()}`,
      sessionId,
      text: newDoubtText.trim(),
      createdAt: new Date().toISOString(),
      status: "open",
    };

    const updatedSessionDoubts = [newDoubt, ...sessionDoubts];
    
    // Update parent state
    const otherDoubts = allDoubts.filter((d) => d.sessionId !== sessionId);
    const mergedDoubts = [...otherDoubts, ...updatedSessionDoubts];
    onDoubtsChange(mergedDoubts);
    
    setNewDoubtText("");
    saveDoubtsToGitHubAuto(updatedSessionDoubts);
  };

  // Sort doubts: open first, then by newest
  const sortedDoubts = [...sessionDoubts].sort((a, b) => {
    if (a.status !== b.status) {
      return a.status === "open" ? -1 : 1;
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div>
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Sessions
      </button>

      {/* Session Metadata */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{session.title}</h1>
        <div className="flex items-center gap-6 text-muted-foreground mb-4">
          {!isEditingMeta ? (
            <>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{formatDate(session.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>{session.time}</span>
              </div>
              <button
                className="ml-auto px-3 py-1 rounded-md border hover:bg-muted text-xs flex items-center gap-1"
                onClick={() => {
                  setEditDate(session.date);
                  setEditTime(session.time);
                  setIsEditingMeta(true);
                }}
                title="Edit date/time"
              >
                <Pencil className="w-3 h-3" /> Edit
              </button>
            </>
          ) : (
            <div className="flex items-center w-full gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="px-2 py-1 rounded-md bg-muted border"
                />
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="px-2 py-1 rounded-md bg-muted border"
                />
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  className="px-3 py-1 rounded-md bg-primary text-primary-foreground text-xs flex items-center gap-1"
                  disabled={!editDate || !editTime}
                  onClick={async () => {
                    const updatedSessions = sessions.map((s) =>
                      s.id === sessionId ? { ...s, date: editDate, time: editTime } : s
                    );
                    onSessionsChange(updatedSessions);
                    const ok = await saveSessionsToGitHub(updatedSessions);
                    setIsEditingMeta(false);
                    if (ok) {
                      toast({ title: "Updated", description: "Date/time saved to GitHub." });
                    } else {
                      toast({ title: "Saved locally", description: "Failed to commit sessions.json.", variant: "destructive" });
                    }
                  }}
                >
                  <Check className="w-3 h-3" /> Save
                </button>
                <button
                  className="px-3 py-1 rounded-md border text-xs"
                  onClick={() => setIsEditingMeta(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tags */}
        {session.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-2">
              {session.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Session Overview / Summary */}
      <section className="mb-8 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-3">Session Overview</h2>
        <p className="text-sm leading-relaxed whitespace-pre-line">{session.overview}</p>
      </section>

      {/* Session Media */}
      <section className="mb-8 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-3 flex items-center gap-2">
          <ImageIcon className="w-5 h-5" />
          Session Media
        </h2>
        {session.media.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            {session.media.map((url, idx) => (
              <div
                key={idx}
                className="relative aspect-video border rounded-lg bg-muted overflow-hidden group"
              >
                <img
                  src={url}
                  alt={`Session media ${idx + 1}`}
                  className="object-cover w-full h-full cursor-zoom-in"
                  onClick={() => setViewerImageUrl(url)}
                />
                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    className="p-2 rounded-md bg-background/70 hover:bg-background border"
                    title="View full screen"
                    onClick={(e) => { e.stopPropagation(); setViewerImageUrl(url); }}
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 rounded-md bg-background/70 hover:bg-background border"
                    title="Delete image"
                    onClick={async (e) => {
                      e.stopPropagation();
                      if (!githubConfigured) {
                        toast({ title: "GitHub not configured", description: "Cannot delete image file.", variant: "destructive" });
                        return;
                      }
                      const ok = await deleteSessionImageFromGitHub(url);
                      const updatedSessions = sessions.map((s) =>
                        s.id === sessionId ? { ...s, media: s.media.filter((m) => m !== url) } : s
                      );
                      onSessionsChange(updatedSessions);
                      const committed = await saveSessionsToGitHub(updatedSessions);
                      toast({
                        title: ok && committed ? "Image deleted" : "Deleted locally",
                        description: ok && committed ? "Removed from GitHub and session." : "Failed to commit to GitHub.",
                        variant: ok && committed ? undefined : "destructive",
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground mb-4">No media yet. Upload images relevant to this session.</p>
        )}

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept="image/*"
            id="session-image-upload"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              if (!githubConfigured) {
                toast({
                  title: "GitHub not configured",
                  description: "Set up GitHub env vars to upload.",
                  variant: "destructive",
                });
                e.target.value = "";
                return;
              }
              setIsUploading(true);
              const url = await uploadSessionImageToGitHub(sessionId, file);
              setIsUploading(false);
              e.target.value = "";
              if (!url) {
                toast({
                  title: "Upload failed",
                  description: "Could not upload image to GitHub.",
                  variant: "destructive",
                });
                return;
              }

              const updatedSessions = sessions.map((s) =>
                s.id === sessionId ? { ...s, media: [...s.media, url] } : s
              );
              onSessionsChange(updatedSessions);
              const ok = await saveSessionsToGitHub(updatedSessions);
              if (ok) {
                toast({ title: "Image uploaded", description: "Saved to GitHub and added to session." });
              } else {
                toast({ title: "Saved locally", description: "Failed to commit sessions.json to GitHub.", variant: "destructive" });
              }
            }}
          />
          <label
            htmlFor="session-image-upload"
            className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors cursor-pointer"
          >
            {isUploading ? "Uploading..." : "Upload Image"}
          </label>
        </div>
      </section>

      {/* Fullscreen Viewer */}
      {viewerImageUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={() => setViewerImageUrl(null)}>
          <div className="relative max-w-5xl w-full" onClick={(e) => e.stopPropagation()}>
            <button
              className="absolute -top-10 right-0 px-3 py-2 rounded-md bg-background text-foreground border"
              onClick={() => setViewerImageUrl(null)}
            >
              <CloseIcon className="w-4 h-4" />
            </button>
            <img src={viewerImageUrl} alt="Session media" className="w-full h-auto rounded-lg" />
          </div>
        </div>
      )}

      {/* Understanding / Flow / Mental Model */}
      <section className="mb-8 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-3">Understanding / Mental Model</h2>
        <div className="prose prose-sm max-w-none">
          {/* 
            Main learning section - flexible for future interactive elements.
            Currently displays markdown-like formatted text.
            Can be extended with diagrams, buttons, embedded components, etc.
          */}
          <div className="text-sm leading-relaxed whitespace-pre-line">
            {session.understanding}
          </div>
        </div>
      </section>

      {/* Outcomes / Actionables */}
      {session.outcomes && (
        <section className="mb-8 p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-3">Outcomes / Actionables</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line text-muted-foreground">
            {session.outcomes}
          </p>
        </section>
      )}

      {/* Session Doubts (Shared) */}
      <section className="mb-8 p-6 border rounded-lg bg-card">
        <h2 className="text-xl font-semibold mb-4">Session Doubts</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Anyone can add doubts. All doubts are visible to everyone. No authentication required.
        </p>

        {/* Add new doubt */}
        <div className="mb-6">
          <textarea
            value={newDoubtText}
            onChange={(e) => setNewDoubtText(e.target.value)}
            placeholder="Type your doubt or question here..."
            className="w-full px-4 py-3 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm resize-none"
            rows={3}
          />
          <div className="flex justify-end mt-2">
            <button
              onClick={handleAddDoubt}
              disabled={!newDoubtText.trim()}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Doubt
            </button>
          </div>
        </div>

        {/* Doubts list */}
        <div className="space-y-3">
          {sortedDoubts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No doubts yet. Be the first to add one!
            </p>
          ) : (
            sortedDoubts.map((doubt) => (
              <motion.div
                key={doubt.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 border rounded-lg bg-background hover:border-primary/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {/* Status toggle button */}
                  <button
                    onClick={() => toggleDoubtStatus(doubt.id)}
                    className="mt-1 text-muted-foreground hover:text-primary transition-colors"
                  >
                    {doubt.status === "resolved" ? (
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="flex-1">
                    <p
                      className={`text-sm mb-1 ${
                        doubt.status === "resolved"
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {doubt.text}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatTimestamp(doubt.createdAt)}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          doubt.status === "open"
                            ? "bg-orange-500/10 text-orange-500"
                            : "bg-green-500/10 text-green-500"
                        }`}
                      >
                        {doubt.status === "open" ? "Open" : "Resolved"}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
