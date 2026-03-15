import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
      colors: {
        brand: {
          50:  "#fdf4ee",
          100: "#fbe5d3",
          200: "#f6c7a5",
          300: "#f0a06d",
          400: "#e87133",
          500: "#e25a1a",
          600: "#d04110",
          700: "#ad3211",
          800: "#8a2a15",
          900: "#702514",
        },
        surface: {
          DEFAULT: "#0f0d0b",
          1: "#1a1714",
          2: "#242019",
          3: "#2e291f",
          4: "#3a332a",
        },
      },
      animation: {
        "fade-up": "fadeUp 0.5s ease forwards",
        "fade-in": "fadeIn 0.4s ease forwards",
      },
      keyframes: {
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
