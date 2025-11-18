// server/polygonClient.ts
// Integração on-chain com token BRL3 na Polygon usando ethers.js v6
// Implementa mint/burn direto na blockchain com meta-transações gasless (EIP-2612)

import { ethers } from "ethers";
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

// ESM compatibility: __dirname substitute
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const {
  POLYGON_RPC_URL,
  ADMIN_PRIVATE_KEY,
  TOKEN_CONTRACT_ADDRESS,
  TOKEN_DECIMALS
} = process.env;

// Validação de variáveis de ambiente
if (!POLYGON_RPC_URL || !ADMIN_PRIVATE_KEY || !TOKEN_CONTRACT_ADDRESS || !TOKEN_DECIMALS) {
  console.warn("⚠️  Polygon integration disabled - missing environment variables");
  console.warn("Required: POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS");
}

// Ler ABI do token
let tokenAbi: any[] = [];
let provider: ethers.JsonRpcProvider | null = null;
let adminWallet: ethers.Wallet | null = null;
let tokenContract: ethers.Contract | null = null;

if (POLYGON_RPC_URL && ADMIN_PRIVATE_KEY && TOKEN_CONTRACT_ADDRESS && TOKEN_DECIMALS) {
  try {
    const abiPath = path.join(__dirname, 'tokenABI.json');
    if (fs.existsSync(abiPath)) {
      tokenAbi = JSON.parse(fs.readFileSync(abiPath, 'utf8'));
      
      provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
      adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
      tokenContract = new ethers.Contract(TOKEN_CONTRACT_ADDRESS, tokenAbi, adminWallet);
      
      console.log(`✓ Polygon integration enabled - Contract: ${TOKEN_CONTRACT_ADDRESS.substring(0, 10)}...`);
    } else {
      console.warn(`⚠️  tokenABI.json not found at ${abiPath} - Polygon integration disabled`);
    }
  } catch (error) {
    console.error("❌ Error initializing Polygon client:", error);
  }
}

/**
 * Converter valor humano (ex: "10.50") para unidades do token
 * Aceita string para evitar rounding errors com números decimais
 */
function toUnits(amount: string): bigint {
  if (!TOKEN_DECIMALS) throw new Error("TOKEN_DECIMALS not configured");
  return ethers.parseUnits(amount, Number(TOKEN_DECIMALS));
}

/**
 * Verifica se a integração Polygon está habilitada
 */
export function isPolygonEnabled(): boolean {
  return tokenContract !== null;
}

/**
 * Retorna o endereço da carteira do admin.
 * Use para mint/burn operations que devem sempre ir para admin wallet.
 */
export function getAdminAddress(): string {
  if (!adminWallet) {
    throw new Error("Admin wallet not initialized - verifique ADMIN_PRIVATE_KEY");
  }
  return adminWallet.address;
}

/**
 * Retorna o endereço do contrato BRL3
 */
export function getTokenContractAddress(): string {
  if (!TOKEN_CONTRACT_ADDRESS) throw new Error("TOKEN_CONTRACT_ADDRESS not configured");
  return TOKEN_CONTRACT_ADDRESS;
}


/**
 * Aguarda confirmação de uma transação na blockchain e verifica se foi bem sucedida.
 * Retorna true se confirmada com sucesso, false se revertida.
 */
export async function waitForTransaction(txHash: string, confirmations: number = 1): Promise<boolean> {
  if (!provider) throw new Error("Polygon provider not initialized");
  
  try {
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    if (!receipt) return false;
    
    return receipt.status === 1;
  } catch (error) {
    console.error(`Error waiting for transaction ${txHash}:`, error);
    return false;
  }
}

/**
 * Verifica se uma transação é um mint válido para o endereço e valor esperados.
 * @param txHash Hash da transação a verificar
 * @param expectedRecipient Endereço que deveria receber os tokens
 * @param expectedAmount Valor em formato string (ex: "10.50")
 * @returns true se a tx é válida, false caso contrário
 */
export async function verifyMintTransaction(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: string
): Promise<{ valid: boolean; error?: string }> {
  if (!provider || !TOKEN_CONTRACT_ADDRESS) {
    return { valid: false, error: "Polygon provider not initialized" };
  }

  try {
    // 1. Obter transação e receipt
    const tx = await provider.getTransaction(txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (!tx || !receipt) {
      return { valid: false, error: "Transaction not found" };
    }

    // 2. Verificar que interagiu com o contrato correto
    if (tx.to?.toLowerCase() !== TOKEN_CONTRACT_ADDRESS.toLowerCase()) {
      return { 
        valid: false, 
        error: `Transaction sent to wrong contract: ${tx.to} instead of ${TOKEN_CONTRACT_ADDRESS}` 
      };
    }

    // 3. Decodificar calldata para verificar função mint e parâmetros
    const iface = new ethers.Interface(tokenAbi);
    let decodedData;
    try {
      decodedData = iface.parseTransaction({ data: tx.data, value: tx.value });
    } catch (error) {
      return { valid: false, error: "Failed to decode transaction data" };
    }

    if (!decodedData || decodedData.name !== "mint") {
      return { 
        valid: false, 
        error: `Transaction is not a mint call: ${decodedData?.name || 'unknown'}` 
      };
    }

    // 4. Verificar recipient e amount
    const [actualRecipient, actualAmount] = decodedData.args;
    const expectedUnits = toUnits(expectedAmount);

    if (actualRecipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
      return { 
        valid: false, 
        error: `Mint recipient mismatch: ${actualRecipient} instead of ${expectedRecipient}` 
      };
    }

    if (actualAmount !== expectedUnits) {
      return { 
        valid: false, 
        error: `Mint amount mismatch: ${actualAmount.toString()} instead of ${expectedUnits.toString()}` 
      };
    }

    // 5. Verificar que a transação foi bem sucedida
    if (receipt.status !== 1) {
      return { valid: false, error: "Transaction failed (reverted)" };
    }

    return { valid: true };
  } catch (error: any) {
    console.error(`Error verifying mint transaction ${txHash}:`, error);
    return { valid: false, error: error.message || "Unknown verification error" };
  }
}

/**
 * Mintar tokens para um endereço. Apenas a carteira do admin deve executar.
 * Retorna o hash da transação.
 * @param amount - Valor em formato string (ex: "10.50") para evitar rounding errors
 */
export async function mintTo(toAddress: string, amount: string): Promise<string> {
  if (!tokenContract) throw new Error("Polygon integration not initialized - verifique variáveis de ambiente");
  
  const units = toUnits(amount);
  const tx = await tokenContract.mint(toAddress, units);
  await tx.wait();
  return tx.hash;
}

/**
 * Mintar a mesma quantidade de tokens para o usuário e para o admin (DUAL MINT).
 * @param amount - Valor em formato string (ex: "10.50") para evitar rounding errors
 */
export async function mintDual(userAddress: string, amount: string): Promise<{userTx: string; adminTx: string}> {
  if (!tokenContract || !adminWallet) throw new Error("Polygon integration not initialized - verifique variáveis de ambiente");
  
  const units = toUnits(amount);
  const txUser = await tokenContract.mint(userAddress, units);
  const txAdmin = await tokenContract.mint(adminWallet.address, units);
  await txUser.wait();
  await txAdmin.wait();
  return { userTx: txUser.hash, adminTx: txAdmin.hash };
}

/**
 * Queimar tokens da carteira do admin (simples burn). Use quando o admin já
 * possui tokens a queimar (por exemplo, após transferências).
 * @param amount - Valor em formato string (ex: "10.50") para evitar rounding errors
 */
export async function burnFromAdmin(amount: string): Promise<string> {
  if (!tokenContract) throw new Error("Polygon integration not initialized - verifique variáveis de ambiente");
  
  const units = toUnits(amount);
  const tx = await tokenContract.burn(units);
  await tx.wait();
  return tx.hash;
}

/**
 * Queima tokens de um usuário sem que ele pague gas.
 * O usuário assina offline uma autorização EIP-2612 (`permit`) e envia a assinatura
 * para a API de saque. O admin então chama `permit`, `transferFrom` e `burn`.
 *
 * @param owner endereço do usuário
 * @param amount quantidade de tokens em string (ex: "10.50") para evitar rounding errors
 * @param deadline timestamp (em segundos) até quando a autorização é válida
 * @param v,r,s componentes da assinatura EIP-712
 */
export async function burnWithPermit(
  owner: string, 
  amount: string, 
  deadline: bigint, 
  v: number, 
  r: string, 
  s: string
): Promise<{permitTx: string; transferTx: string; burnTx: string}> {
  if (!tokenContract || !adminWallet) throw new Error("Polygon integration not initialized - verifique variáveis de ambiente");
  
  const units = toUnits(amount);
  
  // 1. Chamar permit para aprovar o admin como spender
  const permitTx = await tokenContract.permit(owner, adminWallet.address, units, deadline, v, r, s);
  await permitTx.wait();
  
  // 2. Transferir tokens do usuário para o admin
  const transferTx = await tokenContract.transferFrom(owner, adminWallet.address, units);
  await transferTx.wait();
  
  // 3. Queimar os tokens da carteira do admin
  const burnTx = await tokenContract.burn(units);
  await burnTx.wait();
  
  return { permitTx: permitTx.hash, transferTx: transferTx.hash, burnTx: burnTx.hash };
}

/**
 * Dupla queima: queima tokens do usuário (com permit) e a mesma quantidade do admin.
 * @param amount - Valor em formato string (ex: "10.50") para evitar rounding errors
 */
export async function burnDual(
  owner: string, 
  amount: string, 
  deadline: bigint, 
  v: number, 
  r: string, 
  s: string
): Promise<{userTxs: {permitTx: string; transferTx: string; burnTx: string}; adminBurnTx: string}> {
  const userTxs = await burnWithPermit(owner, amount, deadline, v, r, s);
  const adminBurnTx = await burnFromAdmin(amount);
  return { userTxs, adminBurnTx };
}

