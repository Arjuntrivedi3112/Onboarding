import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import App from "@/App";
import { fakeDb } from "@/demo/fakeSupabase";

function renderAt(path: string) {
  window.history.pushState({}, "", path);
  return render(<App />);
}

describe("signing in", () => {
  it("sends a signed-out visitor to sign-in and back to the page they wanted", async () => {
    fakeDb.signOut();
    fakeDb.passwords["learner@iqm.com"] = "correct horse";
    renderAt("/glossary");

    await screen.findByRole("heading", { level: 1, name: "Sign in" });
    expect(window.location.pathname).toBe("/auth/sign-in");

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "learner@iqm.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "correct horse" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() => expect(window.location.pathname).toBe("/glossary"));
  });

  it("explains a wrong password in plain words", async () => {
    fakeDb.signOut();
    fakeDb.passwords["learner@iqm.com"] = "right";
    renderAt("/auth/sign-in");

    await screen.findByRole("heading", { level: 1, name: "Sign in" });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "learner@iqm.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "wrong" } });
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("That email and password don't match.");
  });
});

describe("first sign-in for an admin-created account", () => {
  it("requires a new password, then a saved recovery code, then onboarding", async () => {
    fakeDb.signInAs({
      email: "new.hire@gmail.com",
      profile: {
        full_name: "New Hire",
        must_change_password: true,
        recovery_code_saved_at: null,
        onboarding_completed_at: null,
        created_via: "admin",
      },
    });
    fakeDb.rpcHandlers.mark_password_changed = () => {
      fakeDb.table("profiles")[0].must_change_password = false;
    };
    fakeDb.rpcHandlers.regenerate_recovery_code = () => "ABCD-EFGH-JKMN";
    fakeDb.rpcHandlers.confirm_recovery_code_saved = () => {
      fakeDb.table("profiles")[0].recovery_code_saved_at = new Date().toISOString();
    };

    renderAt("/dashboard");

    await screen.findByRole("heading", { level: 1, name: "Welcome, New" });
    expect(window.location.pathname).toBe("/auth/set-password");
    fireEvent.change(screen.getByLabelText("New password"), { target: { value: "a-strong-password" } });
    fireEvent.change(screen.getByLabelText("Confirm new password"), { target: { value: "a-strong-password" } });
    fireEvent.click(screen.getByRole("button", { name: "Save password" }));

    await screen.findByRole("heading", { level: 1, name: "Save your recovery code" });
    expect(await screen.findByText("ABCD-EFGH-JKMN")).toBeInTheDocument();
    const cont = screen.getByRole("button", { name: "Continue" });
    expect(cont).toBeDisabled();
    fireEvent.click(screen.getByLabelText(/saved my recovery code/i));
    fireEvent.click(cont);

    await waitFor(() => expect(window.location.pathname).toBe("/welcome"));
  });
});

describe("sign-up", () => {
  it("turns away addresses outside the allowed domain before calling auth", async () => {
    fakeDb.signOut();
    fakeDb.rpcHandlers.can_self_register = ({ p_email }) => String(p_email).endsWith("@iqm.com");
    renderAt("/auth/sign-up");

    await screen.findByRole("heading", { level: 1, name: "Create your account" });
    fireEvent.change(screen.getByLabelText("Full name"), { target: { value: "Outsider" } });
    fireEvent.change(screen.getByLabelText("Work email"), { target: { value: "someone@gmail.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.change(screen.getByLabelText("Confirm password"), { target: { value: "password123" } });
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/Only @iqm.com addresses/);
    expect(fakeDb.session).toBeNull();
  });
});

describe("forgot password", () => {
  it("lets a learner who lost their code ask an admin", async () => {
    fakeDb.signOut();
    let requested = "";
    fakeDb.rpcHandlers.request_password_help = ({ p_email }) => {
      requested = String(p_email);
    };
    renderAt("/auth/forgot-password");

    fireEvent.click(await screen.findByRole("tab", { name: "I lost my code" }));
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "Me@IQM.com" } });
    fireEvent.click(screen.getByRole("button", { name: "Ask an admin" }));

    expect(await screen.findByText("Request sent")).toBeInTheDocument();
    expect(requested).toBe("me@iqm.com");
  });
});

describe("roles", () => {
  it("keeps a learner out of the admin console", async () => {
    renderAt("/admin");
    await waitFor(() => expect(window.location.pathname).toBe("/dashboard"));
  });
});
