"use client";

import { createContext, useContext, useState, ReactNode, useCallback } from "react";
import { AuthModal } from "@/components/auth/AuthModal";

interface AuthModalContextType {
  openLogin: () => void;
  openRegister: () => void;
  close: () => void;
  isOpen: boolean;
  requireAuth: (callback?: () => void) => boolean;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export function AuthModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "register">("login");
  const [pendingCallback, setPendingCallback] = useState<(() => void) | null>(null);

  const openLogin = useCallback(() => {
    setMode("login");
    setIsOpen(true);
  }, []);

  const openRegister = useCallback(() => {
    setMode("register");
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setPendingCallback(null);
  }, []);

  // Check if user is authenticated, if not show modal and return false
  // Optionally accepts a callback to execute after successful auth
  const requireAuth = useCallback((callback?: () => void): boolean => {
    // Check localStorage for auth token
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
    if (token) {
      callback?.();
      return true;
    }

    // Store callback for after login
    if (callback) {
      setPendingCallback(() => callback);
    }

    openLogin();
    return false;
  }, [openLogin]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    // Execute pending callback if auth was successful
    // This will be called from AuthModal after successful login
  }, []);

  return (
    <AuthModalContext.Provider value={{ openLogin, openRegister, close, isOpen, requireAuth }}>
      {children}
      <AuthModal
        isOpen={isOpen}
        onClose={handleClose}
        initialMode={mode}
      />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (context === undefined) {
    throw new Error("useAuthModal must be used within an AuthModalProvider");
  }
  return context;
}
