"use client";

import { Suspense } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "./theme-provider";
import { AuthInitializer } from "./AuthInitializer";
import { NavigationProgress } from "./NavigationProgress";
import { SWRProvider } from "@/hooks/use-swr-config";
import { AuthModalProvider } from "@/contexts/AuthModalContext";
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
              {children}
            </AuthModalProvider>
          </AuthInitializer>
        </SWRProvider>
      </ReduxProvider>
    </ThemeProvider>
  );
}
