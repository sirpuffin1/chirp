import { type Config } from "tailwindcss";
import plugin from 'tailwindcss/plugin';

export default {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addComponents}) {
      addComponents({
        '.hide-scrollbar::-webkit-scrollbar': {
          display: 'none',
        }
      })
    }, { theme: { extend: {} } }) 
  ],
} satisfies Config;
