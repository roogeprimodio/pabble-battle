
// src/app/games/tic-tac-toe/page.tsx
import { Suspense } from 'react';
import TicTacToeClientPage from './components/TicTacToeClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { Gamepad2 } from 'lucide-react'; // Example icon

// A simple loading fallback component
function TicTacToeLoadingFallback() {
  // This skeleton should ideally mimic the layout of TicTacToeClientPage
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 items-center justify-center text-center">
      <Gamepad2 className="h-16 w-16 text-primary animate-pulse mb-4" />
      <h1 className="text-3xl font-bold text-primary font-heading mb-2">Loading Tic-Tac-Toe...</h1>
      <p className="text-muted-foreground mb-6">Please wait while we set up the arena!</p>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        <div className="flex items-stretch justify-center gap-2 sm:gap-3 mb-3">
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
          <Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full self-center" />
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto mb-4 rounded-md" />
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-muted/30 rounded-lg aspect-square">
          {[...Array(9)].map((_, i) => (
            <Skeleton key={i} className="aspect-square rounded-md bg-card/50" />
          ))}
        </div>
      </div>
       <p className="text-sm text-muted-foreground mt-8">&copy; {new Date().getFullYear()} Pebble Arena</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<TicTacToeLoadingFallback />}>
      <TicTacToeClientPage />
    </Suspense>
  );
}

    
