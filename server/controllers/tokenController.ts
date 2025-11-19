/**
 * Token Controller
 * Handles mint and burn operations for BRL3 tokens on Polygon blockchain
 */

import { Request, Response } from 'express';
import { getContract, toTokenUnits, fromTokenUnits, getSigner } from '../blockchain/contract';
import { ethers } from 'ethers';

/**
 * Admin Mint - Create new BRL3 tokens
 * POST /api/token/admin/mint
 * Body: { to: string, amount: number }
 */
export async function adminMint(req: Request, res: Response) {
  try {
    const { to, amount } = req.body;

    // Validation
    if (!to || !ethers.isAddress(to)) {
      return res.status(400).json({
        success: false,
        error: 'Endereço de destino inválido',
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade deve ser maior que zero',
      });
    }

    console.log(`[Token Controller] 🪙 Iniciando mint de ${amount} BRL3 para ${to}`);

    // Convert amount to token units (considering decimals)
    const tokenUnits = toTokenUnits(amount);
    console.log(`[Token Controller] 💱 Convertido: ${amount} BRL3 → ${tokenUnits.toString()} units`);

    // Get contract instance
    const contract = getContract();
    const signer = getSigner();

    console.log(`[Token Controller] 📝 Enviando transação de mint...`);

    // Call mint function on contract
    const tx = await contract.mint(to, tokenUnits);
    console.log(`[Token Controller] ⏳ Transação enviada: ${tx.hash}`);
    console.log(`[Token Controller] 🔗 Polygonscan: https://polygonscan.com/tx/${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`[Token Controller] ✅ Mint confirmado no bloco ${receipt.blockNumber}`);

    return res.json({
      success: true,
      hash: tx.hash,
      message: `Mint de ${amount} BRL3 realizado com sucesso`,
      details: {
        to,
        amount,
        tokenUnits: tokenUnits.toString(),
        blockNumber: receipt.blockNumber,
        from: signer.address,
        polygonscan: `https://polygonscan.com/tx/${tx.hash}`,
      },
    });
  } catch (error: any) {
    console.error('[Token Controller] ❌ Erro no mint:', error);

    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(500).json({
        success: false,
        error: 'Saldo insuficiente de MATIC para pagar gas',
      });
    }

    if (error.message?.includes('AccessControl')) {
      return res.status(403).json({
        success: false,
        error: 'Admin não possui MINTER_ROLE no contrato',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao realizar mint',
    });
  }
}

/**
 * Admin Burn - Destroy BRL3 tokens from admin wallet
 * POST /api/token/admin/burn
 * Body: { amount: number }
 */
export async function adminBurn(req: Request, res: Response) {
  try {
    const { amount } = req.body;

    // Validation
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Quantidade deve ser maior que zero',
      });
    }

    console.log(`[Token Controller] 🔥 Iniciando burn de ${amount} BRL3`);

    // Convert amount to token units (considering decimals)
    const tokenUnits = toTokenUnits(amount);
    console.log(`[Token Controller] 💱 Convertido: ${amount} BRL3 → ${tokenUnits.toString()} units`);

    // Get contract instance
    const contract = getContract();
    const signer = getSigner();

    console.log(`[Token Controller] 📝 Enviando transação de burn...`);

    // Call burn function on contract
    const tx = await contract.burn(tokenUnits);
    console.log(`[Token Controller] ⏳ Transação enviada: ${tx.hash}`);
    console.log(`[Token Controller] 🔗 Polygonscan: https://polygonscan.com/tx/${tx.hash}`);

    // Wait for confirmation
    const receipt = await tx.wait();
    console.log(`[Token Controller] ✅ Burn confirmado no bloco ${receipt.blockNumber}`);

    return res.json({
      success: true,
      hash: tx.hash,
      message: `Burn de ${amount} BRL3 realizado com sucesso`,
      details: {
        amount,
        tokenUnits: tokenUnits.toString(),
        blockNumber: receipt.blockNumber,
        from: signer.address,
        polygonscan: `https://polygonscan.com/tx/${tx.hash}`,
      },
    });
  } catch (error: any) {
    console.error('[Token Controller] ❌ Erro no burn:', error);

    // Handle specific errors
    if (error.code === 'INSUFFICIENT_FUNDS') {
      return res.status(500).json({
        success: false,
        error: 'Saldo insuficiente de MATIC para pagar gas',
      });
    }

    if (error.message?.includes('ERC20: burn amount exceeds balance')) {
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente de BRL3 para burn',
      });
    }

    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao realizar burn',
    });
  }
}

/**
 * Get blockchain status
 * GET /api/token/status
 */
export async function getBlockchainStatus(req: Request, res: Response) {
  try {
    const { healthCheck } = await import('../blockchain/contract');
    const status = await healthCheck();

    return res.json({
      success: true,
      ...status,
    });
  } catch (error: any) {
    console.error('[Token Controller] ❌ Erro ao verificar status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao verificar status da blockchain',
    });
  }
}
