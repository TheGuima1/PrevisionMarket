import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { Loader2, Wallet, ChevronRight, ExternalLink, AlertCircle, Chrome } from "lucide-react";
import { BRL3_ABI } from "@/blockchain/brl3Abi";
import { BRL3_TOKEN_ADDRESS, TOKEN_DECIMALS as BRL3_TOKEN_DECIMALS } from "@/blockchain/config";

export function BlockchainActions() {
  const { toast } = useToast();
  const { state, connect, switchToPolygon, refreshBalance } = useMetaMask();
  const [mintAmount, setMintAmount] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [isBurning, setIsBurning] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const CONTRACT_ADDRESS = BRL3_TOKEN_ADDRESS;
  const TOKEN_DECIMALS = BRL3_TOKEN_DECIMALS;

  // Refresh balance when account changes or becomes ready
  useEffect(() => {
    if (state.status === "ready" && state.account) {
      refreshBalance();
    }
  }, [state.status, state.account]);

  async function handleMint() {
    if (!mintAmount || parseFloat(mintAmount) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor maior que zero",
        variant: "destructive",
      });
      return;
    }

    if (state.status !== "ready" || !state.account) {
      toast({
        title: "MetaMask não conectado",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsMinting(true);

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
      const amount = ethers.parseUnits(mintAmount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação",
        description: "Confirme a transação no MetaMask...",
      });

      const tx = await contract.mint(state.account, amount);
      setLastTxHash(tx.hash);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait(1);

      toast({
        title: "Mint realizado com sucesso! ✅",
        description: `${mintAmount} BRL3 mintados no bloco ${receipt.blockNumber}`,
      });

      await refreshBalance();
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

    if (state.status !== "ready" || !state.account) {
      toast({
        title: "MetaMask não conectado",
        description: "Conecte sua carteira primeiro",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsBurning(true);

      const { ethers } = await import("ethers");
      const provider = new ethers.BrowserProvider(window.ethereum!);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(CONTRACT_ADDRESS, BRL3_ABI, signer);
      const amount = ethers.parseUnits(burnAmount, TOKEN_DECIMALS);

      toast({
        title: "Aguardando confirmação",
        description: "Confirme a transação no MetaMask...",
      });

      const tx = await contract.burn(amount);
      setLastTxHash(tx.hash);

      toast({
        title: "Transação enviada",
        description: `Hash: ${tx.hash.slice(0, 10)}...`,
      });

      const receipt = await tx.wait(1);

      toast({
        title: "Burn realizado com sucesso! ✅",
        description: `${burnAmount} BRL3 queimados no bloco ${receipt.blockNumber}`,
      });

      await refreshBalance();
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

  // Helper to render status-specific UI
  function renderConnectionStatus() {
    switch (state.status) {
      case "iframe-blocked":
        return (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertDescription className="text-white/90">
              <div className="space-y-2">
                <p className="font-semibold">MetaMask não funciona em iframe</p>
                <p className="text-sm text-white/70">
                  Para usar o MetaMask, você precisa abrir esta página em uma nova aba do navegador.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20"
                  onClick={() => window.open(window.location.href, '_blank')}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Abrir em Nova Aba
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "not-installed":
        return (
          <Alert className="border-red-500/20 bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <AlertDescription className="text-white/90">
              <div className="space-y-2">
                <p className="font-semibold">MetaMask não está instalado</p>
                <p className="text-sm text-white/70">
                  Instale a extensão MetaMask no seu navegador e recarregue esta página.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-red-500/40 text-red-400 hover:bg-red-500/20"
                  onClick={() => window.open('https://metamask.io/download/', '_blank')}
                >
                  <Chrome className="w-4 h-4 mr-2" />
                  Instalar MetaMask
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "locked":
        return (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertDescription className="text-white/90">
              <div className="space-y-2">
                <p className="font-semibold">MetaMask está bloqueado</p>
                <p className="text-sm text-white/70">
                  Abra a extensão MetaMask e desbloqueie sua carteira.
                </p>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "wrong-network":
        return (
          <Alert className="border-yellow-500/20 bg-yellow-500/10">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <AlertDescription className="text-white/90">
              <div className="space-y-2">
                <p className="font-semibold">Rede incorreta</p>
                <p className="text-sm text-white/70">
                  Você está conectado, mas precisa mudar para a rede Polygon Mainnet.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-2 border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/20"
                  onClick={switchToPolygon}
                >
                  Trocar para Polygon
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        );

      case "ready":
        return (
          <div className="bg-[#1F1B2E] rounded-lg p-4 border border-green-500/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/60 text-sm">Conectado:</p>
                <p className="text-white font-mono text-sm">
                  {state.account?.slice(0, 6)}...{state.account?.slice(-4)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-white/60 text-sm">Saldo BRL3:</p>
                <p className="text-white font-mono font-bold text-lg" data-testid="text-balance-brl3">
                  {state.balance || "0"} BRL3
                </p>
              </div>
            </div>
          </div>
        );

      case "needs-approval":
      case "connecting":
        return null; // Will show connect button below
    }
  }

  const isConnected = state.status === "ready";
  const canConnect = ["needs-approval", "connecting"].includes(state.status);
  const isConnecting = state.status === "connecting";

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
                {isConnected
                  ? "Conectado à Polygon"
                  : canConnect
                  ? "MetaMask disponível"
                  : "MetaMask não disponível"}
              </p>
            </div>
            {canConnect && (
              <Button
                onClick={connect}
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

          {renderConnectionStatus()}
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
              disabled={!isConnected || isMinting}
              className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
              data-testid="input-mint-amount"
            />
          </div>
          <Button
            onClick={handleMint}
            disabled={!isConnected || isMinting || !mintAmount}
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
              disabled={!isConnected || isBurning}
              className="bg-[#1F1B2E] border-white/10 text-white placeholder:text-white/40"
              data-testid="input-burn-amount"
            />
          </div>
          <Button
            onClick={handleBurn}
            disabled={!isConnected || isBurning || !burnAmount}
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
