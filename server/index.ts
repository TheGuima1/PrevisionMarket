import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { client, testConnection } from "./db";
import { stopEventSync } from "./mirror/event-sync-worker";
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
  // CRITICAL: Open port FIRST before any slow operations
  // This prevents deployment timeout errors
  const port = parseInt(process.env.PORT || '5000', 10);
  
  // Register routes first (they handle their own errors if DB not ready)
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";

    // Handle Neon database suspension errors with user-friendly message
    if (message.includes('endpoint has been disabled') || message.includes('Neon')) {
      message = "O sistema está iniciando. Por favor, atualize a página em alguns segundos.";
      console.error(`[Database] Neon endpoint suspended, connection will retry automatically`);
    } else {
      console.error(`[Error] ${status}: ${message}`, err.stack || err);
    }
    
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });

  // Setup static serving or Vite
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // START LISTENING IMMEDIATELY - this is critical for deployment health checks
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });

  // NOW do slow initialization tasks asynchronously (after port is open)
  setImmediate(async () => {
    console.log("[Server] Starting background initialization...");

    // Validate required secrets
    const requiredSecrets = [
      'POLYGON_RPC_URL',
      'SESSION_SECRET'
    ];

    const missingSecrets = requiredSecrets.filter(secret => !process.env[secret]);
    
    if (missingSecrets.length > 0) {
      console.error("[Server] ⚠️ Missing optional secrets:", missingSecrets.join(', '));
    }

    // Test database connection with retries (handles Neon cold starts)
    const dbConnected = await testConnection(5, 2000);
    if (!dbConnected) {
      console.error("[Server] ⚠️ Database connection delayed - will retry on requests");
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
    }

    console.log("[Server] ✓ Background initialization complete");
  });

  async function gracefulShutdown(signal: string) {
    console.log(`\n[Server] Received ${signal}, starting graceful shutdown...`);
    
    stopEventSync();
    
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
