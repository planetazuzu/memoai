import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { useState, useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";
import { usePWA } from "@/hooks/use-pwa";
import { Search, Moon, Sun, MoreVertical, Download, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import { GlobalSearch } from "@/components/global-search";
import Home from "@/pages/home";
import Chat from "@/pages/chat";
import Agenda from "@/pages/agenda";
import Diary from "@/pages/diary";
import Photos from "@/pages/photos";
import History from "@/pages/history";
import SettingsPage from "@/pages/settings";
import AISettings from "@/pages/ai-settings";
import NotFound from "@/pages/not-found";

function Header({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const { theme, toggleTheme } = useTheme();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  
  return (
    <>
      <header className="bg-card border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-lg font-semibold">MemoAI</h1>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setIsSearchOpen(true)}
            data-testid="button-search"
          >
            <Search className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={toggleTheme} data-testid="button-theme-toggle">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onTabChange('settings')}
            data-testid="button-menu"
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      <GlobalSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
      />
    </>
  );
}

function Router() {
  const [currentTab, setCurrentTab] = useState('home');
  
  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home />;
      case 'agenda':
        return <Agenda />;
      case 'diary':
        return <Diary />;
      case 'photos':
        return <Photos />;
      case 'history':
        return <History />;
      case 'assistant':
        return <Chat />;
      case 'settings':
        return <SettingsPage />;
      case 'ai-settings':
        return <AISettings />;
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <Header onTabChange={setCurrentTab} />
      <main className="pb-20">
        {renderContent()}
      </main>
      <Navigation currentTab={currentTab} onTabChange={setCurrentTab} />
    </div>
  );
}

function App() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="memoai-theme">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
