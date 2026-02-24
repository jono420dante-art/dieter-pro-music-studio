import type { Config } from 'tailwindcss';

const config: Config = {
  // Dark mode via class strategy
  darkMode: ['class'],

  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  theme: {
    extend: {
      // DIETER PRO color palette - dark studio aesthetic
      colors: {
        // Primary: Electric purple/violet
        primary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
          950: '#2e1065',
        },
        // Accent: Electric cyan
        accent: {
          50:  '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          950: '#083344',
        },
        // Studio dark backgrounds
        studio: {
          950: '#0a0a0f',   // deepest bg
          900: '#0f0f1a',   // main bg
          850: '#12121f',   // card bg
          800: '#161625',   // elevated card
          750: '#1a1a2e',   // sidebar bg
          700: '#1e1e38',   // hover bg
          600: '#252545',   // borders
          500: '#30305a',   // muted borders
          400: '#4a4a80',   // muted text bg
        },
        // Status colors
        success: '#10b981',
        warning: '#f59e0b',
        error:   '#ef4444',
        info:    '#3b82f6',
      },

      // Custom animations
      animation: {
        'fade-in':       'fadeIn 0.3s ease-in-out',
        'fade-out':      'fadeOut 0.3s ease-in-out',
        'slide-up':      'slideUp 0.3s ease-out',
        'slide-down':    'slideDown 0.3s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-glow':    'pulseGlow 2s ease-in-out infinite',
        'waveform':      'waveform 1s ease-in-out infinite alternate',
        'spin-slow':     'spin 3s linear infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'gradient-x':    'gradientX 3s ease infinite',
      },
      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%':   { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideUp: {
          '0%':   { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' },
        },
        slideDown: {
          '0%':   { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
        slideInLeft: {
          '0%':   { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)',     opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)' },
          '50%':      { boxShadow: '0 0 25px rgba(139, 92, 246, 0.8)' },
        },
        waveform: {
          '0%':   { transform: 'scaleY(0.3)' },
          '100%': { transform: 'scaleY(1)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-4px)' },
        },
        gradientX: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%':      { backgroundPosition: '100% 50%' },
        },
      },

      // Typography
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
        display: ['Cal Sans', 'Inter', 'sans-serif'],
      },

      // Extended border radius
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },

      // Extended backdrop blur
      backdropBlur: {
        xs: '2px',
      },

      // Extended box shadows
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(139, 92, 246, 0.3)',
        'glow':     '0 0 20px rgba(139, 92, 246, 0.4)',
        'glow-lg':  '0 0 40px rgba(139, 92, 246, 0.5)',
        'glow-xl':  '0 0 80px rgba(139, 92, 246, 0.6)',
        'cyan-glow': '0 0 20px rgba(6, 182, 212, 0.4)',
        'inner-glow': 'inset 0 0 20px rgba(139, 92, 246, 0.2)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.4)',
        'elevated': '0 8px 40px rgba(0, 0, 0, 0.6)',
      },

      // Background gradients
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':   'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'studio-gradient':  'linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0a0a0f 100%)',
        'purple-glow':      'radial-gradient(circle at center, rgba(139,92,246,0.15) 0%, transparent 70%)',
      },
    },
  },

  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
};

export default config;
