// Code based on javascript_auth_all_persistance blueprint
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Export hashPassword for use in reset password
export { hashPassword };

export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax', // 'lax' allows same-site navigation while still protecting against CSRF
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Zod schema for login (defined early for passport strategy)
  const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
  });

  passport.use(
    new LocalStrategy(
      { usernameField: 'email' }, // Use email instead of username
      async (email, password, done) => {
        // Validate credentials
        try {
          loginSchema.parse({ email, password });
        } catch (error) {
          return done(null, false);
        }

        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      }
    ),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    const user = await storage.getUser(id);
    done(null, user);
  });

  // Sanitize user object before sending to client
  function sanitizeUser(user: SelectUser) {
    const { password, ...sanitized } = user;
    return sanitized;
  }

  // Zod schema for registration (email+password only)
  const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input with Zod
      const validated = registerSchema.parse(req.body);

      const existingEmail = await storage.getUserByEmail(validated.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        email: validated.email,
        password: await hashPassword(validated.password),
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(sanitizeUser(user));
      });
    } catch (error: any) {
      res.status(400).send(error.message || "Registration failed");
    }
  });

  app.post("/api/login", (req, res, next) => {
    try {
      // Validate input with Zod - this ensures only validated fields reach passport
      const validated = loginSchema.parse(req.body);
      
      // Replace req.body with validated data so passport only sees validated fields
      req.body = validated;
      
      // Now authenticate with passport
      passport.authenticate("local", (err: any, user: SelectUser | false, info: any) => {
        if (err) return next(err);
        if (!user) return res.status(401).send("Invalid credentials");
        
        req.login(user, (err) => {
          if (err) return next(err);
          res.status(200).json(sanitizeUser(user));
        });
      })(req, res, next);
    } catch (error: any) {
      res.status(400).send(error.message || "Login failed");
    }
  });

  // Admin login with password only
  app.post("/api/auth/admin-login", async (req, res, next) => {
    try {
      const adminPasswordSchema = z.object({
        password: z.string(),
      });

      const validated = adminPasswordSchema.parse(req.body);
      const adminPassword = process.env.ADMIN_PASSWORD;

      if (!adminPassword) {
        return res.status(500).send("Senha de administrador não configurada");
      }

      if (validated.password !== adminPassword) {
        return res.status(401).send("Senha de administrador incorreta");
      }

      // Find admin user
      const adminUser = await storage.getUserByUsername("admin");
      if (!adminUser) {
        return res.status(500).send("Usuário administrador não encontrado");
      }

      // Login as admin
      req.login(adminUser, (err) => {
        if (err) return next(err);
        res.status(200).json(sanitizeUser(adminUser));
      });
    } catch (error: any) {
      res.status(400).send(error.message || "Falha no login de administrador");
    }
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(sanitizeUser(req.user!));
  });

  // Set username after first login
  app.put("/api/user/username", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const setUsernameSchema = z.object({
        username: z.string()
          .min(3, "Username deve ter no mínimo 3 caracteres")
          .max(20, "Username deve ter no máximo 20 caracteres")
          .regex(/^[a-zA-Z0-9_]+$/, "Username deve conter apenas letras, números e underscores"),
      });

      const validated = setUsernameSchema.parse(req.body);

      // Check if user already has a username
      if (req.user!.username) {
        return res.status(400).send("Username already set");
      }

      // Check if username is already taken
      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).send("Username already taken");
      }

      // Update username
      const updatedUser = await storage.updateUserUsername(req.user!.id, validated.username);
      res.json(sanitizeUser(updatedUser));
    } catch (error: any) {
      res.status(400).send(error.message || "Failed to set username");
    }
  });

  // ===== FORGOT PASSWORD ROUTES =====
  
  // POST /api/auth/request-reset - Request password reset
  app.post("/api/auth/request-reset", async (req, res) => {
    try {
      const requestResetSchema = z.object({
        email: z.string().email("Email inválido"),
      });

      const validated = requestResetSchema.parse(req.body);
      const user = await storage.getUserByEmail(validated.email);

      if (!user) {
        return res.status(404).json({ error: "Usuário não cadastrado." });
      }

      // Generate JWT token valid for 1 hour
      const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.SESSION_SECRET!,
        { expiresIn: "1h" }
      );

      // MVP: Return reset link directly in response (no email configured yet)
      const resetUrl = `${req.protocol}://${req.get('host')}/reset-password?token=${token}`;
      console.log("📧 LINK DE RESET:", resetUrl);

      res.json({
        success: true,
        message: "Link de redefinição gerado com sucesso!",
        resetLink: resetUrl,
      });
    } catch (error: any) {
      console.error("Error in request-reset:", error);
      res.status(400).json({ error: error.message || "Falha ao solicitar reset de senha." });
    }
  });

  // POST /api/auth/reset-password - Reset password with token
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const resetPasswordSchema = z.object({
        token: z.string(),
        newPassword: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
      });

      const validated = resetPasswordSchema.parse(req.body);

      // Verify JWT token
      const decoded = jwt.verify(
        validated.token,
        process.env.SESSION_SECRET!
      ) as { userId: string; email: string };

      // Hash new password
      const hashedPassword = await hashPassword(validated.newPassword);

      // Update password in database
      await storage.updateUserPassword(decoded.userId, hashedPassword);

      res.json({
        success: true,
        message: "Senha atualizada com sucesso! Você já pode fazer login.",
      });
    } catch (error: any) {
      console.error("Error in reset-password:", error);
      if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
        return res.status(400).json({ error: "Token inválido ou expirado." });
      }
      res.status(400).json({ error: error.message || "Falha ao redefinir senha." });
    }
  });
}
