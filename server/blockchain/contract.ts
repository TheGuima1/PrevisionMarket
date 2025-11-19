/**
 * Blockchain Contract Manager
 * Connects to Polygon Mainnet and manages BRL3 token contract
 */

import { ethers } from 'ethers';
import { BRL3_ABI } from './abi';

// Environment variables
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com';
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const BRL3_CONTRACT_ADDRESS = process.env.BRL3_CONTRACT_ADDRESS;
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || '2');

// Validate environment variables
if (!ADMIN_PRIVATE_KEY) {
  throw new Error('ADMIN_PRIVATE_KEY environment variable is required');
}

if (!BRL3_CONTRACT_ADDRESS) {
  throw new Error('BRL3_CONTRACT_ADDRESS environment variable is required');
}

// Singleton instances
let providerInstance: ethers.JsonRpcProvider | null = null;
let signerInstance: ethers.Wallet | null = null;
let contractInstance: ethers.Contract | null = null;

/**
 * Get or create Polygon provider
 */
export function getProvider(): ethers.JsonRpcProvider {
  if (!providerInstance) {
    providerInstance = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    console.log('[Blockchain] ✅ Provider connected to Polygon Mainnet');
  }
  return providerInstance;
}

/**
 * Get or create admin wallet signer
 */
export function getSigner(): ethers.Wallet {
  if (!signerInstance) {
    const provider = getProvider();
    signerInstance = new ethers.Wallet(ADMIN_PRIVATE_KEY!, provider);
    console.log(`[Blockchain] ✅ Admin wallet loaded: ${signerInstance.address}`);
  }
  return signerInstance;
}

/**
 * Get or create BRL3 contract instance
 */
export function getContract(): ethers.Contract {
  if (!contractInstance) {
    const signer = getSigner();
    contractInstance = new ethers.Contract(
      BRL3_CONTRACT_ADDRESS!,
      BRL3_ABI,
      signer
    );
    console.log(`[Blockchain] ✅ BRL3 contract loaded at ${BRL3_CONTRACT_ADDRESS}`);
  }
  return contractInstance;
}

/**
 * Convert BRL amount to token units (with decimals)
 * Uses ethers.parseUnits for precise decimal handling
 * Example: 100.50 BRL → 10050 (with 2 decimals)
 */
export function toTokenUnits(amount: number | string): bigint {
  // Convert to string with proper decimal places to avoid floating point issues
  const amountStr = typeof amount === 'number' ? amount.toFixed(TOKEN_DECIMALS) : amount;
  return ethers.parseUnits(amountStr, TOKEN_DECIMALS);
}

/**
 * Convert token units back to BRL amount
 * Uses ethers.formatUnits for precise decimal handling
 * Example: 10050 → 100.50 BRL
 */
export function fromTokenUnits(units: bigint): string {
  return ethers.formatUnits(units, TOKEN_DECIMALS);
}

/**
 * Get admin wallet balance (MATIC for gas)
 */
export async function getAdminMaticBalance(): Promise<string> {
  const signer = getSigner();
  const balance = await signer.provider!.getBalance(signer.address);
  return ethers.formatEther(balance);
}

/**
 * Get admin BRL3 token balance
 */
export async function getAdminBRL3Balance(): Promise<string> {
  const contract = getContract();
  const signer = getSigner();
  const balance = await contract.balanceOf(signer.address);
  return fromTokenUnits(balance);
}

/**
 * Get network information
 */
export async function getNetworkInfo() {
  const provider = getProvider();
  const network = await provider.getNetwork();
  return {
    chainId: Number(network.chainId),
    name: network.name,
  };
}

/**
 * Health check - verify blockchain connection
 */
export async function healthCheck(): Promise<{
  connected: boolean;
  network: string;
  chainId: number;
  adminAddress: string;
  maticBalance: string;
  brl3Balance: string;
  contractAddress: string;
}> {
  try {
    const signer = getSigner();
    const network = await getNetworkInfo();
    const maticBalance = await getAdminMaticBalance();
    const brl3Balance = await getAdminBRL3Balance();

    return {
      connected: true,
      network: network.name,
      chainId: network.chainId,
      adminAddress: signer.address,
      maticBalance,
      brl3Balance,
      contractAddress: BRL3_CONTRACT_ADDRESS!,
    };
  } catch (error) {
    console.error('[Blockchain] Health check failed:', error);
    throw error;
  }
}
