/**
 * Shared blockchain configuration constants
 * Reads from environment variables with hardcoded fallbacks
 * Used by both frontend and backend to ensure consistency
 */

// Backend uses process.env, frontend uses import.meta.env
const isBrowser = typeof window !== 'undefined';
const getEnv = (key: string) => isBrowser ? (import.meta as any).env?.[key] : process.env[key];

// BRL3 Token Contract Address (configurable via secrets)
export const BRL3_TOKEN_ADDRESS = 
  getEnv('BRL3_CONTRACT_ADDRESS') || 
  getEnv('VITE_BRL3_CONTRACT_ADDRESS') || 
  "0xa2a21D5800E4DA2ec41582C10532aE13BDd4be90";

// Admin Wallet Address (configurable via secrets)
export const ADMIN_WALLET_ADDRESS = 
  getEnv('ADMIN_WALLET_ADDRESS') || 
  getEnv('VITE_ADMIN_WALLET_ADDRESS') || 
  "0xCD83c3f36396bcb3569240a3Cb34f037ba310926";

// Token Decimals (configurable via secrets, default 18)
export const TOKEN_DECIMALS = 
  parseInt(getEnv('TOKEN_DECIMALS') || getEnv('VITE_TOKEN_DECIMALS') || '18', 10);

// Polygon Chain IDs (constants)
export const POLYGON_CHAIN_ID_HEX = "0x89"; // 137
export const POLYGON_CHAIN_ID_DEC = 137;
