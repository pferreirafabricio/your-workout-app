/* @vitest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigateMock = vi.fn();
const redirectMock = vi.fn((payload) => payload);
const signInServerFnMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
  createFileRoute: () => (options: Record<string, unknown>) => ({ options }),
  redirect: (payload: unknown) => redirectMock(payload),
  useRouter: () => ({ navigate: navigateMock }),
}));

vi.mock("@/lib/features/auth/auth.server", () => ({
  signInServerFn: (input: unknown) => signInServerFnMock(input),
}));

import { Route, SignInPage } from ".";

describe("sign-in route integration", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    redirectMock.mockClear();
    signInServerFnMock.mockReset();
  });

  it("redirects authenticated users in beforeLoad", () => {
    const beforeLoad = (Route as unknown as { options: { beforeLoad: (ctx: { context: { user: unknown } }) => void } }).options.beforeLoad;

    expect(() => beforeLoad({ context: { user: { id: "u1" } } })).toThrow();
    expect(redirectMock).toHaveBeenCalledWith({ to: "/" });
  });

  it("shows client-side validation error for malformed email", async () => {
    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "not-an-email" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/invalid/i)).toBeTruthy();
    expect(signInServerFnMock).not.toHaveBeenCalled();
  });

  it("renders lockout feedback for repeated failed attempts", async () => {
    signInServerFnMock.mockResolvedValueOnce({
      success: false,
      error: "LOCKED_OUT",
      retryAfterSeconds: 120,
    });

    render(<SignInPage />);

    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "user@example.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "password123" } });
    fireEvent.submit(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByText(/Too many failed attempts\. Try again in 2 minutes\./)).toBeTruthy();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
