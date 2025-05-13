import type { Metadata } from 'next';
import { Geist_Sans } from 'next/font/google'; // Corrected import
import './globals.css';
import { ThemeProvider } from '@/app/(components)/ThemeProvider';
import { Toaster } from '@/components/ui/toaster';

const geistSans = Geist_Sans({ // Corrected usage
  variable: '--font-geist-sans',
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
      <body className={`${geistSans.variable} antialiased`}>
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
