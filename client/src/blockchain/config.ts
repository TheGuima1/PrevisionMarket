import { ethers } from "ethers";
import { BRL3_ABI } from "./brl3Abi";

export const BRL3_TOKEN_ADDRESS = "0x2F6370EC3b1ebB60cF359fb264E5e576ceEb6dcE";
export const ADMIN_WALLET_ADDRESS = "0xCD83c3f36396bcb3569240a3Cb34f037ba310926";
export const TOKEN_DECIMALS = 18;
export const POLYGON_CHAIN_ID_HEX = "0x89"; // 137
export const POLYGON_CHAIN_ID_DEC = 137;

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
