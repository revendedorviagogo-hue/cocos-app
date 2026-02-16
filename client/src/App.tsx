import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";

/**
 * COCOS APP - APLICAÇÃO ORIGINAL
 * 
 * Este é o wrapper React que carrega a aplicação Cocos original.
 * A aplicação original está em /public/assets/ e funciona 100%.
 * 
 * O React apenas fornece o contexto de tema e notificações.
 * O resto é a aplicação original funcionando normalmente.
 */
function App() {
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
