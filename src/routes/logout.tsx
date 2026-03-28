import { logoutServerFn } from "@/lib/features/auth/auth.server";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect } from "react";
import { getCsrfHeaders } from "@/lib/csrf.client";

export const Route = createFileRoute("/logout")({
  component: LogoutPage,
});

function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    logoutServerFn({ headers: getCsrfHeaders() }).then(() => {
      router.navigate({ to: "/sign-in" });
    });
  }, [router]);

  return <div>Logging out...</div>;
}
