/**
 * Finds the element in a lesson's rendered body whose text contains a given
 * snippet, scrolls it into view, and gives it a brief highlight — the "jump
 * directly there" half of content search. The snippet comes from the
 * build-time search index (scripts/build-search-index.mjs), so it's the
 * lesson's real prose; this just has to locate where that prose landed in
 * the live DOM.
 */

const CANDIDATE_SELECTOR = "p, li, h2, h3, h4, blockquote, td, dt, dd, figcaption";
const HIGHLIGHT_MS = 2200;

function normalize(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * The needle is truncated in the index (MAX_SNIPPET_LENGTH), so match on a
 * prefix rather than requiring the whole string — long enough to be
 * specific, short enough to survive that truncation.
 */
function matchKey(text: string): string {
  return normalize(text).slice(0, 80);
}

export function scrollToRenderedText(root: HTMLElement, needle: string): boolean {
  const key = matchKey(needle);
  if (key.length < 8) return false;

  const candidates = Array.from(root.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR));
  // Prefer the most specific (shortest matching) element, so a match inside
  // a list item highlights the item, not an ancestor that happens to also
  // contain that text via its other children.
  let best: HTMLElement | null = null;
  let bestLength = Infinity;

  for (const el of candidates) {
    const text = normalize(el.textContent ?? "");
    if (text.includes(key) && text.length < bestLength) {
      best = el;
      bestLength = text.length;
    }
  }

  if (!best) return false;

  best.scrollIntoView({ behavior: "smooth", block: "center" });
  flashHighlight(best);
  return true;
}

function flashHighlight(el: HTMLElement) {
  el.classList.add("search-highlight");
  window.setTimeout(() => el.classList.remove("search-highlight"), HIGHLIGHT_MS);
}
