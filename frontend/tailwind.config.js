/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        pastel: {
          blue:   '#B3D4FC',
          indigo: '#C5CAE9',
          purple: '#D1C4E9',
          pink:   '#F8BBD0',
          green:  '#C8E6C9',
          yellow: '#FFF9C4',
          orange: '#FFE0B2',
          gray:   '#F5F5F5',
          slate:  '#ECEFF1',
        },
        accent: {
          blue:   '#5C6BC0',
          indigo: '#3F51B5',
          purple: '#7E57C2',
          green:  '#66BB6A',
          red:    '#EF5350',
          orange: '#FFA726',
          yellow: '#F9A825',
        },
      },
    },
  },
  plugins: [],
}
