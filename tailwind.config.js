/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
            color: 'inherit',
            a: {
              color: '#3182ce',
              '&:hover': {
                color: '#2c5282',
              },
            },
            pre: {
              color: 'inherit',
              backgroundColor: 'transparent',
            },
            code: {
              color: 'inherit',
              backgroundColor: 'transparent',
            },
            blockquote: {
              color: 'inherit',
              borderLeftColor: '#718096',
            },
            hr: {
              borderColor: '#718096',
            },
            'thead th': {
              color: 'inherit',
            },
            'tbody tr': {
              borderBottomColor: '#718096',
            },
          },
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 