import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gamepad2, SettingsIcon } from 'lucide-react';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-background to-secondary/30 p-4">
      <header className="absolute top-4 right-4">
        <ThemeToggle />
      </header>
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="inline-flex items-center justify-center mb-4">
            {/* Simple geometric icon for Pebble Arena */}
            <svg width="60" height="60" viewBox="0 0 100 100" className="text-primary drop-shadow-lg">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" />
              <circle cx="50" cy="50" r="25" fill="currentColor" className="text-accent" />
              <circle cx="35" cy="35" r="8" fill="hsl(var(--background))" />
              <circle cx="65" cy="35" r="8" fill="hsl(var(--background))" />
              <circle cx="50" cy="65" r="8" fill="hsl(var(--background))" />
            </svg>
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight text-primary font-heading">Pebble Arena</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col space-y-4 p-6">
          <Link href="/choose-game" passHref>
            <Button variant="default" size="lg" className="w-full text-lg py-6 shadow-md hover:shadow-lg transition-shadow">
              <Gamepad2 className="mr-3 h-6 w-6" />
              Choose Game
            </Button>
          </Link>
          <Link href="/settings" passHref>
            <Button variant="secondary" size="lg" className="w-full text-lg py-6 shadow-md hover:shadow-lg transition-shadow">
              <SettingsIcon className="mr-3 h-6 w-6" />
              Settings
            </Button>
          </Link>
        </CardContent>
      </Card>
      <footer className="mt-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Pebble Arena. All rights reserved.</p>
      </footer>
    </div>
  );
}
