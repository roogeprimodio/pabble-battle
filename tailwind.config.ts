import type { Config } from "tailwindcss";

export default {
    darkMode: ["class"],
    content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
        'pawn-appear': {
          '0%': { opacity: '0', transform: 'scale(0.5)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'pawn-disappear': {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0', transform: 'scale(0.5)' },
        },
        'subtle-glow': {
          '0%, 100%': { filter: 'drop-shadow(0 0 1.5px currentColor) drop-shadow(0 0 2.5px currentColor) opacity(0.6)' },
          '50%': { filter: 'drop-shadow(0 0 3px currentColor) drop-shadow(0 0 5px currentColor) opacity(0.9)' },
        },
        'halo-pulse': { 
          '0%, 100%': { opacity: '0.7', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.05)' },
        },
        'angel-wings-gentle-flap': { 
          '0%, 100%': { transform: 'translateY(0px) scaleY(1)' },
          '50%': { transform: 'translateY(-0.5px) scaleY(1.05)' },
        },
        'demon-horns-glow': { 
          '0%, 100%': { opacity: '0.8', filter: 'brightness(1)' },
          '50%': { opacity: '1', filter: 'brightness(1.2)' },
        },
        'demon-wings-twitch': {
          '0%, 100%': { transform: 'scaleY(1) rotate(0deg)' },
          '20%': { transform: 'scaleY(0.95) rotate(2deg)' },
          '40%': { transform: 'scaleY(1.02) rotate(-1deg)' },
          '60%': { transform: 'scaleY(0.98) rotate(1deg)' },
          '80%': { transform: 'scaleY(1) rotate(0deg)' },
        },
        'demon-tail-whip': { 
          '0%, 100%': { transform: 'rotate(0deg) translateX(0)' },
          '25%': { transform: 'rotate(-12deg) translateX(0.2px)' },
          '50%': { transform: 'rotate(8deg) translateX(-0.1px)' },
          '75%': { transform: 'rotate(-5deg) translateX(0.1px)' },
        },
        'holy-dispel': { 
          '0%': { opacity: '1', filter: 'brightness(1) drop-shadow(0 0 3px hsl(var(--primary)))' },
          '50%': { opacity: '0.7', filter: 'brightness(1.5) drop-shadow(0 0 8px hsl(var(--primary)))', transform: 'scale(1.1)' },
          '100%': { opacity: '0', filter: 'brightness(2) drop-shadow(0 0 15px hsl(var(--primary)))', transform: 'scale(0.5)' },
        },
        'hellish-banish': { 
          '0%': { opacity: '1', filter: 'brightness(1) drop-shadow(0 0 3px hsl(var(--destructive)))' }, // Changed from accent to destructive
          '50%': { opacity: '0.7', filter: 'brightness(1.5) drop-shadow(0 0 8px hsl(var(--destructive)))', transform: 'scale(1.1) rotate(5deg)' }, // Changed from accent to destructive
          '100%': { opacity: '0', filter: 'brightness(2) drop-shadow(0 0 15px hsl(var(--destructive)))', transform: 'scale(0.5) rotate(-10deg)' }, // Changed from accent to destructive
        },
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
        'pawn-appear': 'pawn-appear 0.3s ease-out forwards',
        'pawn-disappear': 'pawn-disappear 0.3s ease-out forwards',
        'subtle-glow': 'subtle-glow 2.2s infinite ease-in-out alternate',
        'halo-pulse': 'halo-pulse 2.8s infinite ease-in-out',
        'angel-wings-gentle-flap': 'angel-wings-gentle-flap 3s infinite ease-in-out',
        'demon-horns-glow': 'demon-horns-glow 2.5s infinite ease-in-out alternate',
        'demon-wings-twitch': 'demon-wings-twitch 2s infinite ease-in-out',
        'demon-tail-whip': 'demon-tail-whip 1.6s infinite ease-in-out',
        'holy-dispel': 'holy-dispel 0.7s ease-out forwards',
        'hellish-banish': 'hellish-banish 0.7s ease-out forwards',
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
