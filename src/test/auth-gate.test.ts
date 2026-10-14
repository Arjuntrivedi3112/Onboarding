import { describe, expect, it } from "vitest";

import { gateRedirect, pendingStep, safeNext, type GateProfile } from "@/lib/auth/gate";

const ready: GateProfile = {
  must_change_password: false,
  recovery_code_saved_at: "2026-10-01T00:00:00Z",
  onboarding_completed_at: "2026-10-01T00:00:00Z",
};

const signedIn = (profile: Partial<GateProfile> = {}, isAdmin = false) => ({
  status: "signed_in" as const,
  profile: { ...ready, ...profile },
  isAdmin,
});

describe("account gate", () => {
  it("waits while the session loads", () => {
    expect(gateRedirect({ status: "loading", profile: null, isAdmin: false }, "/dashboard")).toBeNull();
  });

  it("sends signed-out visitors to sign-in, remembering where they were going", () => {
    const out = { status: "signed_out" as const, profile: null, isAdmin: false };
    expect(gateRedirect(out, "/learn/basics", "?x=1")).toBe("/auth/sign-in?next=%2Flearn%2Fbasics%3Fx%3D1");
    expect(gateRedirect(out, "/")).toBe("/auth/sign-in");
    expect(gateRedirect(out, "/auth/sign-up")).toBeNull();
    expect(gateRedirect(out, "/auth/forgot-password")).toBeNull();
    expect(gateRedirect(out, "/auth/set-password")).toBe("/auth/sign-in?next=%2Fauth%2Fset-password");
  });

  it("walks new accounts through password, recovery code, then onboarding", () => {
    expect(pendingStep({ ...ready, must_change_password: true, recovery_code_saved_at: null })).toBe("/auth/set-password");
    expect(pendingStep({ ...ready, recovery_code_saved_at: null, onboarding_completed_at: null })).toBe("/auth/recovery-code");
    expect(pendingStep({ ...ready, onboarding_completed_at: null })).toBe("/welcome");
    expect(pendingStep(ready)).toBeNull();

    const fresh = signedIn({ must_change_password: true });
    expect(gateRedirect(fresh, "/dashboard")).toBe("/auth/set-password");
    expect(gateRedirect(fresh, "/admin")).toBe("/auth/set-password");
    expect(gateRedirect(fresh, "/auth/set-password")).toBeNull();
  });

  it("forwards a signed-in learner away from sign-in, honouring a safe ?next=", () => {
    expect(gateRedirect(signedIn(), "/auth/sign-in", "?next=%2Flearn%2Fbasics")).toBe("/learn/basics");
    expect(gateRedirect(signedIn(), "/auth/sign-in", "?next=https%3A%2F%2Fevil.example")).toBe("/dashboard");
    expect(gateRedirect(signedIn(), "/auth/sign-in", "?next=%2F%2Fevil.example")).toBe("/dashboard");
    expect(gateRedirect(signedIn(), "/auth/recovery-code")).toBe("/dashboard");
  });

  it("keeps learners out of the admin console", () => {
    expect(gateRedirect(signedIn(), "/admin/users")).toBe("/dashboard");
    expect(gateRedirect(signedIn({}, true), "/admin/users")).toBeNull();
  });

  it("lets onboarded learners revisit the welcome flow", () => {
    expect(gateRedirect(signedIn(), "/welcome")).toBeNull();
  });

  it("only accepts same-site next paths", () => {
    expect(safeNext("/lab")).toBe("/lab");
    expect(safeNext("//evil.example")).toBeNull();
    expect(safeNext("https://evil.example")).toBeNull();
    expect(safeNext("/auth/sign-in")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
