import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wallet, ChevronRight, ExternalLink } from "lucide-react";
import { BRL3_ABI } from "@/lib/brl3-abi";

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function BlockchainActions() {
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [account, setAccount] = useState<string>("");
  const [balance, setBalance] = useState<string>("0");
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const CONTRACT_ADDRESS = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
  const TOKEN_DECIMALS = parseInt(import.meta.env.VITE_TOKEN_DECIMALS || "2");
  const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

  // Setup MetaMask event listeners with cleanup
  useEffect(() => {
    if (!window.ethereum || !connected) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected
        setConnected(false);
        setAccount("");
        setBalance("0");
      } else {
        setAccount(accounts[0]);
        loadBalance(accounts[0]);
      }
    };

    const handleChainChanged = () => {
      // Reload page on chain change to reset state
      window.location.reload();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Cleanup listeners on unmount or when connected changes
    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, [connected]);

  // Helper to ensure we're on Polygon network
  async function ensurePolygonNetwork(): Promise<boolean> {
    if (!window.ethereum) return false;

    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" });
      
      if (chainId !== POLYGON_CHAIN_ID) {
        // Try to switch to Polygon
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: POLYGON_CHAIN_ID }],
          });
          return true;
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

  async function connectMetaMask() {
    if (!window.ethereum) {
      toast({
        title: "MetaMask não encontrado",
        description: "Por favor, instale a extensão MetaMask no seu navegador.",
        variant: "destructive",
      });
      return;
    }

    // Validate env vars
    if (!CONTRACT_ADDRESS) {
      toast({
        title: "Configuração inválida",
        description: "Endereço do contrato BRL3 não configurado. Verifique as variáveis de ambiente.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);

      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      // Ensure we're on Polygon
      const onPolygon = await ensurePolygonNetwork();
      if (!onPolygon) {
        throw new Error("Não foi possível conectar à rede Polygon");
      }

      setAccount(accounts[0]);
      setConnected(true);

      // Load balance
      await loadBalance(accounts[0]);

      toast({
        title: "MetaMask conectado",
        description: `Carteira ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)} conectada à Polygon`,
      });
    } catch (error: any) {
      console.error("Erro ao conectar MetaMask:", error);
      toast({
        title: "Erro ao conectar",
        description: error.message || "Não foi possível conectar com MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  }

  async function loadBalance(address: string) {
    if (!window.ethereum) return;

    try {
      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, provider);
      const balanceWei = await contract.balanceOf(address);
      const balanceFormatted = ethers.formatUnits(balanceWei, TOKEN_DECIMALS);
      setBalance(balanceFormatted);
    } catch (error) {
      console.error("Erro ao carregar saldo:", error);
    }
  }

  async function handleMint() {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (!connected) {
      toast({
        title: "MetaMask não conectado",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMinting(true);

      // Ensure we're on Polygon network before transaction
      const onPolygon = await ensurePolygonNetwork();
      if (!onPolygon) {
        throw new Error("Por favor, conecte à rede Polygon para realizar esta operação");
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get current account from signer (in case user switched accounts)
      const currentAccount = await signer.getAddress();
      setAccount(currentAccount); // Update UI with current account

      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);

      // Convert amount to token units
      const amount = ethers.parseUnits(mintAmount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação",
        description: "Confirme a transação no MetaMask...",
      });

      // Call mint function to current account
      const tx = await contract.mint(currentAccount, amount);
      setLastTxHash(tx.hash);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for confirmation
      const receipt = await tx.wait(1);

      toast({
        title: "Mint realizado com sucesso",
        description: `${mintAmount} BRL3 mintados no bloco ${receipt.blockNumber}`,
      });

      // Reload balance
      await loadBalance(currentAccount);
      setMintAmount("");
    } catch (error: any) {
      console.error("Erro ao mintar:", error);
      
      let errorMessage = "Não foi possível realizar o mint";
      if (error.code === 4001) {
        errorMessage = "Transação cancelada pelo usuário";
      } else if (error.message?.includes("AccessControl")) {
        errorMessage = "Você não tem permissão para mintar tokens (precisa de MINTER_ROLE)";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no mint",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsMinting(false);
    }
  }

  async function handleBurn() {
    if (!burnAmount || parseFloat(burnAmount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (!connected) {
      toast({
        title: "MetaMask não conectado",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBurning(true);

      // Ensure we're on Polygon network before transaction
      const onPolygon = await ensurePolygonNetwork();
      if (!onPolygon) {
        throw new Error("Por favor, conecte à rede Polygon para realizar esta operação");
      }

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      
      // Get current account from signer (in case user switched accounts)
      const currentAccount = await signer.getAddress();
      setAccount(currentAccount); // Update UI with current account

      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);

      // Convert amount to token units
      const amount = ethers.parseUnits(burnAmount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação",
        description: "Confirme a transação no MetaMask...",
      });

      // Call burn function
      const tx = await contract.burn(amount);
      setLastTxHash(tx.hash);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      // Wait for confirmation
      const receipt = await tx.wait(1);

      toast({
        title: "Burn realizado com sucesso",
        description: `${burnAmount} BRL3 queimados no bloco ${receipt.blockNumber}`,
      });

      // Reload balance
      await loadBalance(currentAccount);
      setBurnAmount("");
    } catch (error: any) {
      console.error("Erro ao queimar:", error);
      
      let errorMessage = "Não foi possível realizar o burn";
      if (error.code === 4001) {
        errorMessage = "Transação cancelada pelo usuário";
      } else if (error.message?.includes("burn amount exceeds balance")) {
        errorMessage = "Saldo insuficiente de BRL3 para queimar";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Erro no burn",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsBurning(false);
    }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-white text-2xl font-bold">Ações Blockchain</h2>

      {/* Connection Status */}
      <Card className="bg-[#2A2640] border-white/10">
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-semibold text-lg mb-1">Status da Conexão</h3>
              <p className="text-white/60 text-sm" data-testid="text-connection-status">
                {connected 
                  ? `Conectado: ${account.slice(0, 6)}...${account.slice(-4)}` 
                  : "MetaMask não conectado"
                }
              </p>
            </div>
            {!connected && (
              <Button 
                onClick={connectMetaMask} 
                disabled={isConnecting}
                className="bg-primary hover:bg-primary/90"
                data-testid="button-connect-metamask"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Conectando...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Conectar MetaMask
                  </>
                )}
              </Button>
            )}
          </div>

          {connected && (
            <div className="bg-[#1F1B2E] rounded-lg p-4 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-white/60 text-sm">Saldo BRL3:</span>
                <span className="text-white font-mono font-bold text-lg" data-testid="text-balance-brl3">{balance} BRL3</span>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Mint Section */}
      <Card className="bg-[#2A2640] border-white/10">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg">Mintar Tokens</h3>
          <p className="text-white/60 text-sm mt-1">Criar novos tokens BRL3 na sua carteira</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="mint-amount" className="text-white">Quantidade (BRL3)</Label>
            <Input
              id="mint-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="100.00"
              value={mintAmount}
              onChange={(e) => setMintAmount(e.target.value)}
              disabled={!connected || isMinting}
              className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
              data-testid="input-mint-amount"
            />
          </div>
          <Button
            onClick={handleMint}
            disabled={!connected || isMinting || !mintAmount}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            data-testid="button-mint"
          >
            {isMinting ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Mintando...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Mintar via MetaMask
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Burn Section */}
      <Card className="bg-[#2A2640] border-white/10">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-white font-semibold text-lg">Queimar Tokens</h3>
          <p className="text-white/60 text-sm mt-1">Destruir tokens BRL3 da sua carteira</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="burn-amount" className="text-white">Quantidade (BRL3)</Label>
            <Input
              id="burn-amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="50.00"
              value={burnAmount}
              onChange={(e) => setBurnAmount(e.target.value)}
              disabled={!connected || isBurning}
              className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
              data-testid="input-burn-amount"
            />
          </div>
          <Button
            onClick={handleBurn}
            disabled={!connected || isBurning || !burnAmount}
            className="w-full bg-red-600 hover:bg-red-700"
            size="lg"
            data-testid="button-burn"
          >
            {isBurning ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Queimando...
              </>
            ) : (
              <>
                <Wallet className="w-5 h-5 mr-2" />
                Queimar via MetaMask
                <ChevronRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Last Transaction */}
      {lastTxHash && (
        <Card className="bg-[#2A2640] border-white/10">
          <div className="p-6">
            <h3 className="text-white font-semibold mb-2">Última Transação</h3>
            <a
              href={`https://polygonscan.com/tx/${lastTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors"
              data-testid="link-polygonscan"
            >
              <span className="font-mono text-sm">{lastTxHash.slice(0, 10)}...{lastTxHash.slice(-8)}</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </Card>
      )}
    </div>
  );
}
