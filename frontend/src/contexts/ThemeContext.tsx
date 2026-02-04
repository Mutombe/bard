"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "bardiq-theme";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage or default to light
  useEffect(() => {
    setMounted(true);
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;

    if (storedTheme && (storedTheme === "light" || storedTheme === "dark")) {
      setThemeState(storedTheme);
    } else {
      // Default to light theme
      setThemeState("light");
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Add transition class for smooth theme switching
    root.classList.add("theme-transition");

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Store preference
    localStorage.setItem(THEME_STORAGE_KEY, theme);

    // Remove transition class after animation
    const timeout = setTimeout(() => {
      root.classList.remove("theme-transition");
    }, 300);

    return () => clearTimeout(timeout);
  }, [theme, mounted]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === "light" ? "dark" : "light"));
  };

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

export default ThemeProvider;
