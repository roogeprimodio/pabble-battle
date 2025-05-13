import type { Metadata } from 'next';
import { Inter } from 'next/font/google'; // Changed from Geist_Sans to Inter
import './globals.css';
import { ThemeProvider } from '@/app/(components)/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ // Changed from Geist_Sans to Inter
  variable: '--font-inter', // Changed variable name
  subsets: ['latin'],
});

// Geist Mono is not explicitly requested, can be removed if not used.
// For now, keep it as it was in the original scaffold.
// const geistMono = Geist_Mono({
//   variable: '--font-geist-mono',
//   subsets: ['latin'],
// });

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
      <body className={`${inter.variable} antialiased`}> {/* Updated to use inter.variable */}
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
