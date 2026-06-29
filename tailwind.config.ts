/* eslint-disable @typescript-eslint/no-require-imports */
import type { Config } from "tailwindcss";
const {
  default: flattenColorPalette,
} = require("tailwindcss/lib/util/flattenColorPalette");

type TailwindPluginApi = {
  addBase: (base: Record<string, Record<string, string>>) => void;
  theme: (path: "colors") => Record<string, unknown>;
};

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./layouts/**/*.{js,ts,jsx,tsx,mdx}",
    "./content/**/*.{md,mdx}",
    "./mdx-components.tsx",
  ],
  darkMode: "class",
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        navbar: {
          DEFAULT: "var(--navbar-bg)",
          scrolled: "var(--navbar-bg-scrolled)",
        },
        hover: {
          DEFAULT: "var(--hover-bg)",
          foreground: "var(--hover-foreground)",
        },
      },
      animation: {
        scroll:
          "scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite",
        marquee: "marquee var(--marquee-duration) linear infinite",
        "fade-in": "fade-in 0.5s linear forwards",
      },
      boxShadow: {
        derek: `0px 0px 0px 1px color-mix(in oklch, var(--shadow-color) 6%, transparent),
        0px 1px 1px -0.5px color-mix(in oklch, var(--shadow-color) 6%, transparent),
        0px 3px 3px -1.5px color-mix(in oklch, var(--shadow-color) 6%, transparent),
        0px 6px 6px -3px color-mix(in oklch, var(--shadow-color) 6%, transparent),
        0px 12px 12px -6px color-mix(in oklch, var(--shadow-color) 6%, transparent),
        0px 24px 24px -12px color-mix(in oklch, var(--shadow-color) 6%, transparent)`,
        aceternity: `0px 2px 3px -1px color-mix(in oklch, var(--shadow-color) 10%, transparent), 0px 1px 0px 0px color-mix(in oklch, var(--shadow-color) 2%, transparent), 0px 0px 0px 1px color-mix(in oklch, var(--shadow-color) 8%, transparent)`,
        navbar: `0px -2px 0px 0px var(--border), 0px 2px 0px 0px var(--border)`,
      },
      keyframes: {
        scroll: {
          to: {
            transform: "translate(calc(-50% - 0.5rem))",
          },
        },
        marquee: {
          "100%": {
            transform: "translateY(-50%)",
          },
        },
        "fade-in": {
          from: {
            opacity: "0",
          },
          to: {
            opacity: "1",
          },
        },
      },
    },
  },
  plugins: [addVariablesForColors, require("@tailwindcss/typography")],
};

function addVariablesForColors({ addBase, theme }: TailwindPluginApi) {
  const allColors = flattenColorPalette(theme("colors"));
  const newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, String(val)])
  );

  addBase({
    ":root": newVars,
  });
}

export default config;
