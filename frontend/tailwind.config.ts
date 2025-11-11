import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        'primary-blue': 'var(--primary-blue)',
        'primary-purple': 'var(--primary-purple)',
        'success-green': 'var(--success-green)',
        'warning-orange': 'var(--warning-orange)',
        'error-red': 'var(--error-red)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        text: 'var(--color-text)',
        'text-weak': 'var(--color-text-weak)',
        icon: 'var(--color-icon)',
        'border-strong': 'var(--color-border-strong)',
        'bg-dark-accent': 'var(--color-background-dark-accent)',
        border: 'var(--color-border)',
        'nav-topbar': 'var(--color-navigation-topbar-background)',
      },
      borderRadius: {
        common: 'var(--border-radius)',
      },
      boxShadow: {
        common: 'var(--box-shadow-common)',
      },
    },
  },
  plugins: [],
} satisfies Config
