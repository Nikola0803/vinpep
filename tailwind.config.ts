/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── Vintage Peptides palette ───────────────────────────────────────
        parchment: '#F0E6D0',
        cream: '#EDE4CC',
        ivory: '#FAF6ED',
        espresso: '#2B1A0E',
        walnut: '#3D2410',
        saddle: '#6B4226',
        leather: '#7A5C3A',
        brass: '#B8942A',
        'brass-light': '#D4B84A',
        'brass-dark': '#8A6E1F',
        // ── Valkyrie Peptides (spa) palette ───────────────────────────────
        'spa-white':      '#FAFAF8',
        'spa-pearl':      '#F5F0EB',
        'spa-blush':      '#F2E8E4',
        'spa-blush-deep': '#E8D5CE',
        'spa-cream':      '#F7F2EE',
        'spa-rose':       '#C4746E',
        'spa-rose-light': '#D9948E',
        'spa-rose-dark':  '#A85C56',
        'spa-mauve':      '#9B7B7B',
        'spa-dusty':      '#B89090',
        'spa-sage':       '#8FAF96',
        'spa-sage-light': '#B2CAB8',
        'spa-sage-dark':  '#6A9172',
        'spa-ink':        '#2C2424',
        'spa-stone':      '#5C4F4F',
        'spa-muted':      '#9B8888',
        'spa-border':     '#E2D5D0',
        'spa-border-soft':'#EDE3DF',
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['Lora', 'serif'],
        mono: ['"Courier Prime"', 'monospace'],
        // Spa fonts — active in spa build
        'spa-display': ['"Cormorant Garamond"', '"Libre Baskerville"', 'Georgia', 'serif'],
        'spa-body':    ['Inter', '"Helvetica Neue"', 'sans-serif'],
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
      letterSpacing: {
        'widest': '0.25em',
        'ultra': '0.35em',
      },
      borderRadius: {
        'xs': '2px',
      },
      animation: {
        'ticker': 'ticker 30s linear infinite',
        'ticker-slow': 'ticker 45s linear infinite',
        'fade-in': 'fadeIn 0.6s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
      },
      keyframes: {
        ticker: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}