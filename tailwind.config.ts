import type { Config } from 'tailwindcss'

export default {
  content: ['./src/renderer/**/*.{js,ts,jsx,tsx,html}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        profit: '#10b981',
        loss: '#ef4444',
        neutral: {
          800: '#1a2332',
          900: '#161b22',
          950: '#0d1117'
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'Cascadia Code', 'monospace']
      }
    }
  },
  plugins: []
} satisfies Config
