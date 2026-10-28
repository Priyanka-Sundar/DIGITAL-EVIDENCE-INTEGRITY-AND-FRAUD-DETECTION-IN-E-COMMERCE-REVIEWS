import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#FAF6F0",
        surface: "#FFFFFF",
        ink: "#211D18",
        "ink-soft": "#6B6259",
        "ink-faint": "#8A8177",
        line: "#EDE6DA",
        butter: "#EFDC7C",
        blush: "#F4B8D0",
        sage: "#BFD6A3",
        sky: "#AFC6E9",
        lilac: "#CDB8EC",
        coral: "#EF9A80"
      },
      borderRadius: {
        "3xl": "1.5rem",
        "4xl": "2rem"
      },
      boxShadow: {
        card: "0 1px 2px rgba(33,29,24,0.04), 0 12px 28px -16px rgba(33,29,24,0.18)",
        "card-hover": "0 1px 2px rgba(33,29,24,0.05), 0 18px 36px -18px rgba(33,29,24,0.24)"
      }
    }
  },
  plugins: []
};

export default config;
