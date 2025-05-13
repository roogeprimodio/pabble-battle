import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Construction } from 'lucide-react';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <header className="flex justify-between items-center py-4 px-2 sm:px-0">
        <Link href="/" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-primary">Settings</h1>
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <Card className="w-full max-w-lg text-center shadow-xl">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <Construction className="h-16 w-16 text-accent" />
            </div>
            <CardTitle className="text-2xl">Under Construction</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg">
              The settings page is currently under development. Please check back later for more options!
            </CardDescription>
            <Link href="/" passHref className="mt-6 block">
              <Button variant="default">Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </main>
       <footer className="text-center py-4 text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
}
