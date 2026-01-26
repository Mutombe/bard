"use client";

import { Suspense } from "react";
import { Provider as ReduxProvider } from "react-redux";
import { ThemeProvider } from "./theme-provider";
import { AuthInitializer } from "./AuthInitializer";
import { NavigationProgress } from "./NavigationProgress";
import { store } from "@/store";

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange={false}
      storageKey="bard-theme"
    >
      <ReduxProvider store={store}>
        <AuthInitializer>
          <Suspense fallback={null}>
            <NavigationProgress />
          </Suspense>
          {children}
        </AuthInitializer>
      </ReduxProvider>
    </ThemeProvider>
  );
}
