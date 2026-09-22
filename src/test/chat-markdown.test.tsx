import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMarkdown } from "@/components/ai/ChatMarkdown";

describe("ChatMarkdown", () => {
  it("renders **bold** as a real <strong>, with no literal asterisks visible", () => {
    const { container } = render(
      <ChatMarkdown text="**LinkedIn** is treated as a **channel** (the where it travels) just like Facebook or Google." />
    );

    const strongs = container.querySelectorAll("strong");
    expect(strongs).toHaveLength(2);
    expect(strongs[0]).toHaveTextContent("LinkedIn");
    expect(strongs[1]).toHaveTextContent("channel");
    expect(container.textContent).not.toContain("*");
  });

  it("renders the exact reported example correctly", () => {
    const text =
      '**LinkedIn** is treated as a **channel** (the “where it travels”) just like Facebook or Google. When a LinkedIn ad is clicked, the landing‑page URL usually carries **UTM parameters** (e.g.';
    const { container } = render(<ChatMarkdown text={text} />);

    expect(container.querySelectorAll("strong")).toHaveLength(3);
    expect(container.textContent).not.toMatch(/\*/);
    expect(screen.getByText("UTM parameters").tagName).toBe("STRONG");
  });

  it("renders plain text with no markdown unchanged, no stray elements", () => {
    const { container } = render(<ChatMarkdown text="A perfectly ordinary sentence." />);
    expect(container.textContent).toBe("A perfectly ordinary sentence.");
    expect(container.querySelectorAll("strong")).toHaveLength(0);
  });

  it("renders separate paragraphs for blank-line-separated blocks", () => {
    const { container } = render(<ChatMarkdown text={"First paragraph.\n\nSecond paragraph."} />);
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs).toHaveLength(2);
    expect(paragraphs[0]).toHaveTextContent("First paragraph.");
    expect(paragraphs[1]).toHaveTextContent("Second paragraph.");
  });

  it("renders a bullet list as a real <ul>/<li>, not literal dashes", () => {
    const { container } = render(
      <ChatMarkdown text={"- First point\n- Second point\n- Third point"} />
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("First point");
    expect(container.textContent).not.toMatch(/^-/m);
  });

  it("renders a numbered list as a real <ol>/<li>", () => {
    const { container } = render(<ChatMarkdown text={"1. Step one\n2. Step two"} />);
    expect(container.querySelector("ol")).not.toBeNull();
    expect(container.querySelectorAll("li")).toHaveLength(2);
  });

  it("renders bold inside a list item", () => {
    const { container } = render(<ChatMarkdown text={"- A **DSP** buys impressions"} />);
    const item = container.querySelector("li");
    expect(item?.querySelector("strong")).toHaveTextContent("DSP");
  });

  it("preserves a single line break within a paragraph as <br>", () => {
    const { container } = render(<ChatMarkdown text={"Line one\nLine two"} />);
    expect(container.querySelector("br")).not.toBeNull();
  });

  it("does not crash or mis-render on an unclosed ** (mid-stream text)", () => {
    const { container } = render(<ChatMarkdown text="This is **still typing" />);
    expect(container.textContent).toContain("This is **still typing");
  });
});
