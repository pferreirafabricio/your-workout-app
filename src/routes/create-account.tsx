import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/action-buttons";
import { Input } from "@/components/ui/input";
import { createAccountServerFn } from "@/lib/features/auth/auth.server";
import { z } from "zod";
import { getCsrfHeaders } from "@/lib/csrf.client";
import { strongPasswordSchema } from "@/lib/features/workouts/workout-progression";
import { LogIn } from "lucide-react";

const createAccountInputSchema = z.object({
  email: z.email(),
  name: z.string().trim().min(1).max(120),
  password: strongPasswordSchema,
});

export const Route = createFileRoute("/create-account")({
  beforeLoad: ({ context }) => {
    if (context.user) {
      throw redirect({ to: "/" });
    }
  },
  component: CreateAccountPage,
});

function CreateAccountPage() {
  const [error, setError] = useState("");
  const form = useForm({
    defaultValues: {
      email: "",
      name: "",
      password: "",
    },
    onSubmit: async ({ value }) => {
      setError("");

      try {
        const parsed = createAccountInputSchema.safeParse(value);
        if (!parsed.success) {
          setError(parsed.error.issues[0]?.message ?? "Invalid account details.");
          return;
        }

        const result = await createAccountServerFn({ data: parsed.data, headers: getCsrfHeaders() });
        if (result.success) {
          globalThis.location.assign("/current-workout");
          return;
        }

        setError(result.error || "Account creation failed");
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
          <CardTitle className="text-2xl font-semibold text-gray-900">Create your account</CardTitle>
          <p className="text-sm text-gray-500">Get started with your new account</p>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              e.stopPropagation();
              form.handleSubmit();
            }}
            className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">{error}</div>
            )}
            <form.Field name="name">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <Input
                    id={field.name}
                    type="text"
                    placeholder="John Doe"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="email">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <Input
                    id={field.name}
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="password">
              {(field) => (
                <div className="space-y-2">
                  <label htmlFor={field.name} className="text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Input
                    id={field.name}
                    type="password"
                    placeholder="••••••••"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    required
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <p className="text-xs text-gray-500">8+ chars with uppercase, lowercase, number, and symbol</p>
                </div>
              )}
            </form.Field>
            <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
              {([canSubmit, isSubmitting]) => (
                <SubmitButton
                  className="w-full"
                  disabled={!canSubmit || isSubmitting}
                  isLoading={isSubmitting}
                  loadingText="Creating account...">
                  Create account
                </SubmitButton>
              )}
            </form.Subscribe>
          </form>
          <p className="mt-4 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link to="/sign-in" className="text-primary hover:underline font-medium">
              <span className="inline-flex items-center gap-1">
                <LogIn className="h-4 w-4" />
                Sign in
              </span>
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
