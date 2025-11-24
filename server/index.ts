import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { client } from "./db";
import { stopMirror } from "./mirror/worker";
import { blockchainService } from "./blockchain";

const app = express();

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}

app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Validate required secrets before starting
  const requiredSecrets = [
    'ADMIN_PRIVATE_KEY',
    'POLYGON_RPC_URL',
    'DATABASE_URL',
    'SESSION_SECRET'
  ];

  const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
  
  if (missingSecrets.length > 0) {
    console.error("[Server] ❌ Missing required secrets:", missingSecrets.join(', '));
    console.error("[Server] Please configure these in the Replit Secrets panel");
    process.exit(1);
  }

  // Log blockchain configuration being used
  console.log("[Server] 📋 Blockchain Configuration:");
  console.log(`  - BRL3 Contract: ${process.env.BRL3_CONTRACT_ADDRESS || '0xa2a21D5800E4DA2ec41582C10532aE13BDd4be90'}`);
  console.log(`  - Admin Wallet: ${process.env.ADMIN_WALLET_ADDRESS || '0xCD83c3f36396bcb3569240a3Cb34f037ba310926'}`);
  console.log(`  - Token Decimals: ${process.env.TOKEN_DECIMALS || '18'}`);

  // Initialize blockchain service with validation
  try {
    await blockchainService.initialize();
  } catch (error: any) {
    console.error("[Server] Failed to initialize blockchain service:", error.message);
    console.error("[Server] Deposit/withdrawal approvals will fail until this is resolved");
    // Don't exit - allow server to start for other operations
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  async function gracefulShutdown(signal: string) {
    console.log(`\n[Server] Received ${signal}, starting graceful shutdown...`);
    
    stopMirror();
    
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('[Server] HTTP server closed');
        resolve();
      });
    });

    try {
      await client.end();
      console.log('[Server] Database connection closed');
      process.exit(0);
    } catch (err) {
      console.error('[Server] Error during shutdown:', err);
      process.exit(1);
    }
  }

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    console.error('[Server] Uncaught exception:', err);
    gracefulShutdown('uncaughtException');
  });
})();
