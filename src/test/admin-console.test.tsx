import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import App from "@/App";
import { fakeDb } from "@/demo/fakeSupabase";
import { seedDemo } from "@/demo/seed";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("admin console", () => {
  beforeEach(() => {
    // The demo seed signs in as an admin with a believable team.
    seedDemo(fakeDb);
  });

  it("renders every admin page", async () => {
    const pages: Array<[string, string]> = [
      ["/admin", "Overview"],
      ["/admin/people", "People"],
      ["/admin/add", "Add people"],
      ["/admin/cohorts", "Cohorts"],
      ["/admin/content", "Content insights"],
      ["/admin/questions", "AI questions"],
      ["/admin/password-help", "Password help"],
      ["/admin/announcements", "Announcements"],
    ];
    for (const [path, heading] of pages) {
      const { unmount } = renderAt(path);
      expect(await screen.findByRole("heading", { level: 1, name: heading }), path).toBeInTheDocument();
      unmount();
    }
  });

  it("surfaces who needs a hand on the overview", async () => {
    renderAt("/admin");
    await screen.findByRole("heading", { level: 1, name: "Overview" });
    const card = (await screen.findByRole("heading", { name: /Needs a hand/ })).closest("section")!;
    expect(within(card).getByText("Tom Becker")).toBeInTheDocument();
    expect(within(card).getByText("Never signed in")).toBeInTheDocument();
  });

  it("filters people and opens a person", async () => {
    renderAt("/admin/people");
    await screen.findByRole("heading", { level: 1, name: "People" });
    fireEvent.change(screen.getByPlaceholderText("Search name, email or team"), { target: { value: "marcus" } });
    expect(screen.queryByText("Priya Shah")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("link", { name: "Marcus Lee" }));
    expect(await screen.findByRole("heading", { level: 1, name: "Marcus Lee" })).toBeInTheDocument();
    expect(screen.getByText("Every lesson")).toBeInTheDocument();
  });

  it("creates accounts and shows the generated passwords once", async () => {
    renderAt("/admin/add");
    await screen.findByRole("heading", { level: 1, name: "Add people" });
    fireEvent.change(screen.getByLabelText("People"), { target: { value: "new.person@partner.com\nGrace <grace@iqm.com>" } });
    fireEvent.click(screen.getByRole("button", { name: /Create 2 accounts/ }));
    expect(await screen.findByText("Share these sign-in details")).toBeInTheDocument();
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("new.person@partner.com")).toBeInTheDocument();
    expect(fakeDb.table("profiles").find((p) => p.email === "grace@iqm.com")).toMatchObject({ full_name: "Grace", must_change_password: true });
  });

  it("generates a new password for someone who asked for help", async () => {
    renderAt("/admin/password-help");
    await screen.findByRole("heading", { level: 1, name: "Password help" });
    fireEvent.click(await screen.findByRole("button", { name: /Generate new password/ }));
    expect(await screen.findByText("Share these sign-in details")).toBeInTheDocument();
    await waitFor(() => expect(fakeDb.table("password_reset_requests")[0].status).toBe("resolved"));
  });
});

describe("admin usability", () => {
  beforeEach(() => seedDemo(fakeDb));

  it("hints that wide tables scroll sideways", async () => {
    renderAt("/admin/people");
    await screen.findByRole("heading", { level: 1, name: "People" });
    expect(screen.getByText(/Swipe sideways to see every column/)).toBeInTheDocument();
  });

  it("asks admins to include names when they paste only emails", async () => {
    renderAt("/admin/add");
    await screen.findByRole("heading", { level: 1, name: "Add people" });
    fireEvent.change(screen.getByLabelText("People"), { target: { value: "a@iqm.com\nB Person <b@iqm.com>" } });
    expect(screen.getByText(/1 without a name/)).toBeInTheDocument();
  });
});
