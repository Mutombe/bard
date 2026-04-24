"use client";

import { Suspense } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "./theme-provider";
import { AuthInitializer } from "./AuthInitializer";
import { NavigationProgress } from "./NavigationProgress";
import { SWRProvider } from "@/hooks/use-swr-config";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
import { SessionExpiredModal } from "@/components/auth/SessionExpiredModal";
import { store } from "@/store";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
      storageKey="bardiq-theme"
    >
      <ReduxProvider store={store}>
        <SWRProvider>
          <AuthInitializer>
            <AuthModalProvider>
              <Suspense fallback={null}>
                <NavigationProgress />
              </Suspense>
              {/* Site-wide listener for auth:session-expired events
                  dispatched by the axios interceptors when the refresh
                  token is rejected. Shows a clear "Session expired" modal
                  with a re-login CTA so users aren't staring at silently
                  broken UI (missing images, empty article lists). */}
              <SessionExpiredModal />
              {children}
            </AuthModalProvider>
          </AuthInitializer>
        </SWRProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
