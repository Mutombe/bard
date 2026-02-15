import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      // Brand color palette - Warm Burgundy (Swiss/HBR Style)
      colors: {
        // Primary brand colors - Burgundy/Crimson
        brand: {
          burgundy: "#9b2335",
          "burgundy-light": "#b83a4b",
          "burgundy-dark": "#7a1c2a",
          // Legacy support - map to burgundy
          orange: "#9b2335",
          "orange-light": "#b83a4b",
          "orange-dark": "#7a1c2a",
        },
        // Terminal theme (adapts via CSS variables)
        terminal: {
          bg: "hsl(var(--terminal-bg))",
          "bg-secondary": "hsl(var(--terminal-bg-secondary))",
          "bg-elevated": "hsl(var(--terminal-bg-elevated))",
          border: "hsl(var(--terminal-border))",
          "border-light": "hsl(var(--terminal-border-light))",
        },
        // Market colors
        market: {
          up: "hsl(var(--market-up))",
          "up-bg": "hsl(var(--market-up-bg))",
          down: "hsl(var(--market-down))",
          "down-bg": "hsl(var(--market-down-bg))",
          neutral: "#808080",
        },
        // Shadcn/ui colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-fraunces)", "Georgia", "Times New Roman", "serif"],
        "serif-body": ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Consolas", "Monaco", "monospace"],
        headline: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "pulse-green": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "pulse-red": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "ticker-scroll": "ticker-scroll 30s linear infinite",
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "pulse-red": "pulse-red 2s ease-in-out infinite",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
        shimmer: "shimmer 2s infinite",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-terminal":
          "linear-gradient(180deg, hsl(var(--terminal-bg)) 0%, hsl(var(--terminal-bg-secondary)) 100%)",
        "shimmer-gradient":
          "linear-gradient(90deg, transparent, hsl(var(--muted-foreground) / 0.1), transparent)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
