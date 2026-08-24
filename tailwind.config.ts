export default {
  darkMode: 'class',
  content: [
    './app/**/*.{vue,js,ts,jsx,tsx}',
    './components/**/*.{vue,js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#fc9fa8',
        accent: '#f57aa5',
        back: '#f5f3f3',
        surface: 'rgb(var(--color-surface) / <alpha-value>)',
        'surface-elevated':
          'rgb(var(--color-surface-elevated) / <alpha-value>)',
        'surface-muted': 'rgb(var(--color-surface-muted) / <alpha-value>)',
        fg: 'rgb(var(--color-fg) / <alpha-value>)',
        'fg-muted': 'rgb(var(--color-fg-muted) / <alpha-value>)',
        'border-subtle': 'rgb(var(--color-border-subtle) / <alpha-value>)',
      },
    },
  },
};
