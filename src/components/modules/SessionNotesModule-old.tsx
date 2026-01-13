import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Calendar, Clock, Tag, Download, Github, AlertCircle, CheckCircle2, X } from "lucide-react";
import sessionsData from "../../../data/sessions/sessions.json";
import doubtsData from "../../../data/sessions/doubts.json";
import { saveSessionsToGitHub, saveDoubtsToGitHub, isGitHubConfigured } from "@/lib/githubStorage";
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
    summary: "",
    tags: [],
    overview: "",
    media: [],
    understanding: "",
    outcomes: "",
  });
  const [tagInput, setTagInput] = useState("");
  const { toast } = useToast();

  // Check if GitHub auto-commit is configured
  const githubConfigured = isGitHubConfigured();

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

    const now = new Date();
    const session: Session = {
      id: `s${Date.now()}`,
      title: newSession.title.trim(),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().slice(0, 5),
      summary: newSession.summary.trim(),
      tags: newSession.tags || [],
      overview: newSession.overview || "",
      media: newSession.media || [],
      understanding: newSession.understanding || "",
      outcomes: newSession.outcomes || "",
    };

    const updatedSessions = [session, ...sessions];
    onSessionsChange(updatedSessions);
    await saveToGitHub(updatedSessions);
    
    // Reset form
    setNewSession({
      title: "",
      summary: "",
      tags: [],
      overview: "",
      media: [],
      understanding: "",
      outcomes: "",
    });
    setTagInput("");
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

  // Export current data as JSON for manual commit to GitHub
  const handleExport = () => {
    const dataStr = JSON.stringify(sessions, null, 2);
    const doubtsStr = JSON.stringify(doubts, null, 2);
    
    // Download sessions.json
    const sessionsBlob = new Blob([dataStr], { type: "application/json" });
    const sessionsUrl = URL.createObjectURL(sessionsBlob);
    const sessionsLink = document.createElement("a");
    sessionsLink.href = sessionsUrl;
    sessionsLink.download = "sessions.json";
    sessionsLink.click();
    
    // Download doubts.json
    setTimeout(() => {
      const doubtsBlob = new Blob([doubtsStr], { type: "application/json" });
      const doubtsUrl = URL.createObjectURL(doubtsBlob);
      const doubtsLink = document.createElement("a");
      doubtsLink.href = doubtsUrl;
      doubtsLink.download = "doubts.json";
      doubtsLink.click();
    }, 100);
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
              onClick={() => saveToGitHub(sessions)}
              disabled={isSaving}
              className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center gap-2 disabled:opacity-50"
              title="Manually save to GitHub now"
            >
              <Github className="w-4 h-4" />
              {isSaving ? "Saving..." : "Save Now"}
            </button>
          )}
          <button 
            onClick={handleExport}
            className="px-4 py-2 rounded-lg border hover:bg-muted transition-colors flex items-center gap-2"
            title="Export sessions and doubts as JSON files"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
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
                disabled={!newSession.title?.trim() || !newSession.summary?.trim()}
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
