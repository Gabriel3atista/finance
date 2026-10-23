import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#22261f",
        muted: "#777c72",
        canvas: "#f6f7f3",
        line: "#e6e8e1",
        accent: "#315b48",
        "accent-soft": "#e8efe9",
      },
      fontFamily: {
        sans: ["Inter Display", "Inter", "Arial", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgb(27 34 28 / 4%), 0 8px 24px rgb(27 34 28 / 3%)",
      },
    },
  },
  plugins: [],
};

export default config;
