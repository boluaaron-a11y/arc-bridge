import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        arc: {
          blue: "#3E74BB",
          dark: "#0D1B2F",
          surface: "#1F2F44",
          accent: "#ACC6E9",
        },
      },
    },
  },
  plugins: [],
};

export default config;
