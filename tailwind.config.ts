import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-450px 0" },
          "100%": { backgroundPosition: "450px 0" },
        },
        fadeSwap: {
          "0%": { opacity: "0", transform: "translateY(-2px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideInDown: {
          "0%": { opacity: "0", transform: "translateY(-12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(34, 211, 238, 0.55)" },
          "50%": { boxShadow: "0 0 0 8px rgba(34, 211, 238, 0)" },
        },
        flashRed: {
          "0%": {
            backgroundColor: "rgba(244, 63, 94, 0.28)",
            boxShadow: "0 0 0 0 rgba(244, 63, 94, 0.55)",
          },
          "60%": {
            backgroundColor: "rgba(244, 63, 94, 0.16)",
            boxShadow: "0 0 0 6px rgba(244, 63, 94, 0)",
          },
          "100%": {
            backgroundColor: "transparent",
            boxShadow: "0 0 0 0 rgba(244, 63, 94, 0)",
          },
        },
      },
      animation: {
        shimmer: "shimmer 1.6s linear infinite",
        "fade-swap": "fadeSwap 250ms ease-out",
        "slide-in-down": "slideInDown 350ms ease-out",
        "pulse-glow": "pulseGlow 2.4s infinite",
        "flash-red": "flashRed 1.8s ease-out",
      },
      backgroundImage: {
        "shimmer-gradient":
          "linear-gradient(90deg, rgba(226,232,240,0) 0%, rgba(226,232,240,0.85) 50%, rgba(226,232,240,0) 100%)",
      },
    },
  },
  plugins: [],
};
export default config;
