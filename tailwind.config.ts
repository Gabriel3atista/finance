import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        graphite: {
          50: "hsl(225 10% 42%)",
          100: "hsl(225 10% 36%)",
          200: "hsl(225 10% 30%)",
          300: "hsl(225 10% 24%)",
          400: "hsl(225 10% 19%)",
          500: "hsl(225 10% 15%)",
          600: "hsl(225 13% 12%)",
          700: "hsl(225 14% 9%)",
          800: "hsl(225 15.38% 7%)",
          900: "hsl(225 15.38% 5.1%)",
        },
        moon: {
          50: "hsl(204 45.45% 97.84%)",
          100: "hsl(206.67 36% 95.1%)",
          200: "hsl(207.69 27.66% 90.78%)",
          300: "hsl(207 22.22% 82.35%)",
          400: "hsl(207.69 18.06% 71.76%)",
          500: "hsl(207.69 12.75% 60%)",
          600: "hsl(208.89 10.93% 48.43%)",
          700: "hsl(208.89 14.29% 37.06%)",
          800: "hsl(207.69 19.7% 25.88%)",
          900: "hsl(207.5 30% 15.69%)",
        },
        mint: {
          50: "hsl(171, 93%, 95%)",
          100: "hsl(172, 88%, 84%)",
          200: "hsl(174, 88%, 65%)",
          300: "hsl(174, 64%, 58%)",
          400: "hsl(174, 44%, 49%)",
          500: "hsl(174, 42%, 43%)",
          600: "hsl(173, 41%, 38%)",
          700: "hsl(173, 38%, 32%)",
          800: "hsl(173, 36%, 27%)",
          900: "hsl(173, 34%, 23%)",
          950: "hsl(171, 27%, 15%)",
        },
        yellow: {
          500: "hsl(43.92 100% 50.98% / <alpha-value>)",
        },
        ink: "hsl(210 18% 94%)",
        muted: "hsl(220 8% 60%)",
        canvas: "hsl(225 15.38% 5.1%)",
        line: "hsl(225 10% 17%)",
        accent: "hsl(43.92 100% 50.98% / <alpha-value>)",
        "accent-soft": "hsl(43.92 100% 50.98% / 0.12)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Arial", "sans-serif"],
        "kantumruy-pro": ["var(--font-kantumruy-pro)", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px hsl(0 0% 0% / 24%), 0 12px 32px hsl(0 0% 0% / 20%)",
      },
    },
  },
  plugins: [
    plugin(({ addVariant }) => {
      addVariant(
        "mobile-app",
        "@media (max-width: 767px), (display-mode: standalone)",
      );
      addVariant(
        "standalone-wide",
        "@media (display-mode: standalone) and (min-width: 768px)",
      );
      addVariant("standalone", "@media (display-mode: standalone)");
    }),
  ],
};

export default config;
