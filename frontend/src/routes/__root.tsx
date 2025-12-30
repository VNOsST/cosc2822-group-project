/// <reference types="vite/client" />
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import amplifyCss from "@aws-amplify/ui-react/styles.css?url";
import type { ReactNode } from "react";
import appCss from "@/styles.css?url";
import { configureAmplify } from "@/lib/amplify-config";
import { AuthProvider } from "@/lib/auth-context";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient } from "@tanstack/react-query";
import { QueryClientProvider } from "@tanstack/react-query";

// Initialize Amplify
configureAmplify();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "CineCloud" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "stylesheet", href: amplifyCss },
    ],
  }),
  component: RootComponent,
});

const queryClient = new QueryClient({
  defaultOptions: {},
});

function RootComponent() {
  return (
    <RootDocument>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <div className="dark min-h-screen bg-background text-foreground antialiased">
            <Outlet />
            <Toaster richColors position="top-right" />
          </div>
          <TanStackRouterDevtools position="bottom-right" />
        </QueryClientProvider>
      </AuthProvider>
    </RootDocument>
  );
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
