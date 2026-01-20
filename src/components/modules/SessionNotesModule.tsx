import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, Tag, AlertCircle, CheckCircle2, X, Trash2, Image as ImageIcon, RefreshCw } from "lucide-react";
import sessionsData from "../../../data/sessions/sessions.json";
import doubtsData from "../../../data/sessions/doubts.json";
import { saveSessionsToGitHub, saveDoubtsToGitHub, isGitHubConfigured, uploadSessionImageToGitHub, loadSessionsFromGitHub, loadDoubtsFromGitHub } from "@/lib/githubStorage";
import { useToast } from "@/hooks/use-toast";

// Session type definition - extensible structure for future features
interface Session {
  id: string;
  title: string;
  date: string; // ISO date string
  time: string;
  summary: string; // One-line takeaway
  tags: string[];
  overview: string; // Rich text overview
  media: string[]; // Array of image URLs
  understanding: string; // Main learning section
  outcomes: string; // Optional actionables
}

// Doubt type - shared across all users, no authentication
interface Doubt {
  id: string;
  sessionId: string;
  text: string;
  createdAt: string; // ISO timestamp
  status: "open" | "resolved";
}

/**
 * DATA STORAGE APPROACH: GitHub Repository
 * 
 * Sessions and doubts are stored as JSON files in /data/sessions/ directory.
 * 
 * WORKFLOWS:
 * 
 * 1. MANUAL (Current):
 *    - Create/edit sessions in the app
 *    - Click "Export" button to download JSON files
 *    - Replace files in data/sessions/ directory
 *    - Commit and push to GitHub
 *    - Refresh app to load updated data
 * 
 * 2. AUTOMATED (Optional - requires GitHub API setup):
 *    - Add VITE_GITHUB_TOKEN to environment
 *    - App commits changes directly via GitHub API
 *    - See mcp_github_create_or_update_file tool for implementation
 * 
 * BENEFITS:
 * - Version control and full history
 * - Collaboration via pull requests
 * - No database costs
 * - Data lives with code
 * - Easy backup and export
 */

// Load sessions from GitHub repo JSON files
const INITIAL_SESSIONS: Session[] = sessionsData as Session[];
const INITIAL_DOUBTS: Doubt[] = doubtsData as Doubt[];

interface SessionNotesModuleProps {
  onSelectSession?: (sessionId: string) => void;
  sessions: Session[];
  doubts: Doubt[];
  onSessionsChange: (sessions: Session[]) => void;
  onDoubtsChange: (doubts: Doubt[]) => void;
}

export function SessionNotesModule({ onSelectSession, sessions, doubts, onSessionsChange, onDoubtsChange }: SessionNotesModuleProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSession, setNewSession] = useState<Partial<Session>>({
    title: "",
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    summary: "",
    tags: [],
    overview: "",
    media: [],
    understanding: "",
    outcomes: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const { toast } = useToast();

  // Check if GitHub auto-commit is configured
  const githubConfigured = isGitHubConfigured();

  const handleDeleteSession = async (sessionId: string) => {
    const filteredSessions = sessions.filter((session) => session.id !== sessionId);
    const filteredDoubts = doubts.filter((doubt) => doubt.sessionId !== sessionId);

    onSessionsChange(filteredSessions);
    onDoubtsChange(filteredDoubts);

    if (!githubConfigured) {
      toast({
        title: "Session deleted",
        description: "GitHub auto-commit is disabled; export to persist.",
      });
      return;
    }

    setIsSaving(true);
    // Save sequentially to avoid any cross-file race conditions
    const sessionsSaved = await saveSessionsToGitHub(filteredSessions);
    const doubtsSaved = sessionsSaved ? await saveDoubtsToGitHub(filteredDoubts) : false;
    setIsSaving(false);

    if (sessionsSaved && doubtsSaved) {
      toast({
        title: "Session deleted",
        description: "Changes committed to GitHub.",
      });
    } else {
      toast({
        title: "Delete failed",
        description: "Could not commit changes to GitHub.",
        variant: "destructive",
      });
    }
  };

  // Create new session
  const handleCreateSession = async () => {
    if (!newSession.title?.trim() || !newSession.summary?.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and summary are required.",
        variant: "destructive",
      });
      return;
    }

    let session: Session = {
      id: `s${Date.now()}`,
      title: newSession.title.trim(),
      date: (newSession.date || new Date().toISOString().split('T')[0]) as string,
      time: (newSession.time || new Date().toTimeString().slice(0, 5)) as string,
      summary: newSession.summary.trim(),
      tags: newSession.tags || [],
      overview: newSession.overview || "",
      media: [],
      understanding: newSession.understanding || "",
      outcomes: newSession.outcomes || "",
    };

    // Upload any selected images to GitHub and attach URLs
    if (pendingImages.length > 0 && githubConfigured) {
      setIsSaving(true);
      const uploadResults = await Promise.all(
        pendingImages.map((file) => uploadSessionImageToGitHub(session.id, file))
      );
      const urls = uploadResults.filter((u): u is string => !!u);
      session = { ...session, media: urls };
      setIsSaving(false);
    } else if (pendingImages.length > 0 && !githubConfigured) {
      toast({
        title: "GitHub not configured",
        description: "Images won't be uploaded. Configure GitHub or add later.",
        variant: "destructive",
      });
    }

    const updatedSessions = [session, ...sessions];
    onSessionsChange(updatedSessions);
    await saveToGitHub(updatedSessions);
    
    // Reset form
    setNewSession({
      title: "",
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      summary: "",
      tags: [],
      overview: "",
      media: [],
      understanding: "",
      outcomes: "",
    });
    setTagInput("");
    setPendingImages([]);
    setShowCreateModal(false);
    
    toast({
      title: "Session Created",
      description: "Your session has been created successfully.",
    });
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim() && !newSession.tags?.includes(tagInput.trim())) {
      setNewSession(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput("");
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    setNewSession(prev => ({
      ...prev,
      tags: (prev.tags || []).filter(t => t !== tag)
    }));
  };

  // Auto-save to GitHub when sessions change
  const saveToGitHub = async (updatedSessions: Session[]) => {
    if (!githubConfigured) return;
    
    setIsSaving(true);
    const success = await saveSessionsToGitHub(updatedSessions);
    setIsSaving(false);

    if (success) {
      toast({
        title: "Saved to GitHub",
        description: "Sessions automatically committed to repository.",
      });
    } else {
      toast({
        title: "Save failed",
        description: "Could not commit to GitHub. Check console for errors.",
        variant: "destructive",
      });
    }
  };

  // Refresh sessions from GitHub
  const refreshFromGitHub = async () => {
    if (!githubConfigured) {
      toast({
        title: "GitHub not configured",
        description: "Please set up GitHub environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    toast({
      title: "Refreshing...",
      description: "Loading latest data from GitHub.",
    });

    try {
      const [loadedSessions, loadedDoubts] = await Promise.all([
        loadSessionsFromGitHub(),
        loadDoubtsFromGitHub(),
      ]);

      if (loadedSessions) {
        onSessionsChange(loadedSessions);
      }
      if (loadedDoubts) {
        onDoubtsChange(loadedDoubts);
      }

      if (loadedSessions || loadedDoubts) {
        toast({
          title: "Refreshed!",
          description: `Loaded ${loadedSessions?.length || 0} sessions from GitHub.`,
        });
      } else {
        toast({
          title: "Refresh failed",
          description: "Could not load data from GitHub. Check console.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('[SessionNotesModule] Refresh error:', error);
      toast({
        title: "Refresh failed",
        description: "An error occurred while refreshing.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold">Session Notes</h2>
            {githubConfigured ? (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-500 border border-green-500/20">
                <CheckCircle2 className="w-3 h-3" />
                Auto-commit enabled
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-orange-500/10 text-orange-500 border border-orange-500/20">
                <AlertCircle className="w-3 h-3" />
                Manual export only
              </div>
            )}
          </div>
          <p className="text-muted-foreground">Record and revisit your learning sessions over time.</p>
        </div>
        <div className="flex items-center gap-2">
          {githubConfigured && (
            <button 
              onClick={refreshFromGitHub}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg bg-muted text-foreground flex items-center gap-2 hover:bg-muted/80 transition-colors disabled:opacity-50"
              title="Refresh from GitHub"
            >
              <RefreshCw className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          )}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground flex items-center gap-2 hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4" />
            New Session
          </button>
        </div>
      </div>

      {/* Session list - sorted by most recent */}
      <div className="space-y-4">
        {sessions.map((session) => (
          <motion.div
            key={session.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.01 }}
            className="p-6 border rounded-lg bg-card cursor-pointer hover:border-primary/50 transition-all"
            onClick={() => onSelectSession?.(session.id)}
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold">{session.title}</h3>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(session.date)}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {session.time}
                </div>
                {/* Upload image for this session */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const input = document.getElementById(`session-upload-${session.id}`) as HTMLInputElement | null;
                    input?.click();
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  title="Upload image to this session"
                  disabled={isSaving}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <input
                  id={`session-upload-${session.id}`}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onClick={(e) => e.stopPropagation()}
                  onChange={async (e) => {
                    e.stopPropagation();
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (!githubConfigured) {
                      toast({
                        title: "GitHub not configured",
                        description: "Set up GitHub env vars to upload.",
                        variant: "destructive",
                      });
                      e.currentTarget.value = "";
                      return;
                    }
                    setIsSaving(true);
                    const url = await uploadSessionImageToGitHub(session.id, file);
                    setIsSaving(false);
                    e.currentTarget.value = "";
                    if (!url) {
                      toast({
                        title: "Upload failed",
                        description: "Could not upload image to GitHub.",
                        variant: "destructive",
                      });
                      return;
                    }

                    const updatedSessions = sessions.map((s) => s.id === session.id ? { ...s, media: [...s.media, url] } : s);
                    onSessionsChange(updatedSessions);
                    const ok = await saveSessionsToGitHub(updatedSessions);
                    toast({
                      title: ok ? "Image uploaded" : "Saved locally",
                      description: ok ? "Added to session and committed to GitHub." : "Failed to commit sessions.json.",
                      variant: ok ? undefined : "destructive",
                    });
                  }}
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteSession(session.id);
                  }}
                  className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                  title="Delete session"
                  disabled={isSaving}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{session.summary}</p>

            {/* Tags */}
            {session.tags.length > 0 && (
              <div className="flex items-center gap-2">
                <Tag className="w-3 h-3 text-muted-foreground" />
                <div className="flex flex-wrap gap-2">
                  {session.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No sessions yet. Create your first session to start tracking your learning journey.</p>
        </div>
      )}

      {/* Create Session Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Create New Session</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-lg hover:bg-muted transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Title *</label>
                <input
                  type="text"
                  value={newSession.title || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Understanding DSP Architecture"
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Date *</label>
                <input
                  type="date"
                  value={(newSession.date as string) || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Time *</label>
                <input
                  type="time"
                  value={(newSession.time as string) || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, time: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Summary *</label>
                <input
                  type="text"
                  value={newSession.summary || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, summary: e.target.value }))}
                  placeholder="One-line takeaway from this session"
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Tags</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                    placeholder="Add tag and press Enter"
                    className="flex-1 px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm"
                  />
                  <button
                    onClick={addTag}
                    className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
                  >
                    Add
                  </button>
                </div>
                {newSession.tags && newSession.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {newSession.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-primary/80">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Overview</label>
                <textarea
                  value={newSession.overview || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, overview: e.target.value }))}
                  placeholder="What did this session cover?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Images (optional)</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    if (files.length) {
                      setPendingImages((prev) => [...prev, ...files]);
                    }
                    e.currentTarget.value = "";
                  }}
                  className="block text-sm"
                />
                {pendingImages.length > 0 && (
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {pendingImages.map((file, idx) => (
                      <div key={idx} className="relative border rounded-md overflow-hidden">
                        <img src={URL.createObjectURL(file)} alt={file.name} className="object-cover w-full h-24" />
                        <button
                          type="button"
                          className="absolute top-1 right-1 px-2 py-1 text-xs rounded-md bg-background/80 border"
                          onClick={() => setPendingImages((prev) => prev.filter((_, i) => i !== idx))}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Understanding / Mental Model</label>
                <textarea
                  value={newSession.understanding || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, understanding: e.target.value }))}
                  placeholder="What did you learn? Capture your mental model..."
                  rows={5}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm resize-none"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">Outcomes / Actionables</label>
                <textarea
                  value={newSession.outcomes || ""}
                  onChange={(e) => setNewSession(prev => ({ ...prev, outcomes: e.target.value }))}
                  placeholder="What changed? What to revisit?"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-muted border border-border focus:border-primary focus:outline-none text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSession.title?.trim() || !newSession.summary?.trim() || !newSession.date || !newSession.time}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
              >
                Create Session
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

// Export session and doubt data/functions for use in detail view
export { INITIAL_SESSIONS as MOCK_SESSIONS, INITIAL_DOUBTS as MOCK_DOUBTS };
export type { Session, Doubt };
