import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';

export default function ChooseGamePage() {
  const games = [
    {
      name: '9-Pebbles',
      description: 'A classic game of alignment and strategy. Form lines of three to capture opponent pieces.',
      href: '/games/nine-pebbles',
      imageSrc: 'https://picsum.photos/seed/9pebbles/400/250',
      imageAlt: '9-Pebbles game board',
      aiHint: 'abstract strategy'
    },
    // Future games can be added here
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col p-4">
      <header className="flex justify-between items-center py-4 px-2 sm:px-0">
        <Link href="/" passHref>
          <Button variant="outline" size="icon" aria-label="Back to Home">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-3xl font-bold text-primary">Choose Your Arena</h1>
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl w-full p-4">
          {games.map((game) => (
            <Card key={game.name} className="hover:shadow-xl transition-shadow duration-300 group overflow-hidden flex flex-col">
              <CardHeader className="p-0">
                <div className="aspect-[16/10] overflow-hidden">
                  <Image
                    src={game.imageSrc}
                    alt={game.imageAlt}
                    width={400}
                    height={250}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                    data-ai-hint={game.aiHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow">
                <CardTitle className="text-2xl mb-2 text-primary">{game.name}</CardTitle>
                <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                  {game.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-6 pt-0">
                <Link href={game.href} passHref className="w-full">
                  <Button variant="default" className="w-full text-lg py-3 shadow-md hover:shadow-lg transition-shadow">
                    Play Now
                    <ChevronRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
          {games.length === 0 && (
            <p className="text-center text-muted-foreground col-span-full">No games available at the moment. Check back soon!</p>
          )}
        </div>
      </main>
      <footer className="text-center py-4 text-sm text-muted-foreground">
         <p>&copy; {new Date().getFullYear()} Pebble Arena</p>
      </footer>
    </div>
  );
}
