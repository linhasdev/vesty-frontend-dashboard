import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      colors: {
        card: '#dddddd',
        'accent-green': {
          DEFAULT: '#10b981',
          dark: '#047857',
          light: '#34d399',
        }
      },
      borderRadius: {
        card: '0.75rem',
      }
    },
  },
  plugins: [],
};
export default config;
