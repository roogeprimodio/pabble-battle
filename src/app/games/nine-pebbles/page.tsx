// src/app/games/nine-pebbles/page.tsx
import { Suspense } from 'react';
import NinePebblesClientPage from './components/NinePebblesClientPage';
import { Skeleton } from '@/components/ui/skeleton';
import { Swords } from 'lucide-react'; // Example icon

// A simple loading fallback component specifically for NinePebbles
function NinePebblesLoadingFallback() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-background to-secondary/20 p-4 items-center justify-center text-center">
      <Swords className="h-16 w-16 text-primary animate-pulse mb-4" />
      <h1 className="text-3xl font-bold text-primary font-heading mb-2">Loading 9-Pebbles...</h1>
      <p className="text-muted-foreground mb-6">Preparing the ancient battlefield!</p>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        {/* Simplified Status Skeleton */}
        <div className="flex items-stretch justify-center gap-2 sm:gap-3 mb-3">
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
          <Skeleton className="w-5 h-5 sm:w-6 sm:w-6 rounded-full self-center" />
          <Skeleton className="h-[70px] sm:h-[80px] flex-1 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-3/4 mx-auto mb-4 rounded-md" />
        {/* Simplified Board Skeleton */}
        <div className="aspect-square bg-muted/30 rounded-lg p-2 sm:p-4">
          <Skeleton className="w-full h-full rounded-md bg-card/50" />
        </div>
      </div>
       <p className="text-sm text-muted-foreground mt-8">&copy; {new Date().getFullYear()} Pebble Arena</p>
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<NinePebblesLoadingFallback />}>
      <NinePebblesClientPage />
    </Suspense>
  );
}
