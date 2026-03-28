/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Industry Precision palette - mapped to CSS variables
        ji: {
          bg:          'var(--color-bg)',
          surface:     'var(--color-surface)',
          'surface-alt': 'var(--color-surface-alt)',
          border:      'var(--color-border)',
          'border-hover': 'var(--color-border-hover)',
          amber:       'var(--color-amber)',
          text:        'var(--color-text)',
          'text-muted': 'var(--color-text-muted)',
        },
      },
      fontFamily: {
        playfair:  ['"Playfair Display"', 'serif'],
        ibm:       ['"IBM Plex Sans"', 'sans-serif'],
        jetbrains: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'amber-glow': '0 0 20px rgba(245, 158, 11, 0.05)',
        'amber-focus': '0 0 0 1px rgba(245, 158, 11, 0.5), 0 0 12px rgba(245, 158, 11, 0.1)',
      },
    },
  },
  plugins: [],
}
