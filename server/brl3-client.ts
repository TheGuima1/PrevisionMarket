// server/brl3-client.ts
// Cliente HTTP para integração com 3BIT XChange (sistema de mint/burn BRL3)
// Documentação: Quando Palpites.AI faz depósitos/saques PIX, notifica o 3BIT
// para manter a contabilidade blockchain sincronizada

const BRL3_API_URL = process.env.BRL3_API_URL;
const BRL3_API_KEY = process.env.BRL3_API_KEY;

if (!BRL3_API_URL) {
  console.warn("⚠️ BRL3_API_URL não configurada. Integração com 3BIT ficará desativada.");
}

if (!BRL3_API_KEY) {
  console.warn("⚠️ BRL3_API_KEY não configurada. Integração com 3BIT ficará desativada.");
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
      // Integração desativada - não quebra o fluxo da Palpites
      return;
    }

    const res = await fetch(`${BRL3_API_URL}/api/palpites/mint`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify({
        externalUserId: payload.externalUserId,
        amountBrl: payload.amountBrl.toFixed(2),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Falha ao notificar BRL3 (mint):", res.status, text);
    } else {
      console.log(`✅ Notificado BRL3 (mint): user=${payload.externalUserId}, amount=${payload.amountBrl}`);
    }
  } catch (error) {
    console.error("❌ Erro ao chamar BRL3 (mint):", error);
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
      // Integração desativada - não quebra o fluxo da Palpites
      return;
    }

    const res = await fetch(`${BRL3_API_URL}/api/palpites/burn`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": BRL3_API_KEY,
      },
      body: JSON.stringify({
        externalUserId: payload.externalUserId,
        amountBrl: payload.amountBrl.toFixed(2),
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      console.error("❌ Falha ao notificar BRL3 (burn):", res.status, text);
    } else {
      console.log(`🔥 Notificado BRL3 (burn): user=${payload.externalUserId}, amount=${payload.amountBrl}`);
    }
  } catch (error) {
    console.error("❌ Erro ao chamar BRL3 (burn):", error);
  }
}
