import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/Login";
import PixPayment from "@/pages/PixPayment";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path={"/login"} component={Login} />
      <Route path={"/pix"} component={() => <ProtectedRoute component={PixPayment} />} />
      <Route path={"/"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/home"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/portfolio"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/cedears"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/acciones"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/instrumentos"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/dmep"} component={() => <ProtectedRoute component={Home} />} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
