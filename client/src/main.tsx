import { createRoot } from "react-dom/client";
import App from "./App";
import { MobileProvider } from "./contexts/MobileContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <MobileProvider>
    <App />
  </MobileProvider>
);
