import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AppContent = () => {
  // Check for admin bypass
  if (typeof window !== 'undefined') {
    if (window.location.search.includes('admin=naujaras')) {
      localStorage.setItem('admin_access', 'true');
    }
  }
  
  const isMaintenance = typeof window !== 'undefined' && localStorage.getItem('admin_access') !== 'true';

  if (isMaintenance) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#111', color: 'white', fontFamily: 'system-ui, sans-serif' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#B3915F' }}>Naujarás</h1>
        <p style={{ fontSize: '1.2rem', color: '#ccc' }}>Página web en mantenimiento.</p>
        <p style={{ fontSize: '1rem', color: '#888', marginTop: '0.5rem' }}>Volveremos a estar disponibles muy pronto.</p>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

const App = () => <AppContent />;

export default App;
