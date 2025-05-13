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
