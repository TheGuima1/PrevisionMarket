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

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  // Zod schema for login (defined early for passport strategy)
  const loginSchema = z.object({
    username: z.string(),
    password: z.string(),
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      // Validate credentials
      try {
        loginSchema.parse({ username, password });
      } catch (error) {
        return done(null, false);
      }

      const user = await storage.getUserByUsername(username);
      if (!user || !(await comparePasswords(password, user.password))) {
        return done(null, false);
      } else {
        return done(null, user);
      }
    }),
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

  // Zod schema for registration
  const registerSchema = z.object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(6),
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate input with Zod
      const validated = registerSchema.parse(req.body);

      const existingUser = await storage.getUserByUsername(validated.username);
      if (existingUser) {
        return res.status(400).send("Username already exists");
      }

      const existingEmail = await storage.getUserByEmail(validated.email);
      if (existingEmail) {
        return res.status(400).send("Email already exists");
      }

      const user = await storage.createUser({
        username: validated.username,
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
}
