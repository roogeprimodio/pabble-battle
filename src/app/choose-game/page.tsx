
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { ThemeToggle } from '@/app/(components)/ThemeToggle';
import NinePebblesBoardPreview from './components/NinePebblesBoardPreview';
import TicTacToeBoardPreview from './components/TicTacToeBoardPreview';
import SoulShardsBoardPreview from '../games/soul-shards/components/SoulShardsBoardPreview';

export default function ChooseGamePage() {
  const games = [
    {
      name: '9-Pebbles',
      description: 'A classic game of alignment and strategy. Form lines of three to capture opponent pieces.',
      href: '/games/nine-pebbles',
      previewComponent: <NinePebblesBoardPreview />,
    },
    {
      name: 'Tic-Tac-Toe',
      description: 'The timeless game of X\'s and O\'s. Align three of your marks to win before your opponent does.',
      href: '/games/tic-tac-toe',
      previewComponent: <TicTacToeBoardPreview />,
    },
    {
      name: 'Soul Shards',
      description: 'A strategic battle for mystical Soul Shards. Deploy units, manage resources, and outwit your foe. (Under Development)',
      href: '/games/soul-shards',
      previewComponent: <SoulShardsBoardPreview />,
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
        <h1 className="text-3xl font-bold text-primary font-heading">Choose Your Arena</h1>
        <ThemeToggle />
      </header>
      
      <main className="flex-grow flex items-center justify-center">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-6xl w-full p-4">
          {games.map((game) => (
            <Link key={game.name} href={game.href} passHref className="block h-full">
              <Card className="hover:shadow-2xl transition-all duration-300 ease-in-out group flex flex-col h-full overflow-hidden cursor-pointer ring-1 ring-transparent hover:ring-primary/30 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none">
                <CardHeader className="p-0">
                  {game.previewComponent ? (
                    game.previewComponent
                  ) : (
                    <div className="aspect-[16/10] bg-muted flex items-center justify-center rounded-t-lg">
                      <span className="text-muted-foreground text-sm">Game Preview Unavailable</span>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="p-5 sm:p-6 flex-grow">
                  <CardTitle className="text-xl sm:text-2xl mb-2 text-primary group-hover:text-primary/90 transition-colors font-heading">
                    {game.name}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground text-xs sm:text-sm leading-relaxed">
                    {game.description}
                  </CardDescription>
                </CardContent>
                <div className="p-5 pt-0 sm:p-6 sm:pt-0 mt-auto">
                  <div className="flex items-center text-sm font-medium text-primary group-hover:text-primary/90 transition-colors">
                    Enter Arena
                    <ChevronRight className="ml-1.5 h-4 w-4 group-hover:translate-x-1 transition-transform duration-200 ease-in-out" />
                  </div>
                </div>
              </Card>
            </Link>
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
