"use client";

import { useEffect, useState } from "react";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";

const AUTH_STORAGE_KEY = "bard_auth";

export interface StoredAuth {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    full_name: string;
    role: string;
    subscription_tier: string;
    is_active: boolean;
    is_staff?: boolean;
    is_superuser?: boolean;
    email_verified?: boolean;
    date_joined?: string;
    profile?: {
      avatar: string | null;
      bio?: string;
      company?: string;
      job_title?: string;
      phone?: string;
      country?: string;
      timezone?: string;
      preferences?: any;
      watchlist?: any[];
    };
  };
  tokens: {
    access: string;
    refresh: string;
  };
}

export function saveAuthToStorage(auth: StoredAuth): void {
  if (typeof window !== "undefined") {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  }
}

export function getAuthFromStorage(): StoredAuth | null {
  if (typeof window === "undefined") return null;

  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as StoredAuth;
    }
  } catch (e) {
    console.error("Failed to parse stored auth:", e);
  }
  return null;
}

export function clearAuthFromStorage(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
  }
}

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const storedAuth = getAuthFromStorage();

    if (storedAuth && storedAuth.user && storedAuth.tokens) {
      dispatch(setCredentials({
        user: storedAuth.user as any,
        tokens: storedAuth.tokens,
      }));
    }

    setIsInitialized(true);
  }, [dispatch]);

  // Show nothing until auth is initialized to prevent flash
  if (!isInitialized) {
    return null;
  }

  return <>{children}</>;
}
