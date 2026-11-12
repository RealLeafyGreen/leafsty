import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./leafsty/**/*.{js,ts,jsx,tsx,mdx}", // Ensures styles are read from your subfolder
  ],
  theme: {
    extend: {
      colors: {
        discord: "#289da2",
      },
    },
  },
  plugins: [],
};

export default config;
