import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { signInServerFn } from "@/lib/auth.server";
import { signInInputSchema } from "@/lib/validation/workout-progression";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { UserPlus } from "lucide-react";

export const Route = createFileRoute("/sign-in")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: SignInPage,
});

export function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const parsed = signInInputSchema.safeParse({ email, password, clientSource: "web" });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Invalid sign-in values.");
        setIsLoading(false);
        return;
      }

      const result = await signInServerFn({ data: parsed.data, headers: getCsrfHeaders() });
      if (result.success) {
        globalThis.location.assign("/current-workout");
        return;
      } else if (result.error === "LOCKED_OUT") {
        setError(`Too many failed attempts. Try again in ${result.retryAfterSeconds} seconds.`);
      } else if (result.error === "INVALID_CREDENTIALS") {
        setError("Invalid email or password");
      } else {
        setError("Sign in failed");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img src="/wordmark.svg" alt="Logo" className="h-8 mx-auto" />
          <CardTitle className="text-2xl font-semibold text-gray-900">Sign in to your account</CardTitle>
          <p className="text-sm text-gray-500">Enter your credentials to continue</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            <SubmitButton
              className="w-full"
              disabled={isLoading}
              isLoading={isLoading}
              loadingText="Signing in...">
              Sign in
            </SubmitButton>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <Link to="/create-account" className="text-primary hover:underline font-medium">
              <span className="inline-flex items-center gap-1">
                <UserPlus className="h-4 w-4" />
                Create one
              </span>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
