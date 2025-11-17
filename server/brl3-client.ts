// server/brl3-client.ts
// Cliente HTTP para integração com X-CHANGE (sistema de mint/burn BRL3 via blockchain)
// X-CHANGE executa operações on-chain na Polygon após receber webhooks do Palpites.AI

const BRL3_API_URL = process.env.BRL3_API_URL?.replace(/^xhttp/, 'http');
const BRL3_API_KEY = process.env.BRL3_API_KEY;
const BRL3_ADMIN_EXTERNAL_ID = process.env.BRL3_ADMIN_EXTERNAL_ID;

if (!BRL3_API_URL) {
  console.warn("⚠️  BRL3_API_URL não configurada. Integração com X-CHANGE desativada.");
} else {
  console.log(`🔗 X-CHANGE Integration: URL configured (${BRL3_API_URL.substring(0, 40)}...)`);
}

if (!BRL3_API_KEY) {
  console.warn("⚠️  BRL3_API_KEY não configurada. Integração com X-CHANGE desativada.");
} else {
  console.log(`🔑 X-CHANGE Integration: API Key configured (length: ${BRL3_API_KEY.length})`);
}

if (!BRL3_ADMIN_EXTERNAL_ID) {
  console.warn("⚠️  BRL3_ADMIN_EXTERNAL_ID não configurada. Dual mint/burn desativado.");
} else {
  console.log(`👤 X-CHANGE Integration: Admin wallet configured (${BRL3_ADMIN_EXTERNAL_ID.substring(0, 10)}...)`);
}

interface XChangeMintPayload {
  amount: string;
  user_id: string;
  deposit_id: string;
}

interface XChangeBurnPayload {
  amount: string;
  user_id: string;
  withdrawal_id: string;
}

/**
 * Envia requisição para X-CHANGE executar MINT on-chain
 * X-CHANGE minta tokens BRL3 imediatamente na blockchain Polygon
 * 
 * @param userId - ID do usuário no Palpites.AI
 * @param amount - Valor em BRL a ser mintado
 * @param depositId - ID único do depósito
 */
export async function notifyMintToBRL3(
  userId: string,
  amount: number,
  depositId: string
): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️  X-CHANGE Integration disabled - mint request skipped");
      return;
    }

    const requestBody: XChangeMintPayload = {
      amount: amount.toFixed(2),
      user_id: userId,
      deposit_id: depositId,
    };

    console.log(`🔄 [X-CHANGE Mint] Calling ${BRL3_API_URL}/mint`);
    console.log(`📦 [X-CHANGE Mint] Payload:`, JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${BRL3_API_URL}/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!res.ok) {
      console.error(`❌ [X-CHANGE Mint] Failed - Status ${res.status}`);
      console.error(`❌ [X-CHANGE Mint] Response:`, responseData);
      throw new Error(`X-CHANGE mint failed with status ${res.status}: ${JSON.stringify(responseData)}`);
    }

    console.log(`✅ [X-CHANGE Mint] Success - Status ${res.status}`);
    console.log(`✅ [X-CHANGE Mint] Response:`, responseData);
    console.log(`🔥 [X-CHANGE Mint] Minted ${amount} BRL3 on-chain`);
    console.log(`📋 [X-CHANGE Mint] Amount: ${amount} BRL | User: ${userId} | Deposit: ${depositId}`);
    
    if (responseData && responseData.txHash) {
      console.log(`🔗 [X-CHANGE Mint] Transaction: ${responseData.txHash}`);
    }
  } catch (error) {
    console.error("❌ [X-CHANGE Mint] Error:", error);
    if (error instanceof Error) {
      console.error("❌ [X-CHANGE Mint] Error details:", error.message);
    }
    throw error;
  }
}

/**
 * Envia requisição para X-CHANGE executar BURN on-chain
 * X-CHANGE queima tokens BRL3 imediatamente na blockchain Polygon
 * 
 * @param userId - ID do usuário no Palpites.AI
 * @param amount - Valor em BRL a ser queimado
 * @param withdrawalId - ID único do saque
 */
export async function notifyBurnToBRL3(
  userId: string,
  amount: number,
  withdrawalId: string
): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️  X-CHANGE Integration disabled - burn request skipped");
      return;
    }

    const requestBody: XChangeBurnPayload = {
      amount: amount.toFixed(2),
      user_id: userId,
      withdrawal_id: withdrawalId,
    };

    console.log(`🔄 [X-CHANGE Burn] Calling ${BRL3_API_URL}/burn`);
    console.log(`📦 [X-CHANGE Burn] Payload:`, JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${BRL3_API_URL}/burn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    let responseData;
    
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }

    if (!res.ok) {
      console.error(`❌ [X-CHANGE Burn] Failed - Status ${res.status}`);
      console.error(`❌ [X-CHANGE Burn] Response:`, responseData);
      throw new Error(`X-CHANGE burn failed with status ${res.status}: ${JSON.stringify(responseData)}`);
    }

    console.log(`✅ [X-CHANGE Burn] Success - Status ${res.status}`);
    console.log(`✅ [X-CHANGE Burn] Response:`, responseData);
    console.log(`🔥 [X-CHANGE Burn] Burned ${amount} BRL3 on-chain`);
    console.log(`📋 [X-CHANGE Burn] Amount: ${amount} BRL | User: ${userId} | Withdrawal: ${withdrawalId}`);
    
    if (responseData && responseData.txHash) {
      console.log(`🔗 [X-CHANGE Burn] Transaction: ${responseData.txHash}`);
    }
  } catch (error) {
    console.error("❌ [X-CHANGE Burn] Error:", error);
    if (error instanceof Error) {
      console.error("❌ [X-CHANGE Burn] Error details:", error.message);
    }
    throw error;
  }
}

/**
 * Executa DUAL MINT (usuário + admin) via X-CHANGE
 * Minta tokens para ambas as wallets na blockchain Polygon
 * 
 * @param userId - ID do usuário depositante
 * @param amount - Valor em BRL a ser mintado para cada wallet
 * @param depositId - ID único do depósito original
 */
export async function notifyDualMintToBRL3(
  userId: string,
  amount: number,
  depositId: string
): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️  BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single mint");
    await notifyMintToBRL3(userId, amount, depositId);
    return;
  }

  console.log(`🔄 [X-CHANGE Dual Mint] Starting dual mint for ${amount} BRL`);
  console.log(`👤 [X-CHANGE Dual Mint] User: ${userId}`);
  console.log(`👤 [X-CHANGE Dual Mint] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  // Mint para o usuário
  try {
    await notifyMintToBRL3(userId, amount, `${depositId}_user`);
    console.log(`✅ [X-CHANGE Dual Mint] User mint completed`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Mint] User mint failed`);
    throw error;
  }

  // Mint para o admin
  try {
    await notifyMintToBRL3(BRL3_ADMIN_EXTERNAL_ID, amount, `${depositId}_admin`);
    console.log(`✅ [X-CHANGE Dual Mint] Admin mint completed`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Mint] Admin mint failed - user mint already completed!`);
    console.error(`⚠️  [X-CHANGE Dual Mint] Manual check required: verify user mint succeeded`);
    throw error;
  }

  console.log(`✅ [X-CHANGE Dual Mint] Both mints completed - ${amount} BRL3 to each wallet`);
  console.log(`🔥 [X-CHANGE Dual Mint] Total minted on-chain: ${amount * 2} BRL3`);
}

/**
 * Executa DUAL BURN (usuário + admin) via X-CHANGE
 * Queima tokens de ambas as wallets na blockchain Polygon
 * 
 * @param userId - ID do usuário solicitante do saque
 * @param amount - Valor em BRL a ser queimado de cada wallet
 * @param withdrawalId - ID único do saque original
 */
export async function notifyDualBurnToBRL3(
  userId: string,
  amount: number,
  withdrawalId: string
): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️  BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single burn");
    await notifyBurnToBRL3(userId, amount, withdrawalId);
    return;
  }

  console.log(`🔄 [X-CHANGE Dual Burn] Starting dual burn for ${amount} BRL`);
  console.log(`👤 [X-CHANGE Dual Burn] User: ${userId}`);
  console.log(`👤 [X-CHANGE Dual Burn] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  // Burn do usuário
  try {
    await notifyBurnToBRL3(userId, amount, `${withdrawalId}_user`);
    console.log(`✅ [X-CHANGE Dual Burn] User burn completed`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Burn] User burn failed`);
    throw error;
  }

  // Burn do admin
  try {
    await notifyBurnToBRL3(BRL3_ADMIN_EXTERNAL_ID, amount, `${withdrawalId}_admin`);
    console.log(`✅ [X-CHANGE Dual Burn] Admin burn completed`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Burn] Admin burn failed - user burn already completed!`);
    console.error(`⚠️  [X-CHANGE Dual Burn] Manual check required: verify user burn succeeded`);
    throw error;
  }

  console.log(`✅ [X-CHANGE Dual Burn] Both burns completed - ${amount} BRL3 from each wallet`);
  console.log(`🔥 [X-CHANGE Dual Burn] Total burned on-chain: ${amount * 2} BRL3`);
}
