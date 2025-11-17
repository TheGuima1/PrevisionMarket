// server/brl3-client.ts
// Integração on-chain com o token BRL3 na Polygon
// Agora usa polygonClient para mint/burn direto na blockchain (EIP-2612)

import { mintTo, burnWithPermit, mintDual, burnDual, isPolygonEnabled } from './polygonClient';
import { db } from './db';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

/**
 * Recupera o endereço da carteira Polygon de um usuário a partir de seu ID.
 * Retorna erro se usuário não tiver carteira configurada.
 */
async function getUserWalletAddress(userId: string): Promise<string> {
  const result = await db
    .select({ address: users.walletAddress })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  
  const addr = result?.[0]?.address;
  if (!addr) {
    throw new Error(`Usuário ${userId} não possui carteira Polygon configurada. Configure em Perfil.`);
  }
  return addr;
}

/**
 * Mintar tokens somente para o usuário (versão simples).
 * A quantidade recebida deve ser um número em BRL; a função converte internamente para unidades do token.
 */
export async function notifyMintToBRL3(
  userId: string, 
  amount: number, 
  depositId: string
): Promise<void> {
  if (!isPolygonEnabled()) {
    throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
  }

  const wallet = await getUserWalletAddress(userId);
  const amountStr = amount.toFixed(2);
  const txHash = await mintTo(wallet, amountStr);
  console.log(`✅ [MINT] Depósito ${depositId}: mintado ${amount} tokens para ${wallet}. Tx: ${txHash}`);
}

/**
 * Burn com permit (usuário paga zero gas). É necessário que, ao solicitar o saque,
 * o frontend envie a assinatura (v,r,s) e o deadline obtidos do usuário. Para
 * simplificação, esta função recebe esses dados através do objeto `permitData`.
 */
export async function notifyBurnToBRL3(
  userId: string, 
  amount: number, 
  withdrawalId: string, 
  permitData: {deadline: bigint; v: number; r: string; s: string}
): Promise<void> {
  if (!isPolygonEnabled()) {
    throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
  }

  const wallet = await getUserWalletAddress(userId);
  const amountStr = amount.toFixed(2);
  const { permitTx, transferTx, burnTx } = await burnWithPermit(
    wallet, 
    amountStr, 
    permitData.deadline, 
    permitData.v, 
    permitData.r, 
    permitData.s
  );
  console.log(`✅ [BURN] Saque ${withdrawalId}: burned ${amount} tokens do usuário ${wallet}`);
  console.log(`   PermitTx: ${permitTx}, TransferTx: ${transferTx}, BurnTx: ${burnTx}`);
}

/**
 * DUAL MINT: mintar quantidade `amount` para o usuário e a mesma quantidade para
 * a carteira do admin. O front-end envia apenas o valor depositado, e esta
 * função lida com as transações.
 */
export async function notifyDualMintToBRL3(
  userId: string, 
  amount: number, 
  depositId: string
): Promise<void> {
  if (!isPolygonEnabled()) {
    throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
  }

  const wallet = await getUserWalletAddress(userId);
  const amountStr = amount.toFixed(2);
  const { userTx, adminTx } = await mintDual(wallet, amountStr);
  console.log(`✅ [DUAL MINT] Depósito ${depositId}: ${amount} tokens para usuário (tx ${userTx}) e ${amount} tokens para admin (tx ${adminTx})`);
}

/**
 * DUAL BURN: queima a mesma quantidade de tokens do usuário e do admin. O
 * usuário assina permit e o admin paga gas. Recebe os dados de assinatura via
 * `permitData`. Queima primeiro os tokens do usuário e depois os do admin.
 */
export async function notifyDualBurnToBRL3(
  userId: string, 
  amount: number, 
  withdrawalId: string, 
  permitData: {deadline: bigint; v: number; r: string; s: string}
): Promise<void> {
  if (!isPolygonEnabled()) {
    throw new Error("Polygon integration not enabled - verifique variáveis de ambiente (POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS)");
  }

  const wallet = await getUserWalletAddress(userId);
  const amountStr = amount.toFixed(2);
  const { userTxs, adminBurnTx } = await burnDual(
    wallet, 
    amountStr, 
    permitData.deadline, 
    permitData.v, 
    permitData.r, 
    permitData.s
  );
  console.log(`✅ [DUAL BURN] Saque ${withdrawalId}: queima ${amount} tokens do usuário (permit ${userTxs.permitTx}, transfer ${userTxs.transferTx}, burn ${userTxs.burnTx}) e ${amount} tokens do admin (burn ${adminBurnTx})`);
}
