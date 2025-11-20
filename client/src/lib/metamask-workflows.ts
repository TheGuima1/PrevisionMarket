import { BRL3_ABI } from "@/lib/brl3-abi";

interface MintResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

interface BurnResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

const CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
const TOKEN_DECIMALS = parseInt(import.meta.env.VITE_TOKEN_DECIMALS || "18");
const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

/**
 * Ensures MetaMask is connected and returns the current account
 */
async function ensureConnected(): Promise<string> {
  if (!window.ethereum) {
    throw new Error("MetaMask não está instalado");
  }

  const accounts = await window.ethereum.request({
    method: "eth_requestAccounts",
  });

  if (!accounts || accounts.length === 0) {
    throw new Error("Nenhuma conta conectada. Desbloqueie o MetaMask e tente novamente.");
  }

  return accounts[0];
}

/**
 * Ensures we're on Polygon network, switches if needed
 */
async function ensurePolygonNetwork(): Promise<void> {
  if (!window.ethereum) {
    throw new Error("MetaMask não está instalado");
  }

  const chainId = await window.ethereum.request({ method: "eth_chainId" });

  if (chainId !== POLYGON_CHAIN_ID) {
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: POLYGON_CHAIN_ID }],
      });
    } catch (switchError: any) {
      // Chain not added, try to add it
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: POLYGON_CHAIN_ID,
              chainName: "Polygon Mainnet",
              nativeCurrency: {
                name: "MATIC",
                symbol: "MATIC",
                decimals: 18,
              },
              rpcUrls: ["https://polygon-rpc.com"],
              blockExplorerUrls: ["https://polygonscan.com"],
            },
          ],
        });
      } else {
        throw new Error("Não foi possível trocar para a rede Polygon");
      }
    }
  }
}

/**
 * Executes a mint transaction via MetaMask
 * @param amount Amount in BRL3 (e.g., "100" for 100 BRL3)
 * @returns Transaction hash on success
 */
export async function executeMintWorkflow(amount: string): Promise<MintResult> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error("Endereço do contrato BRL3 não configurado");
    }

    // Step 1: Ensure connected
    const account = await ensureConnected();

    // Step 2: Ensure on Polygon network
    await ensurePolygonNetwork();

    // Step 3: Execute mint transaction
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
    const tokenAmount = ethers.parseUnits(amount, TOKEN_DECIMALS);

    // Mint to admin's own wallet
    const tx = await contract.mint(account, tokenAmount);

    // Wait for confirmation (1 block)
    await tx.wait(1);

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (error: any) {
    console.error("Mint workflow error:", error);

    let errorMessage = "Erro ao mintar tokens";
    
    if (error.code === 4001) {
      errorMessage = "Você cancelou a transação no MetaMask";
    } else if (error.code === -32002) {
      errorMessage = "Já existe uma solicitação pendente no MetaMask. Aprove ou rejeite a solicitação atual.";
    } else if (error.message?.includes("AccessControl")) {
      errorMessage = "Você não tem permissão para mintar tokens (precisa de MINTER_ROLE)";
    } else if (error.message?.includes("nenhuma conta")) {
      errorMessage = "MetaMask não está conectado ou está bloqueado";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Executes a burn transaction via MetaMask
 * @param amount Amount in BRL3 (e.g., "50" for 50 BRL3)
 * @returns Transaction hash on success
 */
export async function executeBurnWorkflow(amount: string): Promise<BurnResult> {
  try {
    if (!CONTRACT_ADDRESS) {
      throw new Error("Endereço do contrato BRL3 não configurado");
    }

    // Step 1: Ensure connected
    await ensureConnected();

    // Step 2: Ensure on Polygon network
    await ensurePolygonNetwork();

    // Step 3: Execute burn transaction
    const { ethers } = await import("ethers");
    const provider = new ethers.BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
    const tokenAmount = ethers.parseUnits(amount, TOKEN_DECIMALS);

    // Burn from admin's wallet
    const tx = await contract.burn(tokenAmount);

    // Wait for confirmation (1 block)
    await tx.wait(1);

    return {
      success: true,
      txHash: tx.hash,
    };
  } catch (error: any) {
    console.error("Burn workflow error:", error);

    let errorMessage = "Erro ao queimar tokens";
    
    if (error.code === 4001) {
      errorMessage = "Você cancelou a transação no MetaMask";
    } else if (error.code === -32002) {
      errorMessage = "Já existe uma solicitação pendente no MetaMask. Aprove ou rejeite a solicitação atual.";
    } else if (error.message?.includes("burn amount exceeds balance")) {
      errorMessage = "Saldo insuficiente de BRL3 tokens para queimar";
    } else if (error.message?.includes("nenhuma conta")) {
      errorMessage = "MetaMask não está conectado ou está bloqueado";
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
