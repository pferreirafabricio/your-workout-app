import { logoutServerFn } from "@/lib/features/auth/auth.server";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { getCsrfHeaders } from "@/lib/security/csrf.client";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const router = useRouter();
  const redirectTimerRef = useRef<ReturnType<typeof globalThis.setTimeout> | null>(
    null,
  );
  const isMountedRef = useRef(true);
  const [status, setStatus] = useState<"processing" | "redirecting" | "error">(
    "processing",
  );

  const { mutate } = useMutation({
    mutationFn: () => logoutServerFn({ headers: getCsrfHeaders() }),
    onSuccess: () => {
      if (!isMountedRef.current) {
        return;
      }

      setStatus("redirecting");

      redirectTimerRef.current = globalThis.setTimeout(() => {
        if (isMountedRef.current) {
          router.navigate({ to: "/sign-in" });
        }
      }, 600);
    },
    onError: () => {
      if (isMountedRef.current) {
        setStatus("error");
      }
    },
  });

  useEffect(() => {
    mutate();

    return () => {
      isMountedRef.current = false;

      if (redirectTimerRef.current !== null) {
        globalThis.clearTimeout(redirectTimerRef.current);
      }
    };
  }, [mutate]);

  const statusCopy = {
    processing: {
      title: "Signing you out",
      description: "Securing your session and clearing local access...",
    },
    redirecting: {
      title: "All set",
      description: "You are signed out. Redirecting to sign in...",
    },
    error: {
      title: "Could not complete sign out",
      description:
        "Your session may still be active. Use the button below to continue safely.",
    },
  };

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[radial-gradient(circle_at_top,_#d8f3fa,_#f7fcfe_40%,_#ffffff_75%)] px-6 py-12">
      <div className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-0 h-72 w-72 rounded-full bg-sky-300/20 blur-3xl" />

      <section
        aria-live="polite"
        className="relative z-10 w-full max-w-md rounded-3xl border border-white/70 bg-white/80 p-8 shadow-[0_20px_80px_-30px_rgba(33,99,122,0.45)] backdrop-blur-md"
      >
        <div className="mb-7 flex items-center gap-4">
          <div
            className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10"
            aria-hidden="true"
          >
            {status === "error" ? (
              <svg
                viewBox="0 0 24 24"
                className="h-6 w-6 text-rose-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" />
                <path d="M12 8v5" />
                <path d="M12 16h.01" />
              </svg>
            ) : (
              <div
                className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent motion-safe:animate-spin"
                aria-hidden="true"
              />
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary/75">
              Super Fit
            </p>
            <h1 className="text-2xl font-semibold text-slate-900">
              {statusCopy[status].title}
            </h1>
          </div>
        </div>

        <p className="mb-8 text-sm leading-6 text-slate-600">
          {statusCopy[status].description}
        </p>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => router.navigate({ to: "/sign-in" })}
            className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition motion-safe:hover:-translate-y-0.5 motion-safe:hover:shadow-lg motion-safe:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={status === "processing"}
          >
            Continue to sign in
          </button>

          <p className="text-center text-xs text-slate-500">
            If this page does not redirect, you can continue manually.
          </p>
        </div>
      </section>
    </main>
  );
}
