
import type { Metadata } from 'next';
import { Lora, Playfair_Display } from 'next/font/google'; // Changed fonts
import './globals.css';
import { ThemeProvider } from '@/app/(components)/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

const lora = Lora({
  variable: '--font-lora',
  subsets: ['latin'],
  display: 'swap',
});

const playfairDisplay = Playfair_Display({
  variable: '--font-playfair',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '700'],
});

export const metadata: Metadata = {
  title: 'Pebble Arena',
  description: 'Strategic pebble game',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' }, // Standard favicon
      { url: '/logo.svg', type: 'image/svg+xml' }, // Example if you have an SVG version
    ],
    apple: '/apple-touch-icon.png', // For Apple devices
    // You can add other icons for different purposes if needed
    // shortcut: '/shortcut-icon.png', // Example for shortcut icon
    // other: [
    //   {
    //     rel: 'icon',
    //     url: '/favicon-16x16.png',
    //     sizes: '16x16',
    //   },
    //   {
    //     rel: 'icon',
    //     url: '/favicon-32x32.png',
    //     sizes: '32x32',
    //   },
    // ],
  },
  // If you have a manifest.json, you can also link it here
  // manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${lora.variable} ${playfairDisplay.variable} antialiased`}> {/* Updated font variables */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
