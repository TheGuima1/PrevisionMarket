// server/brl3-client.ts
// Integração on-chain com o token BRL3 na Polygon
// Agora usa polygonClient para mint/burn direto na blockchain (EIP-2612)

import { mintTo, burnFromAdmin, isPolygonEnabled, getAdminAddress } from './polygonClient';
import { storage } from './storage';


/**
 * Mintar tokens para a carteira do ADMIN (admin-only custody).
 * Usuário recebe saldo no database, mas tokens ficam na admin wallet.
 * A quantidade recebida deve ser um número em BRL; a função converte internamente para unidades do token.
 */
export async function notifyMintToBRL3(
  userId: string, 
  amount: number, 
  depositId: string
): Promise<void> {
  const amountStr = amount.toFixed(2);
  
  const onchainOp = await storage.createOnchainOperation({
    userId,
    type: "mint",
    amount: amountStr,
    status: "pending",
  });

  try {
    if (!isPolygonEnabled()) {
      throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
    }

    // ADMIN-ONLY CUSTODY: Sempre mintar para admin wallet
    const adminAddress = getAdminAddress();
    const txHash = await mintTo(adminAddress, amountStr);
    
    await storage.updateOnchainOperation(onchainOp.id, {
      txHash,
      status: "confirmed",
      confirmedAt: new Date(),
    });
    
    console.log(`✅ [MINT ADMIN-ONLY] Depósito ${depositId}: mintado ${amount} BRL3 tokens para admin wallet ${adminAddress}. Tx: ${txHash}`);
  } catch (error: any) {
    await storage.updateOnchainOperation(onchainOp.id, {
      status: "failed",
      errorMessage: error.message || "Erro desconhecido ao mintar tokens",
    });
    throw error;
  }
}

/**
 * Burn simples da admin wallet (admin-only). Usuário recebe PIX, admin burna tokens
 * de sua própria wallet on-chain. Usuário não precisa de wallet Polygon configurada.
 */
export async function notifyBurnToBRL3(
  userId: string, 
  amount: number, 
  withdrawalId: string
): Promise<void> {
  const amountStr = amount.toFixed(2);
  
  const onchainOp = await storage.createOnchainOperation({
    userId,
    type: "burn",
    amount: amountStr,
    status: "pending",
  });

  try {
    if (!isPolygonEnabled()) {
      throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
    }

    const txHash = await burnFromAdmin(amountStr);
    
    await storage.updateOnchainOperation(onchainOp.id, {
      txHash,
      status: "confirmed",
      confirmedAt: new Date(),
    });
    
    console.log(`✅ [BURN] Saque ${withdrawalId}: burned ${amount} BRL3 tokens da admin wallet. Tx: ${txHash}`);
  } catch (error: any) {
    await storage.updateOnchainOperation(onchainOp.id, {
      status: "failed",
      errorMessage: error.message || "Erro desconhecido ao queimar tokens",
    });
    throw error;
  }
}

