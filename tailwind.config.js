/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        background: '#ffffff',
        foreground: '#171717',
        'admin-sidebar': '#4a9bb8',
        'admin-sidebar-dark': '#3d8aa6',
        'admin-bg': '#f1f6f9',
        'admin-card': '#ffffff',
        'admin-text': '#1f2937',
        'admin-muted': '#6b7280',
        'brand-blue': '#0ea5e9',
        'brand-blue-dark': '#0284c7',
        'brand-navy': '#1e3a8a',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'Arial', 'Helvetica', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
    },
  },
  plugins: [],
};
