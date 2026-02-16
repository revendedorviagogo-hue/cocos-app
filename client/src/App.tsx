import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { Route, Switch, useLocation } from "wouter";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

/**
 * COCOS APP - APLICAÇÃO ORIGINAL + PAINEL ADMINISTRATIVO
 * 
 * A aplicação Cocos original está em /public/assets/ e funciona 100%.
 * O painel administrativo é acessível em /admin/login e /admin/dashboard
 */
function App() {
  const [location] = useLocation();
  
  // Se estamos em uma rota admin, renderizar APENAS o painel admin
  if (location.startsWith('/admin')) {
    return (
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path="/admin/login" component={AdminLogin} />
            <Route path="/admin/dashboard" component={AdminDashboard} />
            <Route path="/admin">
              {() => {
                window.location.href = "/admin/login";
                return null;
              }}
            </Route>
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  
  // Caso contrário, renderizar o app Cocos original
  return (
    <ThemeProvider defaultTheme="light">
      <TooltipProvider>
        <Toaster />
        {/* A aplicação Cocos original é carregada pelo index.html */}
        {/* Todos os assets estão em /public/assets/ */}
      </TooltipProvider>
    </ThemeProvider>
  );
}

export default App;
