import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#2a2a2e",
        brand: { DEFAULT: "#1f3aa6" },
        silver: { DEFAULT: "#c0c7d1" },
        beige: { DEFAULT: "#f6f1ea" },
      },
      borderRadius: { lg: "12px", md: "10px", sm: "8px" },
    },
  },
  plugins: [animate],
};

export default config;