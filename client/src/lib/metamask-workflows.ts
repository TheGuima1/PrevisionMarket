import { ethers } from "ethers";
import { BRL3_ABI } from "@/blockchain/brl3Abi";
import {
  ADMIN_WALLET_ADDRESS,
  BRL3_TOKEN_ADDRESS,
  POLYGON_CHAIN_ID_HEX,
  toTokenUnits,
  isAdminAddress,
} from "@/blockchain/config";

interface MintResult {
  success: boolean;
  txHash?: string;
  amountRaw?: string;
  error?: string;
}

interface BurnResult {
  success: boolean;
  txHash?: string;
  amountRaw?: string;
  error?: string;
}

const ADMIN_ADDRESS_LOWER = ADMIN_WALLET_ADDRESS.toLowerCase();

function ensureWindowEthereum() {
  if (!window.ethereum) {
    throw new Error("MetaMask não está instalado");
  }
}

async function ensurePolygonNetwork(): Promise<void> {
  ensureWindowEthereum();

  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  if (chainId === POLYGON_CHAIN_ID_HEX) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: POLYGON_CHAIN_ID_HEX }],
    });
  } catch (switchError: any) {
    if (switchError.code === 4902) {
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: POLYGON_CHAIN_ID_HEX,
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

async function requireAdminSigner() {
  ensureWindowEthereum();

  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);

  if (!accounts || accounts.length === 0) {
    throw new Error("Nenhuma conta conectada. Desbloqueie o MetaMask e tente novamente.");
  }

  await ensurePolygonNetwork();

  const signer = await provider.getSigner();
  const account = (await signer.getAddress()).toLowerCase();

  if (account !== ADMIN_ADDRESS_LOWER) {
    throw new Error(`Apenas a carteira admin pode executar esta ação. Troque para ${ADMIN_WALLET_ADDRESS}.`);
  }

  return { provider, signer, account };
}

function withFriendlyError(error: any, defaultMessage: string) {
  if (error?.code === 4001) {
    return "Você cancelou a transação no MetaMask";
  }
  if (error?.code === -32002) {
    return "Já existe uma solicitação pendente no MetaMask. Aprove ou rejeite a solicitação atual.";
  }
  if (typeof error?.message === "string" && error.message.length > 0) {
    return error.message;
  }
  return defaultMessage;
}

export async function executeMintWorkflow(params: { amount: string; to: string }): Promise<MintResult> {
  try {
    if (!BRL3_TOKEN_ADDRESS) {
      throw new Error("Endereço do contrato BRL3 não configurado");
    }

    const toAddress = ethers.getAddress(params.to);
    const { signer } = await requireAdminSigner();
    const tokenAmountRaw = toTokenUnits(params.amount);

    const contract = new ethers.Contract(BRL3_TOKEN_ADDRESS, BRL3_ABI, signer);
    const tx = await contract.mint(toAddress, tokenAmountRaw);
    await tx.wait(1);

    return {
      success: true,
      txHash: tx.hash,
      amountRaw: tokenAmountRaw.toString(),
    };
  } catch (error: any) {
    console.error("Mint workflow error:", error);

    let errorMessage = withFriendlyError(error, "Erro ao mintar tokens");
    if (error?.message?.includes("AccessControl") || error?.message?.includes("MINTER_ROLE")) {
      errorMessage = "A carteira conectada não possui permissão de mint";
    }
    if (error?.message?.includes("carteira admin")) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function executeBurnWorkflow(params: { amount: string; from?: string }): Promise<BurnResult> {
  try {
    if (!BRL3_TOKEN_ADDRESS) {
      throw new Error("Endereço do contrato BRL3 não configurado");
    }

    const { signer, account } = await requireAdminSigner();
    const targetAddress = params.from ? ethers.getAddress(params.from) : undefined;
    const burnFromAddress = targetAddress || ethers.getAddress(account);
    const useBurnFrom = !isAdminAddress(burnFromAddress);

    const tokenAmountRaw = toTokenUnits(params.amount);
    const contract = new ethers.Contract(BRL3_TOKEN_ADDRESS, BRL3_ABI, signer);
    const tx = useBurnFrom
      ? await contract.burnFrom(burnFromAddress, tokenAmountRaw)
      : await contract.burn(tokenAmountRaw);

    await tx.wait(1);

    return {
      success: true,
      txHash: tx.hash,
      amountRaw: tokenAmountRaw.toString(),
    };
  } catch (error: any) {
    console.error("Burn workflow error:", error);

    let errorMessage = withFriendlyError(error, "Erro ao queimar tokens");
    if (error?.message?.includes("burn amount exceeds allowance")) {
      errorMessage = "A carteira do usuário não deu permissão suficiente para queimar";
    } else if (error?.message?.includes("burn amount exceeds balance")) {
      errorMessage = "Saldo insuficiente de BRL3 para queimar";
    } else if (error?.message?.includes("carteira admin")) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
