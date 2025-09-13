import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { Navigation } from "@/components/navigation";
import { useState, useEffect } from "react";
import { registerServiceWorker } from "@/lib/pwa";
import { Search, Moon, Sun, MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/theme-provider";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";

function Header() {
  const { theme, toggleTheme } = useTheme();
  
  return (
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
        <Button variant="ghost" size="sm" data-testid="button-search">
          <Search className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={toggleTheme} data-testid="button-theme-toggle">
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </Button>
        <Button variant="ghost" size="sm" data-testid="button-menu">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
}

function Router() {
  const [currentTab, setCurrentTab] = useState('home');
  
  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home />;
      case 'agenda':
        return (
          <div className="px-4 py-6 pb-24">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Agenda & Tareas</h2>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Función en desarrollo</p>
                <p className="text-sm text-muted-foreground">Las tareas se mostrarán aquí después del análisis IA</p>
              </div>
            </div>
          </div>
        );
      case 'diary':
        return (
          <div className="px-4 py-6 pb-24">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Diario Personal</h2>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Función en desarrollo</p>
                <p className="text-sm text-muted-foreground">Las entradas de diario se generarán automáticamente</p>
              </div>
            </div>
          </div>
        );
      case 'history':
        return (
          <div className="px-4 py-6 pb-24">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Historial</h2>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Función en desarrollo</p>
                <p className="text-sm text-muted-foreground">La línea de tiempo se mostrará aquí</p>
              </div>
            </div>
          </div>
        );
      case 'assistant':
        return (
          <div className="px-4 py-6 pb-24">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Asistente IA</h2>
              <div className="text-center py-12">
                <p className="text-muted-foreground">Función en desarrollo</p>
                <p className="text-sm text-muted-foreground">El chat con IA estará disponible pronto</p>
              </div>
            </div>
          </div>
        );
      default:
        return <NotFound />;
    }
  };

  return (
    <div className="max-w-md mx-auto bg-background min-h-screen relative">
      <Header />
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
