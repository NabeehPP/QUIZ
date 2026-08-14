import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        gameblue: "#3B5CFF",
        gamepurple: "#8B2FE8",
        gameyellow: "#FFC93C",
        gameorange: "#FF7A29",
        gamepink: "#FF3EA5",
        gamegreen: "#22D67E",
        ink: "#161235",
      },
      fontFamily: {
        display: ["Poppins", "system-ui", "sans-serif"],
      },
      boxShadow: {
        pop: "0 10px 0 0 rgba(0,0,0,0.15)",
        card: "0 20px 45px -12px rgba(22, 18, 53, 0.35)",
      },
      borderRadius: {
        blob: "42% 58% 65% 35% / 45% 40% 60% 55%",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-22px) rotate(8deg)" },
        },
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(18px) rotate(-6deg)" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulseRing: {
          "0%": { transform: "scale(0.9)", opacity: "0.8" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(-3deg)" },
          "50%": { transform: "rotate(3deg)" },
        },
        popIn: {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.05)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%": { transform: "translateX(-6px)" },
          "40%": { transform: "translateX(5px)" },
          "60%": { transform: "translateX(-3px)" },
          "80%": { transform: "translateX(2px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" },
        },
        glowPulse: {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.06)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 8s ease-in-out infinite",
        spinSlow: "spinSlow 14s linear infinite",
        pulseRing: "pulseRing 1.6s ease-out infinite",
        wiggle: "wiggle 2.4s ease-in-out infinite",
        popIn: "popIn 0.5s cubic-bezier(.34,1.56,.64,1) forwards",
        shake: "shake 0.45s ease-in-out",
        shimmer: "shimmer 3.5s linear infinite",
        glowPulse: "glowPulse 2.2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
