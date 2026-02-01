import React, { useEffect } from 'react';
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from './components/ui/sonner';
import { AppProvider, useAppContext } from './context/AppContext';
import { InputForm } from './components/custom/InputForm';
import { PaletteCard } from './components/custom/PaletteCard';
import { ChatPanel } from './components/custom/ChatPanel';
import { Button } from './components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from './components/ui/sheet';
import { Skeleton } from './components/ui/skeleton';
import { ScrollArea } from './components/ui/scroll-area';
import { 
  MessageCircle, 
  RefreshCw, 
  Palette, 
  Star,
  Trash2
} from 'lucide-react';
import axios from 'axios';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const EmptyState = () => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <div className="relative mb-6">
      <div className="w-32 h-32 rounded-full bg-secondary flex items-center justify-center">
        <Palette className="w-16 h-16 text-muted-foreground/30" />
      </div>
    </div>
    <h3 className="font-heading font-bold text-2xl mb-2">No Palettes Yet</h3>
    <p className="text-muted-foreground max-w-sm">
      Fill in your business details above and click "Generate Palettes" to get AI-powered color recommendations.
    </p>
  </div>
);

const LoadingSkeleton = () => (
  <div className="space-y-6">
    {[1, 2, 3].map((i) => (
      <div key={i} className="rounded-xl border border-border overflow-hidden">
        <Skeleton className="h-32 rounded-none" />
        <div className="p-4 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </div>
    ))}
  </div>
);

const MainContent = () => {
  const { 
    palettes, 
    favorites,
    isGenerating, 
    setRateLimits,
    clearAllData,
    rateLimits
  } = useAppContext();

  const [showFavoritesOnly, setShowFavoritesOnly] = React.useState(false);

  // Fetch rate limits on mount
  useEffect(() => {
    const fetchRateLimits = async () => {
      try {
        const response = await axios.get(`${API}/rate-limit`);
        setRateLimits(response.data);
      } catch (error) {
        console.error('Failed to fetch rate limits:', error);
      }
    };
    fetchRateLimits();
  }, [setRateLimits]);

  const displayedPalettes = showFavoritesOnly 
    ? palettes.filter(p => favorites.includes(p.id))
    : palettes;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 min-h-screen">
      {/* Main Canvas */}
      <main className="lg:col-span-8 xl:col-span-9 overflow-y-auto" data-testid="main-canvas">
        <div className="p-6 md:p-12">
          {/* Header */}
          <header className="mb-8">
            <h1 className="font-heading font-extrabold text-4xl md:text-5xl lg:text-6xl tracking-tight">
              ChromaBiz
            </h1>
            <p className="text-lg text-muted-foreground mt-2 max-w-xl">
              AI-powered color palettes tailored to your business, audience, and market.
            </p>
          </header>

          {/* Input Form */}
          <InputForm />

          {/* Palettes Section */}
          {palettes.length > 0 && (
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <h2 className="font-heading font-bold text-2xl">
                  Generated Palettes
                </h2>
                <span className="text-sm text-muted-foreground">
                  {palettes.length} palette{palettes.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Favorites Filter */}
                {favorites.length > 0 && (
                  <Button
                    variant={showFavoritesOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                    data-testid="filter-favorites-button"
                  >
                    <Star className={`w-4 h-4 mr-1 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                    Favorites ({favorites.length})
                  </Button>
                )}
                
                {/* Clear All */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllData}
                  className="text-muted-foreground hover:text-destructive"
                  data-testid="clear-all-button"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Clear All
                </Button>
              </div>
            </div>
          )}

          {/* Content */}
          {isGenerating ? (
            <LoadingSkeleton />
          ) : palettes.length === 0 ? (
            <EmptyState />
          ) : displayedPalettes.length === 0 ? (
            <div className="text-center py-12">
              <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No favorite palettes yet</p>
              <Button 
                variant="link" 
                onClick={() => setShowFavoritesOnly(false)}
                className="mt-2"
              >
                View all palettes
              </Button>
            </div>
          ) : (
            <div className="space-y-6" data-testid="palettes-container">
              {displayedPalettes.map((palette, index) => (
                <PaletteCard key={palette.id} palette={palette} index={index} />
              ))}
            </div>
          )}

          {/* Rate Limit Info */}
          {palettes.length > 0 && (
            <div className="mt-8 pt-6 border-t border-border text-center">
              <p className="text-xs text-muted-foreground">
                {rateLimits.generations_remaining} generation{rateLimits.generations_remaining !== 1 ? 's' : ''} remaining today
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Chat Panel - Desktop */}
      <aside className="hidden lg:flex lg:col-span-4 xl:col-span-3 h-screen border-l border-border bg-background/50 backdrop-blur-xl p-6 flex-col sticky top-0">
        <ChatPanel />
      </aside>

      {/* Chat Panel - Mobile (Sheet) */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              size="lg"
              className="rounded-full shadow-lg h-14 w-14 p-0"
              data-testid="mobile-chat-button"
            >
              <MessageCircle className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <div className="h-full p-6">
              <ChatPanel />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

function App() {
  return (
    <AppProvider>
      <div className="App min-h-screen bg-background">
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<MainContent />} />
            <Route path="*" element={<MainContent />} />
          </Routes>
        </BrowserRouter>
        <Toaster position="bottom-right" />
      </div>
    </AppProvider>
  );
}

export default App;
