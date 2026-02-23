"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import {
  X,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppDispatch } from "@/store";
import { setCredentials } from "@/store/slices/authSlice";
import { saveAuthToStorage } from "@/components/providers/AuthInitializer";
import { authService } from "@/services/api/auth";
import { ThemeLogo } from "@/components/ui/theme-logo";
import { toast } from "sonner";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

// Google Icon component
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Extend window type for Google
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
          }) => void;
          renderButton: (element: HTMLElement, config: {
            theme?: string;
            size?: string;
            width?: string | number;
            text?: string;
            shape?: string;
          }) => void;
          prompt: () => void;
        };
      };
    };
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: "login" | "register";
}

export function AuthModal({ isOpen, onClose, initialMode = "login" }: AuthModalProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [mode, setMode] = useState<"login" | "register" | "forgot">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);

  // Handle Google OAuth callback
  const handleGoogleCallback = async (response: { credential: string }) => {
    setIsGoogleLoading(true);
    setError("");

    try {
      const result = await authService.googleAuth(response.credential);

      const authData = {
        user: result.user,
        tokens: {
          access: result.access,
          refresh: result.refresh,
        },
      };

      dispatch(setCredentials(authData));
      saveAuthToStorage(authData);

      localStorage.setItem("access_token", result.access);
      localStorage.setItem("refresh_token", result.refresh);

      toast.success("Signed in with Google successfully!");
      onClose();
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.error("Google auth error:", err);
      const errorMessage = err.response?.data?.error || "Google authentication failed. Please try again.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Initialize Google Sign-In when script loads
  useEffect(() => {
    if (googleScriptLoaded && isOpen && GOOGLE_CLIENT_ID && window.google) {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCallback,
      });

      // Render the Google button based on current mode
      const buttonId = mode === "login" ? "google-signin-button" : "google-signup-button";
      const googleButtonDiv = document.getElementById(buttonId);
      if (googleButtonDiv) {
        googleButtonDiv.innerHTML = ""; // Clear previous button
        window.google.accounts.id.renderButton(googleButtonDiv, {
          theme: "outline",
          size: "large",
          width: "100%",
          text: mode === "login" ? "signin_with" : "signup_with",
          shape: "rectangular",
        });
      }
    }
  }, [googleScriptLoaded, isOpen, mode]);

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Call real backend API
      const response = await authService.login({ email, password });

      // Save to Redux and localStorage
      const authData = {
        user: response.user,
        tokens: {
          access: response.access,
          refresh: response.refresh,
        },
      };

      dispatch(setCredentials(authData));
      saveAuthToStorage(authData);

      // Store tokens for API client
      localStorage.setItem("access_token", response.access);
      localStorage.setItem("refresh_token", response.refresh);

      onClose();
      // Redirect to profile after successful login
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.error("Login error:", err);
      const errorMessage = err.response?.data?.detail
        || err.response?.data?.error?.message
        || err.response?.data?.message
        || "Invalid email or password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setIsLoading(true);

    try {
      // Call real backend API for registration
      const response = await authService.register({
        email,
        first_name: firstName,
        last_name: lastName,
        password,
        password_confirm: confirmPassword,
      });

      // After successful registration, log the user in
      setSuccess("Account created successfully! Logging you in...");

      // Auto-login after registration
      const loginResponse = await authService.login({ email, password });

      const authData = {
        user: loginResponse.user,
        tokens: {
          access: loginResponse.access,
          refresh: loginResponse.refresh,
        },
      };

      dispatch(setCredentials(authData));
      saveAuthToStorage(authData);

      localStorage.setItem("access_token", loginResponse.access);
      localStorage.setItem("refresh_token", loginResponse.refresh);

      onClose();
      // Redirect to profile after successful registration
      router.push("/profile");
      router.refresh();
    } catch (err: any) {
      console.error("Registration error:", err);
      const errorData = err.response?.data;
      let errorMessage = "Registration failed. Please try again.";

      // Handle specific field errors from Django
      if (errorData) {
        if (errorData.email) {
          errorMessage = Array.isArray(errorData.email) ? errorData.email[0] : errorData.email;
        } else if (errorData.password) {
          errorMessage = Array.isArray(errorData.password) ? errorData.password[0] : errorData.password;
        } else if (errorData.detail) {
          errorMessage = errorData.detail;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await authService.requestPasswordReset(email);
      setSuccess("Password reset link sent to your email. Please check your inbox.");
    } catch (err: any) {
      console.error("Password reset error:", err);
      // Don't reveal if email exists or not for security
      setSuccess("If an account with this email exists, you will receive a password reset link.");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setFirstName("");
    setLastName("");
    setError("");
    setSuccess("");
  };

  const switchMode = (newMode: "login" | "register" | "forgot") => {
    resetForm();
    setMode(newMode);
  };

  return (
    <>
      {/* Google Identity Services Script */}
      {GOOGLE_CLIENT_ID && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={() => setGoogleScriptLoaded(true)}
          strategy="lazyOnload"
        />
      )}

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/70" onClick={onClose} />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-terminal-bg border border-terminal-border rounded-lg shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="p-6">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-3">
              <ThemeLogo width={260} height={65} />
            </div>
            <h2 className="text-xl font-bold">
              {mode === "login" && "Welcome back"}
              {mode === "register" && "Create your account"}
              {mode === "forgot" && "Reset your password"}
            </h2>
            <p className="text-sm text-muted-foreground">
              {mode === "login" && "Sign in to access your portfolio and personalized news"}
              {mode === "register" && "Start your journey with African market intelligence"}
              {mode === "forgot" && "Enter your email to receive a password reset link"}
            </p>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 rounded-md bg-market-down/10 border border-market-down/30 text-market-down text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 rounded-md bg-market-up/10 border border-market-up/30 text-market-up text-sm flex items-center gap-2">
              <Check className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Login Form */}
          {mode === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    required
                    className="w-full pl-10 pr-12 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-sm text-primary hover:text-primary-light"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-terminal-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-terminal-bg px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign In Button */}
              {GOOGLE_CLIENT_ID ? (
                <div className="relative">
                  {isGoogleLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md z-10">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    </div>
                  )}
                  <div id="google-signin-button" className="flex justify-center" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toast.info("Feature Pending", { description: "Google authentication will be available soon." })}
                  className="w-full py-2.5 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 border border-gray-300"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Sign in with Google
                </button>
              )}
            </form>
          )}

          {/* Register Form */}
          {mode === "register" && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-2">First Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Doe"
                    required
                    className="w-full px-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full pl-10 pr-12 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    Create Account
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>

              {/* Divider */}
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-terminal-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-terminal-bg px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              {/* Google Sign Up Button */}
              {GOOGLE_CLIENT_ID ? (
                <div className="relative">
                  {isGoogleLoading && (
                    <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-md z-10">
                      <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
                    </div>
                  )}
                  <div id="google-signup-button" className="flex justify-center" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => toast.info("Feature Pending", { description: "Google authentication will be available soon." })}
                  className="w-full py-2.5 bg-white text-gray-900 font-medium rounded-md hover:bg-gray-100 transition-colors flex items-center justify-center gap-3 border border-gray-300"
                >
                  <GoogleIcon className="h-5 w-5" />
                  Sign up with Google
                </button>
              )}
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === "forgot" && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-terminal-bg-elevated border border-terminal-border rounded-md focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 bg-primary text-white font-medium rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Send Reset Link"
                )}
              </button>

              <button
                type="button"
                onClick={() => switchMode("login")}
                className="w-full text-sm text-muted-foreground hover:text-foreground"
              >
                Back to login
              </button>
            </form>
          )}

          {/* Footer */}
          {mode !== "forgot" && (
            <div className="mt-6 pt-6 border-t border-terminal-border text-center">
              <p className="text-sm text-muted-foreground">
                {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => switchMode(mode === "login" ? "register" : "login")}
                  className="text-primary hover:text-primary-light font-medium"
                >
                  {mode === "login" ? "Create one" : "Sign in"}
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
