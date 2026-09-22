/**
 * Picks the book excerpts most relevant to a chat question, so the AI
 * explainer answers from the actual book first and only falls back to
 * general knowledge when the book doesn't cover something.
 *
 * Reuses the same content index the command palette searches
 * (public/search-index.json, built from every lesson's real prose by
 * scripts/build-search-index.mjs) rather than a second, separate source of
 * truth for "what the book says".
 */

export interface ContentSnippet {
  sectionId: string;
  slug: string;
  lessonId: string;
  lessonTitle: string;
  sectionTitle: string;
  heading: string | null;
  text: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "and", "or", "but", "if", "of", "to", "in", "on", "for", "with", "as",
  "by", "at", "from", "that", "this", "these", "those", "it", "its",
  "what", "how", "why", "when", "where", "who", "does", "do", "did",
  "can", "could", "would", "should", "explain", "tell", "me", "like",
  "i'm", "im", "new", "about", "please", "you", "your",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

/**
 * Scores every snippet by how many distinct query terms it contains, so a
 * question like "how does header bidding work" ranks a snippet mentioning
 * both "header" and "bidding" above one mentioning only "bidding".
 */
export function pickRelevantExcerpts(
  index: ContentSnippet[],
  query: string,
  limit = 6
): ContentSnippet[] {
  const terms = [...new Set(tokenize(query))];
  if (terms.length === 0) return [];

  const scored: { snippet: ContentSnippet; score: number }[] = [];
  for (const snippet of index) {
    const haystack = `${snippet.heading ?? ""} ${snippet.text}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += 1;
    }
    if (score > 0) scored.push({ snippet, score });
  }

  scored.sort((a, b) => b.score - a.score || a.snippet.text.length - b.snippet.text.length);
  return scored.slice(0, limit).map((s) => s.snippet);
}

/** Formats excerpts as the block dropped into the system prompt. */
export function formatBookContext(excerpts: ContentSnippet[]): string {
  if (excerpts.length === 0) return "";

  const lines = excerpts.map(
    (e) => `- [${e.lessonTitle}${e.heading ? ` — ${e.heading}` : ""}] ${e.text}`
  );

  return `Excerpts from the AdTech Book, retrieved for this question:\n${lines.join("\n")}`;
}
