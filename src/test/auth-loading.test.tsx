import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider, useAuth } from "@/hooks/useAuth";

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  signOut: vi.fn(),
  unsubscribe: vi.fn(),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: {
  getSession: auth.getSession,
  signOut: auth.signOut,
  onAuthStateChange: () => ({ data: { subscription: { unsubscribe: auth.unsubscribe } } }),
} } }));

function SessionState() {
  const { loading, user } = useAuth();
  return <output>{loading ? "pending" : user ? "signed-in" : "signed-out"}</output>;
}

describe("Session loading recovery", () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); sessionStorage.clear(); });
  it("finishes checking when the session request rejects", async () => {
    auth.getSession.mockRejectedValue(new Error("Network disconnected"));
    render(<AuthProvider><SessionState /></AuthProvider>);
    await waitFor(() => expect(screen.getByRole("status").textContent).toBe("signed-out"));
  });
  it("keeps loading until the actual session request completes", async () => {
    let resolveSession: ((value: { data: { session: null } }) => void) | undefined;
    auth.getSession.mockImplementation(() => new Promise(resolve => { resolveSession = resolve; }));
    render(<AuthProvider><SessionState /></AuthProvider>);
    expect(screen.getByRole("status").textContent).toBe("pending");
    await act(async () => { resolveSession?.({ data: { session: null } }); });
    expect(screen.getByRole("status").textContent).toBe("signed-out");
  });
});