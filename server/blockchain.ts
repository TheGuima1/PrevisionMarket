import { ethers } from "ethers";
import { BRL3_TOKEN_ADDRESS, TOKEN_DECIMALS } from "@shared/blockchain-config";

const BRL3_ABI = [
  {
    "name": "balanceOf",
    "type": "function",
    "inputs": [{"name": "account", "type": "address", "internalType": "address"}],
    "outputs": [{"name": "", "type": "uint256", "internalType": "uint256"}],
    "stateMutability": "view"
  },
  {
    "name": "mint",
    "type": "function",
    "inputs": [
      {"name": "to", "type": "address", "internalType": "address"},
      {"name": "amount", "type": "uint256", "internalType": "uint256"}
    ],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "burn",
    "type": "function",
    "inputs": [{"name": "amount", "type": "uint256", "internalType": "uint256"}],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "pause",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "unpause",
    "type": "function",
    "inputs": [],
    "outputs": [],
    "stateMutability": "nonpayable"
  },
  {
    "name": "paused",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "bool", "internalType": "bool"}],
    "stateMutability": "view"
  },
  {
    "name": "owner",
    "type": "function",
    "inputs": [],
    "outputs": [{"name": "", "type": "address", "internalType": "address"}],
    "stateMutability": "view"
  }
] as const;

const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL || "https://polygon-rpc.com/";

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private contract: any;
  private wallet: ethers.Wallet | null = null;
  private isInitialized = false;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
    this.contract = new ethers.Contract(BRL3_TOKEN_ADDRESS, BRL3_ABI, this.provider);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Validate ADMIN_PRIVATE_KEY
      const privateKey = process.env.ADMIN_PRIVATE_KEY;
      if (!privateKey) {
        throw new Error("ADMIN_PRIVATE_KEY environment variable not configured");
      }

      // Validate private key format (should be 64 hex chars with optional 0x prefix)
      const cleanKey = privateKey.startsWith("0x") ? privateKey.slice(2) : privateKey;
      if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
        throw new Error("ADMIN_PRIVATE_KEY has invalid format (expected 64 hex characters)");
      }

      // Test provider connectivity
      await this.provider.getBlockNumber();
      console.log(`[Blockchain] ✓ Connected to Polygon RPC: ${POLYGON_RPC_URL}`);

      // Initialize wallet
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      console.log(`[Blockchain] ✓ Admin wallet initialized: ${this.wallet.address}`);

      // Verify contract ownership
      const owner = await this.contract.owner();
      if (owner.toLowerCase() !== this.wallet.address.toLowerCase()) {
        console.warn(`[Blockchain] ⚠️ Warning: Admin wallet (${this.wallet.address}) is not the contract owner (${owner})`);
      } else {
        console.log(`[Blockchain] ✓ Admin wallet confirmed as contract owner`);
      }

      this.isInitialized = true;
    } catch (error: any) {
      console.error("[Blockchain] Initialization failed:", error);
      throw new Error(`Blockchain service initialization failed: ${error.message}`);
    }
  }

  private getWallet(): ethers.Wallet {
    if (!this.isInitialized || !this.wallet) {
      throw new Error("BlockchainService not initialized. Call initialize() first.");
    }
    return this.wallet;
  }

  async getBalance(address: string): Promise<string> {
    try {
      const balance = await this.contract.balanceOf(address);
      return ethers.formatUnits(balance, TOKEN_DECIMALS);
    } catch (error: any) {
      console.error("Failed to get balance:", error);
      throw new Error(`Failed to get balance: ${error.message}`);
    }
  }

  async mint(toAddress: string, amount: string): Promise<{ txHash: string; amountMinted: string }> {
    try {
      const wallet = this.getWallet();
      const contractWithSigner = this.contract.connect(wallet);
      const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);

      console.log(`[Blockchain] Minting ${amount} BRL3 to ${toAddress}...`);
      
      const tx = await contractWithSigner.mint(toAddress, amountWei);
      console.log(`[Blockchain] Mint transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`[Blockchain] Mint transaction confirmed in block ${receipt?.blockNumber}`);
      
      return {
        txHash: tx.hash,
        amountMinted: amount
      };
    } catch (error: any) {
      console.error("Failed to mint tokens:", error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }

  async burn(amount: string): Promise<{ txHash: string; amountBurned: string }> {
    try {
      const wallet = this.getWallet();
      const contractWithSigner = this.contract.connect(wallet);
      const amountWei = ethers.parseUnits(amount, TOKEN_DECIMALS);

      // Preflight check: Verify admin wallet has sufficient BRL3 balance
      const currentBalance = await this.contract.balanceOf(wallet.address);
      if (currentBalance < amountWei) {
        const balanceFormatted = ethers.formatUnits(currentBalance, TOKEN_DECIMALS);
        throw new Error(
          `Insufficient BRL3 balance in admin wallet. ` +
          `Required: ${amount}, Available: ${balanceFormatted}`
        );
      }

      console.log(`[Blockchain] Burning ${amount} BRL3 from admin wallet...`);
      
      const tx = await contractWithSigner.burn(amountWei);
      console.log(`[Blockchain] Burn transaction sent: ${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`[Blockchain] Burn transaction confirmed in block ${receipt?.blockNumber}`);
      
      return {
        txHash: tx.hash,
        amountBurned: amount
      };
    } catch (error: any) {
      console.error("Failed to burn tokens:", error);
      throw new Error(`Failed to burn tokens: ${error.message}`);
    }
  }

  async pause(): Promise<{ txHash: string }> {
    try {
      const wallet = this.getWallet();
      const contractWithSigner = this.contract.connect(wallet);
      
      const tx = await contractWithSigner.pause();
      await tx.wait();
      
      return { txHash: tx.hash };
    } catch (error: any) {
      console.error("Failed to pause contract:", error);
      throw new Error(`Failed to pause contract: ${error.message}`);
    }
  }

  async unpause(): Promise<{ txHash: string }> {
    try {
      const wallet = this.getWallet();
      const contractWithSigner = this.contract.connect(wallet);
      
      const tx = await contractWithSigner.unpause();
      await tx.wait();
      
      return { txHash: tx.hash };
    } catch (error: any) {
      console.error("Failed to unpause contract:", error);
      throw new Error(`Failed to unpause contract: ${error.message}`);
    }
  }

  async isPaused(): Promise<boolean> {
    try {
      return await this.contract.paused();
    } catch (error: any) {
      console.error("Failed to check pause status:", error);
      throw new Error(`Failed to check pause status: ${error.message}`);
    }
  }

  async getOwner(): Promise<string> {
    try {
      return await this.contract.owner();
    } catch (error: any) {
      console.error("Failed to get owner:", error);
      throw new Error(`Failed to get owner: ${error.message}`);
    }
  }
}

export const blockchainService = new BlockchainService();
