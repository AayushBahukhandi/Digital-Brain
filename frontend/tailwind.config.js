/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
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
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      colors: {
        // Dark Mode Optimized Color Palette
        primary: {
          DEFAULT: "#8B5CF6", // Purple - easier on eyes in dark mode
          dark: "#7C3AED",
          hover: "#A78BFA", // Softer purple for hover
          foreground: "#F1F5F9",
        },
        secondary: {
          DEFAULT: "#06B6D4", // Cyan - great contrast in dark
          dark: "#0891B2",
          hover: "#22D3EE", // Bright cyan hover
          foreground: "#F1F5F9",
        },
        background: "#0F172A", // Slate-900 - perfect for dark mode
        surface: "#1E293B", // Slate-800
        card: {
          DEFAULT: "#334155", // Slate-700
          hover: "#475569", // Slate-600 for hover
          foreground: "#F1F5F9",
        },
        text: {
          primary: "#F1F5F9", // Slate-100 - softer than pure white
          secondary: "#CBD5E1", // Slate-300
          muted: "#94A3B8", // Slate-400
        },
        accent: {
          DEFAULT: "#F59E0B", // Amber - warm accent for dark mode
          hover: "#FBBF24",
          foreground: "#F1F5F9",
        },
        success: {
          DEFAULT: "#10B981", // Emerald
          hover: "#34D399",
          foreground: "#F1F5F9",
        },
        warning: {
          DEFAULT: "#F59E0B", // Amber
          foreground: "#F1F5F9",
        },
        error: {
          DEFAULT: "#EF4444", // Red
          hover: "#F87171",
          foreground: "#F1F5F9",
        },
        border: "#475569", // Slate-600
        "border-hover": "#64748B", // Slate-500
        input: {
          DEFAULT: "#374151", // Gray-700
          focus: "#4B5563", // Gray-600
        },
        ring: "#8B5CF6", // Primary with 40% opacity
        // Legacy support
        foreground: "#F1F5F9",
        destructive: "#EF4444",
        "destructive-foreground": "#F1F5F9",
        muted: "#1E293B",
        "muted-foreground": "#CBD5E1",
        popover: "#334155",
        "popover-foreground": "#F1F5F9",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      spacing: {
        // Exact spacing system from specification (base unit: 4px)
        '1': '4px',   // 4px
        '2': '8px',   // 8px
        '3': '12px',  // 12px
        '4': '16px',  // 16px
        '6': '24px',  // 24px
        '8': '32px',  // 32px
        '12': '48px', // 48px
        '16': '64px', // 64px
        '24': '96px', // 96px
        // Additional spacing for flexibility
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(20px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-hover": {
          "0%": { transform: "scale(1)" },
          "100%": { transform: "scale(1.02)" },
        },
        "card-hover": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-4px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-2px)" },
          "20%, 40%, 60%, 80%": { transform: "translateX(2px)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "scale-hover": "scale-hover 0.2s ease",
        "card-hover": "card-hover 0.2s ease",
        "shake": "shake 0.5s ease-in-out",
      },
    },
  },
  plugins: [],
}