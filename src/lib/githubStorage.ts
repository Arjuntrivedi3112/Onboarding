/**
 * GitHub Storage Utility
 * 
 * Provides functions to automatically commit sessions and doubts data to GitHub repository.
 * 
 * SETUP:
 * 1. Create a GitHub Personal Access Token with 'repo' scope
 * 2. Add to .env file: VITE_GITHUB_TOKEN=your_token_here
 * 3. Add to .env file: VITE_GITHUB_OWNER=your_username
 * 4. Add to .env file: VITE_GITHUB_REPO=adtech-explorer-hub
 * 
 * IMPORTANT: Never commit .env file to git (it should be in .gitignore)
 */

import type { Session, Doubt } from "@/components/modules/SessionNotesModule";

interface GitHubConfig {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

// Get GitHub configuration from environment variables
const getGitHubConfig = (): GitHubConfig | null => {
  const token = import.meta.env.VITE_GITHUB_TOKEN;
  const owner = import.meta.env.VITE_GITHUB_OWNER;
  const repo = import.meta.env.VITE_GITHUB_REPO || "adtech-explorer-hub";
  const branch = import.meta.env.VITE_GITHUB_BRANCH || "main";

  if (!token || !owner) {
    console.warn("GitHub auto-commit disabled: Missing VITE_GITHUB_TOKEN or VITE_GITHUB_OWNER in environment variables");
    return null;
  }

  return { token, owner, repo, branch };
};

// Simple per-path commit queue to avoid parallel writes racing the SHA
const commitQueues: Record<string, Promise<boolean>> = {};
// Cache last known SHA per path after successful commits to reduce races
const lastKnownSha: Record<string, string> = {};

const enqueueCommit = async (path: string, task: () => Promise<boolean>): Promise<boolean> => {
  const prev = commitQueues[path] || Promise.resolve(true);
  const next = prev
    .catch(() => {}) // swallow previous failure for chaining
    .then(task);

  // Store the in-flight promise so subsequent calls queue behind it
  commitQueues[path] = next.catch(() => false);
  return next;
};

// Get current file SHA from GitHub (required for updates)
const getFileSha = async (config: GitHubConfig, path: string): Promise<string | null> => {
  try {
    console.log('Fetching file SHA from GitHub:', path);

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}?ref=${config.branch}&ts=${Date.now()}`,
      {
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (!response.ok) {
      console.log('File does not exist yet, will create new:', path);
      return null;
    }

    const data = await response.json();
    console.log('Got file SHA:', data.sha);
    if (data?.sha) {
      lastKnownSha[path] = data.sha;
    }
    return data.sha;
  } catch (error) {
    console.error("Error fetching file SHA:", error);
    return null;
  }
};

// Commit file to GitHub
const commitFile = async (
  config: GitHubConfig,
  path: string,
  content: string,
  message: string,
  sha?: string | null
): Promise<boolean> => {
  try {
    // Base64 encode content - handle Unicode properly
    const base64Content = btoa(unescape(encodeURIComponent(content)));

    const doCommit = async (shaToUse?: string | null) => {
      const body: any = {
        message,
        content: base64Content,
        branch: config.branch,
      };

      if (shaToUse) {
        body.sha = shaToUse;
      }

      console.log('Committing to GitHub:', { path, message, hasSha: !!shaToUse });

      return await fetch(
        `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${config.token}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        }
      );
    };

    let response = await doCommit(sha ?? lastKnownSha[path]);

    // Handle 409 (SHA mismatch) by extracting the expected SHA from error response and retrying once
    if (response.status === 409) {
      let errorDetail: any = {};
      try {
        errorDetail = await response.clone().json();
      } catch (_) {
        errorDetail = {};
      }

      const message: string = errorDetail?.message || "";
      const match = message.match(/does not match ([a-f0-9]{40})/i);
      const expectedSha = match?.[1];

      if (expectedSha && expectedSha !== sha) {
        console.warn('SHA mismatch, retrying with server-reported SHA:', expectedSha);
        response = await doCommit(expectedSha);
      } else {
        console.warn('SHA mismatch with no extractable SHA; fetching latest and retrying once');
        await new Promise((resolve) => setTimeout(resolve, 500));
        const latestSha = await getFileSha(config, path);
        if (latestSha && latestSha !== sha) {
          response = await doCommit(latestSha);
        }
      }
    }

    if (!response.ok) {
      let errorDetail: any = {};
      try {
        errorDetail = await response.clone().json();
      } catch (parseError) {
        errorDetail = { message: 'Failed to parse error response', parseError };
      }
      console.error("GitHub commit failed:", {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
      });
      try {
        console.error("GitHub commit failed (stringified):", JSON.stringify(errorDetail));
      } catch (_) {
        // ignore stringify errors
      }
      return false;
    }

    console.log('Successfully committed to GitHub:', path);
    try {
      const body = await response.clone().json();
      if (body?.content?.sha) {
        lastKnownSha[path] = body.content.sha;
      }
    } catch (_) {
      // ignore parse failures on success
    }
    return true;
  } catch (error) {
    console.error("Error committing to GitHub:", error);
    return false;
  }
};

/**
 * Save sessions to GitHub
 */
export const saveSessionsToGitHub = async (sessions: Session[]): Promise<boolean> => {
  const config = getGitHubConfig();
  if (!config) return false;

  const path = "data/sessions/sessions.json";
  const content = JSON.stringify(sessions, null, 2);
  return enqueueCommit(path, async () => {
    const sha = await getFileSha(config, path);
    return await commitFile(
      config,
      path,
      content,
      `Update sessions data (${sessions.length} sessions)`,
      sha
    );
  });
};

/**
 * Save doubts to GitHub
 */
export const saveDoubtsToGitHub = async (doubts: Doubt[]): Promise<boolean> => {
  const config = getGitHubConfig();
  if (!config) return false;

  const path = "data/sessions/doubts.json";
  const content = JSON.stringify(doubts, null, 2);
  return enqueueCommit(path, async () => {
    const sha = await getFileSha(config, path);
    return await commitFile(
      config,
      path,
      content,
      `Update doubts data (${doubts.length} doubts)`,
      sha
    );
  });
};

/**
 * Save both sessions and doubts in a single operation
 */
export const saveAllToGitHub = async (
  sessions: Session[],
  doubts: Doubt[]
): Promise<{ sessions: boolean; doubts: boolean }> => {
  const [sessionsResult, doubtsResult] = await Promise.all([
    saveSessionsToGitHub(sessions),
    saveDoubtsToGitHub(doubts),
  ]);

  return {
    sessions: sessionsResult,
    doubts: doubtsResult,
  };
};

/**
 * Check if GitHub auto-commit is configured
 */
export const isGitHubConfigured = (): boolean => {
  return getGitHubConfig() !== null;
};

// Convert Blob/File to base64 string (no data URL prefix)
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = reader.result as string;
      const base64 = res.includes(',') ? res.split(',')[1] : res;
      resolve(base64);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(blob);
  });
};

const sanitizeFilename = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 100);
};

/**
 * Upload an image to GitHub under assets/sessions/<sessionId>/
 * Returns the download URL if successful
 */
export const uploadSessionImageToGitHub = async (sessionId: string, file: File): Promise<string | null> => {
  const config = getGitHubConfig();
  if (!config) return null;

  const filename = `${Date.now()}-${sanitizeFilename(file.name)}`;
  const path = `assets/sessions/${sessionId}/${filename}`;
  const base64Content = await blobToBase64(file);

  return enqueueCommit(path, async () => {
    const body: any = {
      message: `Add session image ${filename}`,
      content: base64Content,
      branch: config.branch,
    };

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      let errorDetail: any = {};
      try { errorDetail = await response.clone().json(); } catch {}
      console.error('GitHub image upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
      });
      return null;
    }

    const json = await response.json();
    const url = json?.content?.download_url || `https://raw.githubusercontent.com/${config.owner}/${config.repo}/${config.branch}/${path}`;
    if (json?.content?.sha) {
      lastKnownSha[path] = json.content.sha;
    }
    return url;
  });
};

const extractPathFromRawUrl = (url: string, owner: string, repo: string): string | null => {
  try {
    const u = new URL(url);
    if (u.hostname !== 'raw.githubusercontent.com') return null;
    const parts = u.pathname.split('/').filter(Boolean); // owner/repo/ref/path...
    if (parts.length < 4) return null;
    const [uOwner, uRepo, _ref, ...pathParts] = parts;
    if (uOwner !== owner || uRepo !== repo) return null;
    return pathParts.join('/');
  } catch {
    return null;
  }
};

/**
 * Delete an image file from GitHub given its raw URL
 */
export const deleteSessionImageFromGitHub = async (imageUrl: string): Promise<boolean> => {
  const config = getGitHubConfig();
  if (!config) return false;

  const path = extractPathFromRawUrl(imageUrl, config.owner, config.repo);
  if (!path) {
    console.warn('Could not derive path from imageUrl for deletion:', imageUrl);
    return false;
  }

  return enqueueCommit(path, async () => {
    const sha = await getFileSha(config, path);
    if (!sha) {
      // File not found; treat as success from deletion perspective
      return true;
    }

    const body: any = {
      message: `Delete session image ${path.split('/').pop()}`,
      sha,
      branch: config.branch,
    };

    const response = await fetch(
      `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${path}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      let errorDetail: any = {};
      try { errorDetail = await response.clone().json(); } catch {}
      console.error('GitHub image delete failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorDetail,
      });
      return false;
    }

    return true;
  });
};
