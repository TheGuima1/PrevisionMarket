/**
 * Token Routes
 * API endpoints for BRL3 token mint/burn operations
 * ⚠️ PROTECTED: All admin operations require authentication + admin role
 */

import { Router, Request, Response } from 'express';
import { adminMint, adminBurn, getBlockchainStatus } from '../controllers/tokenController';

const router = Router();

// Middleware: Require authentication
function requireAuth(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ 
      success: false,
      error: "Não autorizado. Faça login para continuar." 
    });
  }
  next();
}

// Middleware: Require admin role
function requireAdmin(req: Request, res: Response, next: Function) {
  if (!req.isAuthenticated() || !req.user?.isAdmin) {
    return res.status(403).json({ 
      success: false,
      error: "Acesso negado. Apenas administradores podem executar esta operação." 
    });
  }
  next();
}

/**
 * POST /api/token/admin/mint
 * Mint new BRL3 tokens to a specific address
 * 🔒 Requires: Admin authentication
 * Body: { to: string, amount: number }
 * 
 * Example:
 * {
 *   "to": "0xcd83c3f36396bcb3569240a3cb34f037ba310926",
 *   "amount": 100
 * }
 */
router.post('/admin/mint', requireAuth, requireAdmin, adminMint);

/**
 * POST /api/token/admin/burn
 * Burn BRL3 tokens from admin wallet
 * 🔒 Requires: Admin authentication
 * Body: { amount: number }
 * 
 * Example:
 * {
 *   "amount": 50
 * }
 */
router.post('/admin/burn', requireAuth, requireAdmin, adminBurn);

/**
 * GET /api/token/status
 * Get blockchain connection status and admin balances
 * 🔒 Requires: Admin authentication
 */
router.get('/status', requireAuth, requireAdmin, getBlockchainStatus);

export default router;
