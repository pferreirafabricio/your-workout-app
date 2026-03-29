import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import styles from "../styles.css?url";
import { type QueryClient } from "@tanstack/react-query";
import { getUserServerFn } from "@/lib/features/auth/auth.server";
import { TanStackDevtools } from "@tanstack/react-devtools";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { useClientConfig } from "@/lib/core/config.client";
import { getServerConfigServerFn } from "@/lib/core/get-server-config.server";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { NotFound } from "@/components/core/not-found";
import { RootErrorComponent } from "@/components/core/root-error-component";

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  beforeLoad: async () => {
    await getServerConfigServerFn();
    const user = await getUserServerFn();
    return { user };
  },
  errorComponent: RootErrorComponent,
  notFoundComponent: NotFound,
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },

      {
        title: "Better Bookkeeping - Onboarding",
      },
    ],
    scripts: [
      {
        src: "/config.js",
        type: "text/javascript",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.png",
      },
      {
        rel: "stylesheet",
        href: styles,
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:opsz,wght@14..32,100..900&family=Manrope:wght@200..800&display=swap",
      },
    ],
  }),

  shellComponent: RootDocument,
});

function RootDocument({ children }: Readonly<{ children: React.ReactNode }>) {
  const config = useClientConfig();
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="overflow-x-hidden font-sans antialiased text-slate-900 bg-[radial-gradient(circle_at_top,#e8f5f9_0%,#f4f9fb_36%,#ffffff_70%)]">
        <TooltipProvider>
          {children}
        </TooltipProvider>
        <Toaster position="top-right" duration={4000} richColors />
        {config.environment === "development" && (
          <TanStackDevtools
            config={{
              position: "bottom-left",
            }}
            plugins={[
              {
                name: "Tanstack Router",
                render: <TanStackRouterDevtoolsPanel />,
              },
              {
                name: "TanStack Query",
                render: <ReactQueryDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  );
}
