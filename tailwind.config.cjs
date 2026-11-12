/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{tsx,ts,jsx,js}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        ice: {
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        dark: {
          900: '#03060f',
          800: '#060c1a',
          700: '#0a1428',
          600: '#0f1c38',
          500: '#152247',
          400: '#1e2f55',
        },
        navy: {
          950: '#020617',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
        },
        accent: {
          DEFAULT: '#0369A1',
          bright: '#0077b6',
          cyan: '#00b4d8',
        },
        // Tokens sémantiques (valeurs dans src/styles/app.css :root) — text-fg-*, bg-surface-*, border-line-*
        fg: Object.fromEntries([
          'heading', 'ink', 'ink-slate', 'body', 'muted', 'subtle', 'gray', 'faint', 'disabled', 'link', 'brand',
          'success', 'success-bright', 'success-deep', 'success-alt', 'danger', 'danger-bright', 'warning',
          'warning-bright', 'amber', 'violet', 'violet-bright', 'whatsapp', 'navy-soft', 'sky', 'on-dark',
          'on-dark-soft', 'on-dark-success', 'on-dark-accent', 'on-dark-danger', 'on-dark-info', 'on-dark-warning',
          'on-dark-violet',
        ].map((n) => [n, `var(--fg-${n})`])),
        surface: Object.fromEntries([
          'card', 'subtle', 'muted', 'base', 'info', 'info-alt', 'accent', 'brand', 'brand-cyan', 'sky', 'sky-deep',
          'navy', 'blue', 'success', 'success-bright',
        ].map((n) => [n, `var(--surface-${n})`])),
        line: {
          DEFAULT: 'var(--line)',
          strong: 'var(--line-strong)',
          accent: 'var(--line-accent)',
          brand: 'var(--line-brand)',
          soft: 'var(--line-soft)',
        },
        // Back-office (variables scopées sous .admin-ui dans public/static/admin-tokens.css)
        'admin-fg': 'var(--admin-text-primary)',
        'admin-muted': 'var(--admin-text-muted)',
        'admin-accent': 'var(--admin-accent)',
        'admin-card': 'var(--admin-card-bg)',
        'admin-bg': 'var(--admin-bg)',
        'admin-elevated': 'var(--admin-bg-elevated)',
        'admin-line': 'var(--admin-border)',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Sora', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
