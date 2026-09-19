import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        sc: {
          bg: "#050505",
          surface: "#0A0A0A",
          card: "#101010",
          border: "#222222",
          text: "#F5F5F5",
          secondary: "#A3A3A3",
          muted: "#666666",
          red: "#E50914",
          bright: "#FF1A24",
          darkred: "#8B0000"
        }
      },
      boxShadow: { focusred: "0 0 0 3px rgba(229,9,20,.2)" }
    }
  },
  plugins: []
} satisfies Config;
