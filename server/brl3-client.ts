// server/brl3-client.ts
// Cliente HTTP para integração com X-CHANGE (sistema de mint/burn BRL3 via blockchain)
// Documentação: Quando Palpites.AI aprova depósitos/saques, envia webhook para X-CHANGE
// criando operação pendente que deve ser aprovada manualmente no dashboard X-CHANGE

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

interface XChangeWebhookPayload {
  type: "mint" | "burn";
  amount: string;
  user_id: string;
  reference_id: string;
  metadata: Record<string, any>;
}

/**
 * Envia webhook para X-CHANGE criar operação pendente de MINT
 * Após chamar esta função, admin deve aprovar manualmente no dashboard X-CHANGE
 * 
 * @param userId - ID do usuário no Palpites.AI
 * @param amount - Valor em BRL a ser mintado
 * @param referenceId - ID único da operação (depositId)
 */
export async function notifyMintToBRL3(
  userId: string,
  amount: number,
  referenceId: string
): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️  X-CHANGE Integration disabled - mint webhook skipped");
      return;
    }

    const requestBody: XChangeWebhookPayload = {
      type: "mint",
      amount: amount.toFixed(2),
      user_id: userId,
      reference_id: referenceId,
      metadata: {
        platform: "palpites.ai",
        operation: "deposit_approval",
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`🔄 [X-CHANGE Mint] Calling ${BRL3_API_URL}/api/operations/webhook`);
    console.log(`📦 [X-CHANGE Mint] Payload:`, JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${BRL3_API_URL}/api/operations/webhook`, {
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
      throw new Error(`X-CHANGE mint webhook failed with status ${res.status}`);
    }

    console.log(`✅ [X-CHANGE Mint] Webhook sent - Status ${res.status}`);
    console.log(`✅ [X-CHANGE Mint] Response:`, responseData);
    console.log(`🎯 [X-CHANGE Mint] Operation pending in X-CHANGE dashboard`);
    console.log(`📋 [X-CHANGE Mint] Amount: ${amount} BRL | User: ${userId} | Ref: ${referenceId}`);
    
    if (responseData && responseData.operation_id) {
      console.log(`🆔 [X-CHANGE Mint] Operation ID: ${responseData.operation_id}`);
    }
  } catch (error) {
    console.error("❌ [X-CHANGE Mint] Network error:", error);
    if (error instanceof Error) {
      console.error("❌ [X-CHANGE Mint] Error details:", error.message);
    }
    throw error;
  }
}

/**
 * Envia webhook para X-CHANGE criar operação pendente de BURN
 * Após chamar esta função, admin deve aprovar manualmente no dashboard X-CHANGE
 * 
 * @param userId - ID do usuário no Palpites.AI
 * @param amount - Valor em BRL a ser queimado
 * @param referenceId - ID único da operação (withdrawalId)
 */
export async function notifyBurnToBRL3(
  userId: string,
  amount: number,
  referenceId: string
): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️  X-CHANGE Integration disabled - burn webhook skipped");
      return;
    }

    const requestBody: XChangeWebhookPayload = {
      type: "burn",
      amount: amount.toFixed(2),
      user_id: userId,
      reference_id: referenceId,
      metadata: {
        platform: "palpites.ai",
        operation: "withdrawal_approval",
        timestamp: new Date().toISOString(),
      },
    };

    console.log(`🔄 [X-CHANGE Burn] Calling ${BRL3_API_URL}/api/operations/webhook`);
    console.log(`📦 [X-CHANGE Burn] Payload:`, JSON.stringify(requestBody, null, 2));

    const res = await fetch(`${BRL3_API_URL}/api/operations/webhook`, {
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
      throw new Error(`X-CHANGE burn webhook failed with status ${res.status}`);
    }

    console.log(`✅ [X-CHANGE Burn] Webhook sent - Status ${res.status}`);
    console.log(`✅ [X-CHANGE Burn] Response:`, responseData);
    console.log(`🎯 [X-CHANGE Burn] Operation pending in X-CHANGE dashboard`);
    console.log(`📋 [X-CHANGE Burn] Amount: ${amount} BRL | User: ${userId} | Ref: ${referenceId}`);
    
    if (responseData && responseData.operation_id) {
      console.log(`🆔 [X-CHANGE Burn] Operation ID: ${responseData.operation_id}`);
    }
  } catch (error) {
    console.error("❌ [X-CHANGE Burn] Network error:", error);
    if (error instanceof Error) {
      console.error("❌ [X-CHANGE Burn] Error details:", error.message);
    }
    throw error;
  }
}

/**
 * Envia DUAL MINT webhooks para X-CHANGE (usuário + admin)
 * Cria duas operações pendentes que devem ser aprovadas no dashboard X-CHANGE
 * 
 * @param userId - ID do usuário depositante
 * @param amount - Valor em BRL a ser mintado para cada wallet
 * @param referenceId - ID único do depósito original
 */
export async function notifyDualMintToBRL3(
  userId: string,
  amount: number,
  referenceId: string
): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️  BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single mint");
    await notifyMintToBRL3(userId, amount, referenceId);
    return;
  }

  console.log(`🔄 [X-CHANGE Dual Mint] Starting dual mint for ${amount} BRL`);
  console.log(`👤 [X-CHANGE Dual Mint] User: ${userId}`);
  console.log(`👤 [X-CHANGE Dual Mint] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  // Mint para o usuário
  try {
    await notifyMintToBRL3(userId, amount, `${referenceId}_user`);
    console.log(`✅ [X-CHANGE Dual Mint] User webhook sent successfully`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Mint] User webhook failed`);
    throw error;
  }

  // Mint para o admin
  try {
    await notifyMintToBRL3(BRL3_ADMIN_EXTERNAL_ID, amount, `${referenceId}_admin`);
    console.log(`✅ [X-CHANGE Dual Mint] Admin webhook sent successfully`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Mint] Admin webhook failed - user webhook already sent!`);
    console.error(`⚠️  [X-CHANGE Dual Mint] Manual intervention: approve both operations in X-CHANGE dashboard`);
    throw error;
  }

  console.log(`✅ [X-CHANGE Dual Mint] Both webhooks sent - ${amount} BRL to each wallet`);
  console.log(`🎯 [X-CHANGE Dual Mint] Approve both operations in X-CHANGE dashboard to complete minting`);
}

/**
 * Envia DUAL BURN webhooks para X-CHANGE (usuário + admin)
 * Cria duas operações pendentes que devem ser aprovadas no dashboard X-CHANGE
 * 
 * @param userId - ID do usuário solicitante do saque
 * @param amount - Valor em BRL a ser queimado de cada wallet
 * @param referenceId - ID único do saque original
 */
export async function notifyDualBurnToBRL3(
  userId: string,
  amount: number,
  referenceId: string
): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️  BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single burn");
    await notifyBurnToBRL3(userId, amount, referenceId);
    return;
  }

  console.log(`🔄 [X-CHANGE Dual Burn] Starting dual burn for ${amount} BRL`);
  console.log(`👤 [X-CHANGE Dual Burn] User: ${userId}`);
  console.log(`👤 [X-CHANGE Dual Burn] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  // Burn do usuário
  try {
    await notifyBurnToBRL3(userId, amount, `${referenceId}_user`);
    console.log(`✅ [X-CHANGE Dual Burn] User webhook sent successfully`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Burn] User webhook failed`);
    throw error;
  }

  // Burn do admin
  try {
    await notifyBurnToBRL3(BRL3_ADMIN_EXTERNAL_ID, amount, `${referenceId}_admin`);
    console.log(`✅ [X-CHANGE Dual Burn] Admin webhook sent successfully`);
  } catch (error) {
    console.error(`❌ [X-CHANGE Dual Burn] Admin webhook failed - user webhook already sent!`);
    console.error(`⚠️  [X-CHANGE Dual Burn] Manual intervention: approve both operations in X-CHANGE dashboard`);
    throw error;
  }

  console.log(`✅ [X-CHANGE Dual Burn] Both webhooks sent - ${amount} BRL from each wallet`);
  console.log(`🎯 [X-CHANGE Dual Burn] Approve both operations in X-CHANGE dashboard to complete burning`);
}
