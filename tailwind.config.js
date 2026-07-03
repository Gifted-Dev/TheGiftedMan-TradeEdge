/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        // design tokens — single source of truth lives in index.css
        base: 'var(--bg)',
        'surface-0': 'var(--surface-0)',
        'surface-1': 'var(--surface-1)',
        'surface-2': 'var(--surface-2)',
        line: 'var(--border)',
        'line-strong': 'var(--border-strong)',
        ink: 'var(--text-primary)',
        'ink-2': 'var(--text-secondary)',
        'ink-3': 'var(--text-muted)',
        accent: 'var(--accent)',
        'accent-text': 'var(--text-accent)',
        win: 'var(--text-success)',
        loss: 'var(--text-danger)',
        warn: 'var(--text-warning)',
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
        'card-hover': 'var(--shadow-card-hover)',
        soft: '0 24px 70px rgba(2, 8, 23, 0.35)',
      },
    },
  },
  plugins: [],
}
