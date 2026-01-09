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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

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
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 2,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * Math.pow(2, attemptIndex), 10000),
    },
  },
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
          <ReactQueryDevtools buttonPosition="bottom-left" position="left" />
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
