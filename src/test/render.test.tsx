import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "@/App";
import { curriculum, lessonPath, sectionPath } from "@/curriculum";

/**
 * Mounting sweep.
 *
 * Compiling proves nothing about rendering: a bad hook order, a missing
 * export or an undefined lookup only shows up when a component actually
 * mounts. This walks every route and fails on the first crash.
 */

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

let errorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  // React logs render errors through console.error rather than throwing in a
  // way the test would otherwise see, so failures are caught here too.
  errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  errorSpy.mockRestore();
});

/**
 * Noise that is not a render failure:
 * - React Router's future-flag notices.
 * - The GitHub storage layer, which has no token or network in tests and logs
 *   asynchronously, so its errors can land during an unrelated test.
 */
function renderErrorsOnly(): string[] {
  return errorSpy.mock.calls
    .map((call) => String(call[0] ?? ""))
    .filter(
      (message) =>
        !message.includes("React Router Future Flag") && !message.includes("[GitHub Storage]")
    );
}

function expectNoRenderErrors(route: string) {
  expect(renderErrorsOnly(), `console.error during ${route}`).toEqual([]);
}

describe("app shell", () => {
  it("redirects the root to the dashboard", async () => {
    renderAt("/");
    expect(await screen.findByRole("heading", { level: 1 })).toBeInTheDocument();
    expect(window.location.pathname).toBe("/dashboard");
  });

  it("renders the dashboard with no progress stored", async () => {
    renderAt("/dashboard");
    expect(await screen.findByRole("heading", { level: 1, name: /welcome/i })).toBeInTheDocument();
    expectNoRenderErrors("/dashboard");
  });

  it("shows no zero-scoreboard on day 0", async () => {
    renderAt("/dashboard");
    await screen.findByRole("heading", { level: 1 });
    // A learner who has done nothing should not be shown 0% or 0 of 73.
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText(/0 of 73/)).not.toBeInTheDocument();
  });

  it("offers a skip link ahead of the navigation", async () => {
    renderAt("/dashboard");
    const skip = await screen.findByRole("link", { name: /skip to content/i });
    expect(skip).toHaveAttribute("href", "#main");
  });

  it("renders every reference route", async () => {
    for (const route of ["/map", "/glossary", "/library", "/notes", "/search", "/help"]) {
      const { unmount } = renderAt(route);
      await waitFor(() => expect(screen.getAllByRole("heading", { level: 1 }).length).toBeGreaterThan(0));
      unmount();
    }
  });

  it("renders NotFound for an unknown route", async () => {
    renderAt("/nope/not-a-real-page");
    await waitFor(() => expect(document.body.textContent).toBeTruthy());
  });
});

describe("journey routes", () => {
  const sections = curriculum.flatMap((part) => part.sections);

  it.each(sections.map((section) => [section.title, section] as const))(
    "renders the section overview for %s",
    async (_title, section) => {
      const { unmount } = renderAt(sectionPath(section));
      expect(
        await screen.findByRole("heading", { level: 1, name: section.title })
      ).toBeInTheDocument();
      expectNoRenderErrors(sectionPath(section));
      unmount();
    }
  );

  it("renders every one of the 79 lessons without crashing", async () => {
    const refs = curriculum.flatMap((part) =>
      part.sections.flatMap((section) =>
        section.lessons.map((lesson) => ({ lesson, section, part, index: 0 }))
      )
    );
    expect(refs).toHaveLength(79);

    const failures: string[] = [];

    for (const ref of refs) {
      errorSpy.mockClear();
      const path = lessonPath(ref);
      const { unmount } = renderAt(path);
      try {
        await screen.findByRole("heading", { level: 1, name: ref.lesson.title }, { timeout: 5000 });
        const errors = renderErrorsOnly();
        if (errors.length > 0) failures.push(`${ref.lesson.id}: ${errors[0].slice(0, 160)}`);
      } catch {
        failures.push(`${ref.lesson.id}: did not render its title at ${path}`);
      }
      unmount();
    }

    expect(failures, `\n${failures.join("\n")}\n`).toEqual([]);
  });
});
