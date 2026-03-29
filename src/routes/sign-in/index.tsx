import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/action-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signInServerFn } from "@/lib/features/auth/auth.server";
import { signInInputSchema } from "@/lib/features/auth/auth.validation";
import { getCsrfHeaders } from "@/lib/security/csrf.client";
import { formatRetryDelay } from "@/lib/shared/utils/time";
import { UserPlus, Eye, EyeOff } from "lucide-react";

export const Route = createFileRoute("/sign-in/")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: SignInPage,
});

export function SignInPage() {
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError("");
      try {
        const parsed = signInInputSchema.safeParse({
          ...value,
          clientSource: "web",
        });

        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid sign-in values.");
          return;
        }

        const result = await signInServerFn({
          data: parsed.data,
          headers: getCsrfHeaders(),
        });

        if (result.success) {
          globalThis.location.assign("/current-workout");
          return;
        } else if (result.error === "LOCKED_OUT") {
          setError(
            `Too many failed attempts. Try again in ${formatRetryDelay(result.retryAfterSeconds)}.`,
          );
        } else if (result.error === "INVALID_CREDENTIALS") {
          setError("Invalid email or password");
        } else {
          setError("Sign in failed");
        }
      } catch {
        setError("An unexpected error occurred");
      }
    },
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-2">
          <img src="/wordmark.svg" alt="Logo" className="h-8 mx-auto" />
          <CardTitle className="text-2xl font-semibold text-gray-900">Sign in to your account</CardTitle>
          <p className="text-sm text-gray-500">Enter your credentials to continue</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4"
          >
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                {error}
              </div>
            )}

            <form.Field
              name="email"
              children={(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-gray-700"
                  >
                    Email
                  </label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    type="email"
                    placeholder="you@example.com"
                    required
                    autoComplete="email"
                  />
                  {field.state.meta.errors ? (
                    <em className="text-xs text-red-600">
                      {field.state.meta.errors.join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Field
              name="password"
              children={(field) => (
                <div className="space-y-2">
                  <label
                    htmlFor={field.name}
                    className="text-sm font-medium text-gray-700"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      required
                      className="pr-10"
                      autoComplete="current-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                      <span className="sr-only">
                        {showPassword ? "Hide password" : "Show password"}
                      </span>
                    </Button>
                  </div>
                  {field.state.meta.errors ? (
                    <em className="text-xs text-red-600">
                      {field.state.meta.errors.join(", ")}
                    </em>
                  ) : null}
                </div>
              )}
            />

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
              children={([canSubmit, isSubmitting]) => (
                <SubmitButton
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting as boolean}
                  loadingText="Signing in..."
                >
                  Sign in
                </SubmitButton>
              )}
            />
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
