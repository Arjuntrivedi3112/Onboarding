import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { fakeDb } from "@/demo/fakeSupabase";
import { SIMULATIONS } from "@/simulations/registry";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("onboarding", () => {
  it("builds a path from team, comfort and pace, then lands on the dashboard", async () => {
    fakeDb.signInAs({ profile: { full_name: "Nia Okoro", onboarding_completed_at: null, tour_completed_at: null, team: null } });
    renderAt("/dashboard");

    await screen.findByRole("heading", { level: 1, name: "Welcome, Nia." });
    fireEvent.click(screen.getByRole("button", { name: /build my path/i }));

    await screen.findByRole("heading", { name: "A little about you" });
    const next = screen.getByRole("button", { name: "Continue" });
    expect(next).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "AdOps" }));
    fireEvent.click(next);

    await screen.findByRole("heading", { name: "What do you already know?" });
    const foundations = screen.getByRole("radiogroup", { name: /Comfort with Part I —/i });
    fireEvent.click(within(foundations).getByRole("radio", { name: "Could teach it" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "How much time can you give it?" });
    fireEvent.click(screen.getByRole("button", { name: /Focused/ }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await screen.findByRole("heading", { name: "Your path" });
    expect(screen.getAllByText("Key for AdOps").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: "Start learning" }));

    await waitFor(() => expect(window.location.pathname).toBe("/dashboard"));
    const saved = fakeDb.table("profiles")[0];
    expect(saved).toMatchObject({ team: "AdOps", weekly_minutes_goal: 120 });
    expect(saved.onboarding_completed_at).toBeTruthy();
    expect((saved.learning_path as { focus: Record<string, string> }).focus.basics).toBe("skim");
  });
});

describe("dashboard", () => {
  it("greets by name and lists open assignments", async () => {
    fakeDb.table("assignments").push({
      id: "a1",
      target_type: "simulation",
      target_id: "rtb-auction",
      due_date: "2099-01-01",
      note: "Before Friday's standup",
      created_at: new Date().toISOString(),
    });
    renderAt("/dashboard");
    await screen.findByRole("heading", { level: 1, name: /Welcome, Test/ });
    expect(await screen.findByText("Simulator: The 100-millisecond auction")).toBeInTheDocument();
    expect(screen.getByText("Before Friday's standup")).toBeInTheDocument();
  });
});

describe("account pages", () => {
  it("renders the profile with a badge shelf", async () => {
    renderAt("/profile");
    await screen.findByRole("heading", { level: 1, name: "Test Learner" });
    expect(screen.getByRole("heading", { name: "Badges" })).toBeInTheDocument();
    expect(screen.getByText("First steps")).toBeInTheDocument();
  });

  it("keeps the certificate locked until the book is finished", async () => {
    renderAt("/certificate");
    await screen.findByRole("heading", { level: 1, name: "Your certificate" });
    expect(screen.getByText(/to go/)).toBeInTheDocument();
    expect(screen.queryByText("Certificate of completion")).not.toBeInTheDocument();
  });
});

describe("simulation lab", () => {
  it("lists every simulator", async () => {
    renderAt("/lab");
    await screen.findByRole("heading", { level: 1, name: "Learn it by running it" });
    for (const sim of SIMULATIONS) expect(screen.getByText(sim.title)).toBeInTheDocument();
  });

  it("opens a simulator and records the visit", async () => {
    let opened = "";
    fakeDb.rpcHandlers.record_sim_open = ({ p_sim_id }) => {
      opened = String(p_sim_id);
    };
    renderAt("/lab/rtb-auction");
    await screen.findByRole("heading", { level: 1, name: "The 100-millisecond auction" });
    expect(await screen.findByText("Win it for Beta")).toBeInTheDocument();
    await waitFor(() => expect(opened).toBe("rtb-auction"));
  });

  it("sends unknown simulators back to the gallery", async () => {
    renderAt("/lab/not-a-sim");
    await waitFor(() => expect(window.location.pathname).toBe("/lab"));
  });
});

describe("legacy team names", () => {
  it("tells someone whose saved team is no longer offered, and keeps showing it on the profile", async () => {
    fakeDb.signInAs({ profile: { team: "Engineering" } });
    renderAt("/dashboard");
    expect(await screen.findByText(/saved as “Engineering”/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Update my team" })).toHaveAttribute("href", "/welcome");
  });

  it("does not nag people on a current team", async () => {
    fakeDb.signInAs({ profile: { team: "QA" } });
    renderAt("/dashboard");
    await screen.findByRole("heading", { level: 1, name: /Welcome/ });
    expect(screen.queryByText(/no longer on the team list/)).not.toBeInTheDocument();
  });
});
