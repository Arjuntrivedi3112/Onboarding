import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ThemeToggle } from "@/components/journey/ThemeToggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("starts on system (no stored preference, no data-theme attribute)", () => {
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });

  it("cycles system -> light -> dark -> system on repeated clicks", () => {
    render(<ThemeToggle />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
    expect(localStorage.getItem("theme-preference")).toBe("light");

    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    expect(localStorage.getItem("theme-preference")).toBe("dark");

    fireEvent.click(button);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
    expect(localStorage.getItem("theme-preference")).toBeNull();
  });

  it("reads an existing stored preference on mount", () => {
    localStorage.setItem("theme-preference", "dark");
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("ignores a corrupt stored value rather than crashing", () => {
    localStorage.setItem("theme-preference", "not-a-real-theme");
    render(<ThemeToggle />);
    expect(document.documentElement.getAttribute("data-theme")).toBeNull();
  });
});
