// server/brl3-client.ts
// Cliente HTTP para integração com 3BIT XChange (sistema de mint/burn BRL3)
// Documentação: Quando Palpites.AI faz depósitos/saques PIX, notifica o 3BIT
// para manter a contabilidade blockchain sincronizada

const BRL3_API_URL = process.env.BRL3_API_URL?.replace(/^xhttp/, 'http');
const BRL3_API_KEY = process.env.BRL3_API_KEY;
const BRL3_ADMIN_EXTERNAL_ID = process.env.BRL3_ADMIN_EXTERNAL_ID;

if (!BRL3_API_URL) {
  console.warn("⚠️ BRL3_API_URL não configurada. Integração com 3BIT ficará desativada.");
} else {
  console.log(`🔗 BRL3 Integration: URL configured (${BRL3_API_URL.substring(0, 40)}...)`);
}

if (!BRL3_API_KEY) {
  console.warn("⚠️ BRL3_API_KEY não configurada. Integração com 3BIT ficará desativada.");
} else {
  console.log(`🔑 BRL3 Integration: API Key configured (length: ${BRL3_API_KEY.length})`);
}

if (!BRL3_ADMIN_EXTERNAL_ID) {
  console.warn("⚠️ BRL3_ADMIN_EXTERNAL_ID não configurada. Dual mint/burn desativado.");
} else {
  console.log(`👤 BRL3 Integration: Admin wallet configured (${BRL3_ADMIN_EXTERNAL_ID.substring(0, 10)}...)`);
}

interface PalpitesMintPayload {
  externalUserId: string;
  amountBrl: number;
}

/**
 * Notifica o 3BIT XChange para fazer MINT de tokens BRL3
 * Chamado quando usuário deposita BRL via PIX no Palpites.AI
 * 
 * @param payload - Dados do usuário e valor a ser mintado
 */
export async function notifyMintToBRL3(payload: PalpitesMintPayload): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️ BRL3 Integration disabled - mint notification skipped");
      return;
    }

    const requestBody = {
      externalUserId: payload.externalUserId,
      amountBrl: payload.amountBrl.toFixed(2),
    };

    console.log(`🔄 [BRL3 Mint] Calling ${BRL3_API_URL}/api/palpites/mint`);
    console.log(`📦 [BRL3 Mint] Payload:`, requestBody);

    const res = await fetch(`${BRL3_API_URL}/api/palpites/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      console.error(`❌ [BRL3 Mint] Failed - Status ${res.status}`);
      console.error(`❌ [BRL3 Mint] Response:`, responseText);
      throw new Error(`BRL3 Mint failed with status ${res.status}`);
    } else {
      console.log(`✅ [BRL3 Mint] Success - Status ${res.status}`);
      console.log(`✅ [BRL3 Mint] Response:`, responseText);
      console.log(`✅ [BRL3 Mint] Minted ${payload.amountBrl} BRL3 for user ${payload.externalUserId}`);
    }
  } catch (error) {
    console.error("❌ [BRL3 Mint] Network error:", error);
    if (error instanceof Error) {
      console.error("❌ [BRL3 Mint] Error details:", error.message, error.stack);
    }
    throw error;
  }
}

/**
 * Notifica o 3BIT XChange para fazer DUAL MINT (usuário + admin)
 * Chamado quando admin aprova depósito BRL via PIX
 * 
 * @param payload - Dados do usuário e valor a ser mintado
 */
export async function notifyDualMintToBRL3(payload: PalpitesMintPayload): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️ BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single mint");
    await notifyMintToBRL3(payload);
    return;
  }

  console.log(`🔄 [BRL3 Dual Mint] Starting dual mint for ${payload.amountBrl} BRL`);
  console.log(`👤 [BRL3 Dual Mint] User: ${payload.externalUserId}`);
  console.log(`👤 [BRL3 Dual Mint] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  try {
    await notifyMintToBRL3({
      externalUserId: payload.externalUserId,
      amountBrl: payload.amountBrl,
    });
    console.log(`✅ [BRL3 Dual Mint] User mint completed`);
  } catch (error) {
    console.error(`❌ [BRL3 Dual Mint] User mint failed - rolling back`);
    throw error;
  }

  try {
    await notifyMintToBRL3({
      externalUserId: BRL3_ADMIN_EXTERNAL_ID,
      amountBrl: payload.amountBrl,
    });
    console.log(`✅ [BRL3 Dual Mint] Admin mint completed`);
  } catch (error) {
    console.error(`❌ [BRL3 Dual Mint] Admin mint failed - user mint already completed!`);
    console.error(`⚠️ [BRL3 Dual Mint] Manual intervention required: admin wallet needs ${payload.amountBrl} BRL3 minted`);
    throw error;
  }

  console.log(`✅ [BRL3 Dual Mint] Dual mint successful - ${payload.amountBrl} BRL3 to each wallet`);
}

interface PalpitesBurnPayload {
  externalUserId: string;
  amountBrl: number;
}

/**
 * Notifica o 3BIT XChange para fazer BURN de tokens BRL3
 * Chamado quando usuário saca BRL via PIX do Palpites.AI
 * 
 * @param payload - Dados do usuário e valor a ser queimado
 */
export async function notifyBurnToBRL3(payload: PalpitesBurnPayload): Promise<void> {
  try {
    if (!BRL3_API_URL || !BRL3_API_KEY) {
      console.warn("⚠️ BRL3 Integration disabled - burn notification skipped");
      return;
    }

    const requestBody = {
      externalUserId: payload.externalUserId,
      amountBrl: payload.amountBrl.toFixed(2),
    };

    console.log(`🔄 [BRL3 Burn] Calling ${BRL3_API_URL}/api/palpites/burn`);
    console.log(`📦 [BRL3 Burn] Payload:`, requestBody);

    const res = await fetch(`${BRL3_API_URL}/api/palpites/burn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await res.text();
    
    if (!res.ok) {
      console.error(`❌ [BRL3 Burn] Failed - Status ${res.status}`);
      console.error(`❌ [BRL3 Burn] Response:`, responseText);
      throw new Error(`BRL3 Burn failed with status ${res.status}`);
    } else {
      console.log(`✅ [BRL3 Burn] Success - Status ${res.status}`);
      console.log(`✅ [BRL3 Burn] Response:`, responseText);
      console.log(`🔥 [BRL3 Burn] Burned ${payload.amountBrl} BRL3 from user ${payload.externalUserId}`);
    }
  } catch (error) {
    console.error("❌ [BRL3 Burn] Network error:", error);
    if (error instanceof Error) {
      console.error("❌ [BRL3 Burn] Error details:", error.message, error.stack);
    }
    throw error;
  }
}

/**
 * Notifica o 3BIT XChange para fazer DUAL BURN (usuário + admin)
 * Chamado quando admin aprova saque BRL via PIX
 * 
 * @param payload - Dados do usuário e valor a ser queimado
 */
export async function notifyDualBurnToBRL3(payload: PalpitesBurnPayload): Promise<void> {
  if (!BRL3_ADMIN_EXTERNAL_ID) {
    console.warn("⚠️ BRL3_ADMIN_EXTERNAL_ID not configured - falling back to single burn");
    await notifyBurnToBRL3(payload);
    return;
  }

  console.log(`🔄 [BRL3 Dual Burn] Starting dual burn for ${payload.amountBrl} BRL`);
  console.log(`👤 [BRL3 Dual Burn] User: ${payload.externalUserId}`);
  console.log(`👤 [BRL3 Dual Burn] Admin: ${BRL3_ADMIN_EXTERNAL_ID}`);

  try {
    await notifyBurnToBRL3({
      externalUserId: payload.externalUserId,
      amountBrl: payload.amountBrl,
    });
    console.log(`✅ [BRL3 Dual Burn] User burn completed`);
  } catch (error) {
    console.error(`❌ [BRL3 Dual Burn] User burn failed - rolling back`);
    throw error;
  }

  try {
    await notifyBurnToBRL3({
      externalUserId: BRL3_ADMIN_EXTERNAL_ID,
      amountBrl: payload.amountBrl,
    });
    console.log(`✅ [BRL3 Dual Burn] Admin burn completed`);
  } catch (error) {
    console.error(`❌ [BRL3 Dual Burn] Admin burn failed - user burn already completed!`);
    console.error(`⚠️ [BRL3 Dual Burn] Manual intervention required: admin wallet needs ${payload.amountBrl} BRL3 burned`);
    throw error;
  }

  console.log(`✅ [BRL3 Dual Burn] Dual burn successful - ${payload.amountBrl} BRL3 from each wallet`);
}
