// server/brl3-client.ts
// Cliente HTTP para integração com 3BIT XChange (sistema de mint/burn BRL3)
// Documentação: Quando Palpites.AI faz depósitos/saques PIX, notifica o 3BIT
// para manter a contabilidade blockchain sincronizada

const BRL3_API_URL = process.env.BRL3_API_URL?.replace(/^xhttp/, 'http');
const BRL3_API_KEY = process.env.BRL3_API_KEY;

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
  }
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
  }
}
