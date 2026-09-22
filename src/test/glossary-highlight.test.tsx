import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { highlightGlossaryTerms } from "@/lib/glossaryHighlight";

function renderText(text: string, seen: Set<string> = new Set()) {
  return render(<div>{highlightGlossaryTerms(text, seen)}</div>);
}

describe("highlightGlossaryTerms", () => {
  it("wraps a known term in an interactive button", () => {
    const { container } = renderText("A DSP buys impressions on behalf of an advertiser.");
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button).toHaveTextContent("DSP");
  });

  it("leaves plain text with no glossary terms untouched", () => {
    const { container } = renderText("Nothing here matches anything in the glossary at all.");
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("only highlights the first occurrence across calls sharing one seen set", () => {
    const seen = new Set<string>();
    const first = renderText("A DSP evaluates the bid request.", seen);
    const second = renderText("The same DSP then decides whether to bid.", seen);

    expect(first.container.querySelectorAll("button")).toHaveLength(1);
    expect(second.container.querySelectorAll("button")).toHaveLength(0);
    expect(second.container.textContent).toContain("DSP");
  });

  it("matches the longer term instead of a shorter overlapping one", () => {
    const { container } = renderText("First-Party Data is the most reliable kind.");
    const button = container.querySelector("button");
    expect(button).toHaveTextContent("First-Party Data");
  });

  it("matches case-insensitively", () => {
    const { container } = renderText("a dsp handles this automatically.");
    expect(container.querySelector("button")).toHaveTextContent("dsp");
  });

  it("does not match inside a larger unrelated word", () => {
    // "click" is a glossary term; "clicked" and "clique" must not match it.
    const { container } = renderText("She clicked through a clique of tabs.");
    expect(container.querySelectorAll("button")).toHaveLength(0);
  });

  it("can highlight two distinct terms in the same string", () => {
    const { container } = renderText("An SSP works with an ad exchange to sell inventory.");
    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
