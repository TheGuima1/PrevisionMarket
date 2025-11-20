import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { BRL3_ABI } from "@/lib/brl3-abi";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useMetaMaskMint() {
  const { toast } = useToast();
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);

  const CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
  const TOKEN_DECIMALS = parseInt(import.meta.env.VITE_TOKEN_DECIMALS || "2");
  const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

  async function ensurePolygonNetwork(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      
      if (chainId !== POLYGON_CHAIN_ID) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID }],
          });
          return true;
        } catch (switchError: any) {
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
            return true;
          } else {
            throw switchError;
          }
        }
      }
      return true;
    } catch (error) {
      console.error("Failed to ensure Polygon network:", error);
      return false;
    }
  }

  async function mintTokens(amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!window.ethereum) {
      toast({
        title: "MetaMask não encontrado",
        description: "Por favor, instale a extensão MetaMask no seu navegador.",
        variant: "destructive",
      });
      return { success: false, error: "MetaMask não encontrado" };
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Configuração inválida",
        description: "Endereço do contrato BRL3 não configurado.",
        variant: "destructive",
      });
      return { success: false, error: "Contrato não configurado" };
    }

    try {
      setIsMinting(true);

      // Request account access and verify accounts exist
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error("Nenhuma conta MetaMask conectada. Desbloqueie o MetaMask e tente novamente.");
        }
      } catch (connectionError: any) {
        if (connectionError.code === 4001) {
          throw new Error("Conexão com MetaMask recusada. Aprove a conexão no popup do MetaMask.");
        }
        throw connectionError;
      }

      // Ensure we're on Polygon
      const onPolygon = await ensurePolygonNetwork();
      if (!onPolygon) {
        throw new Error("Não foi possível conectar à rede Polygon");
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const currentAccount = await signer.getAddress();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
      const tokenAmount = ethers.parseUnits(amount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação no MetaMask",
        description: `Mintando ${amount} BRL3 tokens...`,
      });

      // Mint to admin's own wallet
      const tx = await contract.mint(currentAccount, tokenAmount);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait(1);

      toast({
        title: "Mint realizado com sucesso! ✅",
        description: `${amount} BRL3 mintados no bloco ${receipt.blockNumber}`,
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Erro ao mintar:", error);
      
      let errorMessage = "Não foi possível realizar o mint";
      let errorTitle = "Erro no mint";
      
      if (error.code === 4001) {
        errorMessage = "Você cancelou a transação no MetaMask";
        errorTitle = "Transação cancelada";
      } else if (error.message?.includes("must has at least one account") || error.message?.includes("Nenhuma conta MetaMask")) {
        errorMessage = "MetaMask não está conectado ou desbloqueado. Abra a extensão MetaMask, desbloqueie sua carteira e tente novamente.";
        errorTitle = "MetaMask não conectado";
      } else if (error.message?.includes("Conexão com MetaMask recusada")) {
        errorMessage = error.message;
        errorTitle = "Conexão recusada";
      } else if (error.message?.includes("AccessControl")) {
        errorMessage = "Você não tem permissão para mintar tokens (precisa de MINTER_ROLE)";
        errorTitle = "Sem permissão";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsMinting(false);
    }
  }

  async function burnTokens(amount: string): Promise<{ success: boolean; txHash?: string; error?: string }> {
    if (!window.ethereum) {
      toast({
        title: "MetaMask não encontrado",
        description: "Por favor, instale a extensão MetaMask no seu navegador.",
        variant: "destructive",
      });
      return { success: false, error: "MetaMask não encontrado" };
    }

    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Configuração inválida",
        description: "Endereço do contrato BRL3 não configurado.",
        variant: "destructive",
      });
      return { success: false, error: "Contrato não configurado" };
    }

    try {
      setIsBurning(true);

      // Request account access and verify accounts exist
      let accounts;
      try {
        accounts = await window.ethereum.request({
          method: "eth_requestAccounts",
        });
        
        if (!accounts || accounts.length === 0) {
          throw new Error("Nenhuma conta MetaMask conectada. Desbloqueie o MetaMask e tente novamente.");
        }
      } catch (connectionError: any) {
        if (connectionError.code === 4001) {
          throw new Error("Conexão com MetaMask recusada. Aprove a conexão no popup do MetaMask.");
        }
        throw connectionError;
      }

      // Ensure we're on Polygon
      const onPolygon = await ensurePolygonNetwork();
      if (!onPolygon) {
        throw new Error("Não foi possível conectar à rede Polygon");
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
      const tokenAmount = ethers.parseUnits(amount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação no MetaMask",
        description: `Queimando ${amount} BRL3 tokens...`,
      });

      const tx = await contract.burn(tokenAmount);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait(1);

      toast({
        title: "Burn realizado com sucesso! ✅",
        description: `${amount} BRL3 queimados no bloco ${receipt.blockNumber}`,
      });

      return { success: true, txHash: tx.hash };
    } catch (error: any) {
      console.error("Erro ao queimar:", error);
      
      let errorMessage = "Não foi possível realizar o burn";
      let errorTitle = "Erro no burn";
      
      if (error.code === 4001) {
        errorMessage = "Você cancelou a transação no MetaMask";
        errorTitle = "Transação cancelada";
      } else if (error.message?.includes("must has at least one account") || error.message?.includes("Nenhuma conta MetaMask")) {
        errorMessage = "MetaMask não está conectado ou desbloqueado. Abra a extensão MetaMask, desbloqueie sua carteira e tente novamente.";
        errorTitle = "MetaMask não conectado";
      } else if (error.message?.includes("Conexão com MetaMask recusada")) {
        errorMessage = error.message;
        errorTitle = "Conexão recusada";
      } else if (error.message?.includes("ERC20: burn amount exceeds balance")) {
        errorMessage = "Saldo insuficiente de BRL3 tokens para queimar";
        errorTitle = "Saldo insuficiente";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: errorTitle,
        description: errorMessage,
        variant: "destructive",
      });

      return { success: false, error: errorMessage };
    } finally {
      setIsBurning(false);
    }
  }

  return {
    mintTokens,
    burnTokens,
    isMinting,
    isBurning,
  };
}
