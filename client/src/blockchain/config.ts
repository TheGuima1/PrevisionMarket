import { ethers } from "ethers";
import { BRL3_ABI } from "./brl3Abi";
import { 
  BRL3_TOKEN_ADDRESS, 
  ADMIN_WALLET_ADDRESS, 
  TOKEN_DECIMALS,
  POLYGON_CHAIN_ID_HEX,
  POLYGON_CHAIN_ID_DEC
} from "@shared/blockchain-config";

// Re-export for backward compatibility
export { BRL3_TOKEN_ADDRESS, ADMIN_WALLET_ADDRESS, TOKEN_DECIMALS, POLYGON_CHAIN_ID_HEX, POLYGON_CHAIN_ID_DEC };

export function getPolygonRpcUrl() {
  return import.meta.env.VITE_POLYGON_RPC_URL || "https://polygon-rpc.com";
}

export function normalizeAddress(address?: string | null) {
  return address ? address.toLowerCase() : "";
}

export function isAdminAddress(address?: string | null) {
  return normalizeAddress(address) === normalizeAddress(ADMIN_WALLET_ADDRESS);
}

export function toTokenUnits(amount: string | number) {
  const asString = typeof amount === "number" ? amount.toString() : amount;
  return ethers.parseUnits(asString, TOKEN_DECIMALS);
}

export function formatToken(units: bigint | string) {
  const bigintValue = typeof units === "string" ? BigInt(units) : units;
  return ethers.formatUnits(bigintValue, TOKEN_DECIMALS);
}

export function getBrowserProvider() {
  if (typeof window === "undefined" || !window.ethereum) {
    throw new Error("MetaMask não detectado no navegador");
  }
  return new ethers.BrowserProvider(window.ethereum);
}

export function getReadProvider() {
  return new ethers.JsonRpcProvider(getPolygonRpcUrl());
}

export async function getBRL3Contract(signer?: ethers.Signer | ethers.Provider) {
  const provider = signer || getReadProvider();
  return new ethers.Contract(BRL3_TOKEN_ADDRESS, BRL3_ABI, provider);
}
