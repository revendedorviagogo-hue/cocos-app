import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { MobileProvider } from "./contexts/MobileContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MobileProvider>
    <App />
  </MobileProvider>
);
