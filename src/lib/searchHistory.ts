/**
 * Recent ⌘K search queries — a small convenience so a search someone ran
 * five minutes ago (or yesterday) is one click away instead of retyped.
 * Deliberately separate from progress.ts: this is ephemeral UI convenience,
 * not something that should ever gate or influence learning progress.
 */

const STORAGE_KEY = "adtech-journey-search-history";
const MAX_ENTRIES = 6;
const MIN_QUERY_LENGTH = 2;

function read(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((entry): entry is string => typeof entry === "string");
  } catch {
    return [];
  }
}

function write(entries: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Not persisted this session; harmless, it's a convenience feature.
  }
}

export function getSearchHistory(): string[] {
  return read();
}

/** Records a query, most recent first, deduped, capped at MAX_ENTRIES. */
export function recordSearchQuery(query: string) {
  const trimmed = query.trim();
  if (trimmed.length < MIN_QUERY_LENGTH) return;

  const existing = read().filter((entry) => entry.toLowerCase() !== trimmed.toLowerCase());
  write([trimmed, ...existing].slice(0, MAX_ENTRIES));
}

export function clearSearchHistory() {
  write([]);
}
