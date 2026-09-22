import type { ReactNode } from "react";
import { Fragment } from "react";

/**
 * Renders the small subset of markdown the AI explainer's system prompt
 * actually asks for — **bold** and simple lists — as real React elements,
 * never raw HTML. There is no dangerouslySetInnerHTML anywhere in this file;
 * everything the model returns stays plain text run through React's normal
 * escaping, so a response can't inject markup even if it tried to.
 */

/** Splits "some **bold** text" into alternating plain/bold runs. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*)/g).filter((part) => part !== "");

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**") && part.length > 4) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    // A single-line break inside a paragraph (as opposed to the blank line
    // that separates paragraphs, already split out by the caller).
    return (
      <Fragment key={key}>
        {part.split("\n").map((line, j, arr) => (
          <Fragment key={j}>
            {line}
            {j < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </Fragment>
    );
  });
}

const BULLET_LINE = /^\s*[-*]\s+/;
const NUMBERED_LINE = /^\s*\d+[.)]\s+/;

function isListBlock(lines: string[]): "ul" | "ol" | null {
  if (lines.length === 0) return null;
  if (lines.every((line) => BULLET_LINE.test(line))) return "ul";
  if (lines.every((line) => NUMBERED_LINE.test(line))) return "ol";
  return null;
}

export function ChatMarkdown({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/).filter((block) => block.trim() !== "");

  return (
    <div className="space-y-2">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim());
        const listType = isListBlock(lines);

        if (listType === "ul") {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.replace(BULLET_LINE, ""), `${i}-${j}`)}</li>
              ))}
            </ul>
          );
        }

        if (listType === "ol") {
          return (
            <ol key={i} className="list-decimal space-y-1 pl-5">
              {lines.map((line, j) => (
                <li key={j}>{renderInline(line.replace(NUMBERED_LINE, ""), `${i}-${j}`)}</li>
              ))}
            </ol>
          );
        }

        return <p key={i}>{renderInline(block, `${i}`)}</p>;
      })}
    </div>
  );
}
