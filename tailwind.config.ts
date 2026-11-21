import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        board: {
          light: "#f0d9b5",
          dark: "#b58863",
          highlight: "#baca2b",
          dropTarget: "#79a83b",
        },
      },
    },
  },
  plugins: [],
};

export default config;
