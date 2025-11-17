import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { AIAssistant } from "@/components/ai-assistant";
import { OpenOrders } from "@/components/open-orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, DollarSign, Settings, AlertCircle, Info } from "lucide-react";
import type { Position, Market, Transaction } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { formatBRL3, formatDateTimeBR } from "@shared/utils/currency";
import { getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";
import { signPermit, isPolygonNetwork, switchToPolygon } from "@/lib/polygonUtils";

export default function PortfolioPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [depositAmount, setDepositAmount] = useState("");
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  
  // Loading states para MetaMask/Polygon
  const [isSigningPermit, setIsSigningPermit] = useState(false);
  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const { data: positions, isLoading: positionsLoading } = useQuery<
    (Position & { market: Market })[]
  >({
    queryKey: ["/api/positions"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; currency: "BRL"; proofFile: File }) => {
      const formData = new FormData();
      formData.append("amount", data.amount);
      formData.append("currency", data.currency);
      formData.append("proofFile", data.proofFile);

      const res = await fetch("/api/deposits/request", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Falha ao solicitar depósito");
      }

      return await res.json();
    },
    onSuccess: () => {
      setDepositAmount("");
      setDepositProofFile(null);
      toast({
        title: "Solicitação enviada!",
        description: "Seu depósito está aguardando aprovação. Você será notificado quando for processado.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar depósito",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  const withdrawMutation = useMutation({
    mutationFn: async (data: { 
      amount: string; 
      pixKey: string;
      permitSignature?: {
        deadline: string;
        v: number;
        r: string;
        s: string;
      }
    }) => {
      // Flatten permitSignature into separate fields for backend
      const { permitSignature, ...rest } = data;
      const payload = permitSignature 
        ? {
            ...rest,
            permitDeadline: permitSignature.deadline,
            permitV: permitSignature.v,
            permitR: permitSignature.r,
            permitS: permitSignature.s,
          }
        : rest;
      
      const res = await apiRequest("POST", "/api/wallet/withdraw/request", payload);
      return await res.json();
    },
    onSuccess: () => {
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Solicitação enviada!",
        description: "Seu saque está aguardando aprovação. Você será notificado quando for processado.",
        duration: 5000,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    },
  });

  // Função completa para processar saque com MetaMask/Polygon
  const handleWithdrawClick = async () => {
    try {
      // Validação 1: Valores preenchidos
      if (!withdrawAmount || !pixKey) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha o valor e a chave PIX",
          variant: "destructive",
        });
        return;
      }

      // Tentar coletar assinatura MetaMask se disponível
      let signature: { deadline: string; v: number; r: string; s: string } | undefined;

      // Verificar se MetaMask está disponível
      if (window.ethereum) {
        // Verificar se está na rede Polygon
        const onPolygon = await isPolygonNetwork();
        
        if (onPolygon && user?.walletAddress) {
          // Obter variáveis de ambiente
          const tokenAddress = import.meta.env.VITE_TOKEN_CONTRACT_ADDRESS;
          const adminAddress = import.meta.env.VITE_ADMIN_ADDRESS;
          const tokenDecimals = parseInt(import.meta.env.VITE_TOKEN_DECIMALS || "18");

          if (tokenAddress && adminAddress) {
            try {
              // Tentar assinar permit via MetaMask
              setIsSigningPermit(true);
              toast({
                title: "Aguardando assinatura...",
                description: "Confirme a assinatura no MetaMask (sem custo de gas)",
              });

              signature = await signPermit(
                parseFloat(withdrawAmount),
                tokenDecimals,
                tokenAddress,
                adminAddress
              );

              setIsSigningPermit(false);
            } catch (signError: any) {
              setIsSigningPermit(false);
              
              // Se usuário cancelou assinatura, parar aqui
              if (signError.message?.includes("User denied") || signError.message?.includes("cancelada")) {
                toast({
                  title: "Assinatura cancelada",
                  description: "Você pode tentar novamente ou enviar sem assinatura (aprovação manual do admin).",
                  variant: "destructive",
                });
                return;
              }
              
              // Para outros erros de assinatura, continuar sem assinatura
              console.warn("Erro ao assinar permit, enviando sem assinatura:", signError);
              toast({
                title: "Aviso",
                description: "Enviando solicitação sem assinatura (aprovação manual necessária).",
              });
            }
          }
        }
      }

      // Enviar request (com ou sem assinatura)
      await withdrawMutation.mutateAsync({
        amount: withdrawAmount,
        pixKey: pixKey,
        permitSignature: signature,
      });

    } catch (error: any) {
      setIsSigningPermit(false);
      
      // Tratamento de erros de submissão
      toast({
        title: "Erro ao solicitar saque",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive",
      });
    }
  };

  // Função para trocar para Polygon
  const handleSwitchToPolygon = async () => {
    try {
      setIsSwitchingNetwork(true);
      await switchToPolygon();
      toast({
        title: "Rede alterada!",
        description: "Você está agora na rede Polygon.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao trocar rede",
        description: error.message || "Tente trocar manualmente no MetaMask",
        variant: "destructive",
      });
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  const calculatePnL = (position: Position & { market: Market }) => {
    const yesShares = parseFloat(position.yesShares);
    const noShares = parseFloat(position.noShares);
    const yesPrice = getYesPriceFromReserves(position.market.yesReserve, position.market.noReserve);
    const noPrice = getNoPriceFromReserves(position.market.yesReserve, position.market.noReserve);
    const totalInvested = parseFloat(position.totalInvested);

    const currentValue = (yesShares * yesPrice) + (noShares * noPrice);
    const pnl = currentValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return { pnl, pnlPercent, currentValue };
  };

  const totalPnL = positions?.reduce((acc, pos) => acc + calculatePnL(pos).pnl, 0) || 0;
  const totalInvested = positions?.reduce((acc, pos) => acc + parseFloat(pos.totalInvested), 0) || 0;
  const positionsValue = positions?.reduce((acc, pos) => acc + calculatePnL(pos).currentValue, 0) || 0;
  const availableBalance = parseFloat(user?.balanceBrl || "0");
  const totalValue = availableBalance + positionsValue;

  return (
    <div className="min-h-screen bg-[#0F0C34]">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-accent text-4xl font-bold mb-2 text-white">Portfólio</h1>
            <p className="text-purple-light">Gerencie suas posições e carteira</p>
          </div>
          {user?.isAdmin && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setLocation("/admin")}
              data-testid="button-admin-access"
            >
              <Settings className="h-4 w-4 mr-2" />
              Painel Admin
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="glass-card p-6 space-y-2">
            <div className="flex items-center gap-2 text-purple-light text-sm">
              <Wallet className="h-4 w-4" />
              <span>Valor Total</span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-white" data-testid="text-total-value">
              {formatBRL3(totalValue)}
            </div>
          </Card>

          <Card className="glass-card p-6 space-y-2">
            <div className="flex items-center gap-2 text-purple-light text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Disponível</span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-white" data-testid="text-available-balance">
              {formatBRL3(availableBalance)}
            </div>
          </Card>

          <Card className="glass-card p-6 space-y-2">
            <div className="flex items-center gap-2 text-purple-light text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>Em Posições</span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-white" data-testid="text-positions-value">
              {formatBRL3(positionsValue)}
            </div>
          </Card>

          <Card className="glass-card p-6 space-y-2">
            <div className="flex items-center gap-2 text-purple-light text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>P&L Total</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${totalPnL >= 0 ? 'text-primary' : 'text-destructive'}`} data-testid="text-total-pnl">
              {totalPnL >= 0 ? '+' : ''}{formatBRL3(totalPnL)}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList className="glass-card border-white/10">
            <TabsTrigger value="positions" data-testid="tab-positions">Posições</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Ordens</TabsTrigger>
            <TabsTrigger value="wallet" data-testid="tab-wallet">Carteira</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            {positionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 glass-card" />
                ))}
              </div>
            ) : positions && positions.length > 0 ? (
              <div className="space-y-4" data-testid="list-positions">
                {positions.map((position) => {
                  const { pnl, pnlPercent, currentValue } = calculatePnL(position);
                  const yesShares = parseFloat(position.yesShares);
                  const noShares = parseFloat(position.noShares);

                  return (
                    <Card key={position.id} className="glass-card p-6 hover-elevate" data-testid={`position-${position.id}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <Link href={`/market/${position.market.id}`}>
                            <h3 className="font-semibold text-white hover:text-primary transition-colors">
                              {position.market.title}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap gap-2 text-sm">
                            {yesShares > 0 && (
                              <Badge variant="outline" className="bg-primary/20 text-primary-foreground border-primary/30">
                                {yesShares.toFixed(2)} SIM
                              </Badge>
                            )}
                            {noShares > 0 && (
                              <Badge variant="outline" className="bg-destructive/20 text-destructive-foreground border-destructive/30">
                                {noShares.toFixed(2)} NÃO
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-6 text-sm">
                          <div>
                            <div className="text-purple-light mb-1">Valor Atual</div>
                            <div className="font-semibold tabular-nums text-white">
                              {formatBRL3(currentValue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-purple-light mb-1">P&L</div>
                            <div className={`font-semibold tabular-nums flex items-center gap-1 ${pnl >= 0 ? 'text-primary' : 'text-destructive'}`}>
                              {pnl >= 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                              {pnl >= 0 ? '+' : ''}{formatBRL3(pnl)} ({pnlPercent.toFixed(1)}%)
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <Card className="glass-card p-12 text-center">
                <h3 className="text-xl font-semibold mb-2 text-white">Nenhuma posição ativa</h3>
                <p className="text-purple-light mb-6">
                  Comece a negociar para ver suas posições aqui
                </p>
                <Link href="/">
                  <Button className="gradient-purple border border-primary shadow-purple">
                    Explorar Mercados
                  </Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <OpenOrders />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            {!user?.walletAddress && (
              <Alert className="bg-primary/20 border-primary/30 backdrop-blur-sm" data-testid="alert-wallet-missing">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-white">
                  <div className="flex flex-col gap-2">
                    <span className="font-semibold">Carteira Polygon não configurada</span>
                    <span className="text-purple-light">
                      Para sacar fundos, você precisa configurar sua carteira Polygon no perfil. 
                      Esta carteira será usada para receber tokens BRL3 que são queimados automaticamente durante o saque.
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLocation("/profile")}
                      className="w-fit mt-2 border-primary/50 hover:bg-primary/10"
                      data-testid="button-configure-wallet"
                    >
                      Configurar Carteira no Perfil
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="glass-card p-6 space-y-4">
                <h3 className="font-accent text-xl font-semibold text-white">Depositar</h3>
                <Tabs defaultValue="pix">
                  <TabsList className="grid w-full grid-cols-1 glass-card border-white/10">
                    <TabsTrigger value="pix" data-testid="tab-deposit-pix">Depositar via PIX</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="space-y-4 mt-4">
                    <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 text-sm backdrop-blur-sm">
                      <span className="font-medium text-white">Depósito Manual com Aprovação</span>
                      <p className="text-purple-light mt-1">
                        Envie o comprovante PIX. Seu depósito será aprovado pelo admin e o BRL3 será mintado on-chain.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-pix" className="text-white">Valor em R$</Label>
                      <Input
                        id="deposit-pix"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                        data-testid="input-deposit-pix"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-proof-file" className="text-white">Comprovante PIX (PDF) *</Label>
                      <Input
                        id="deposit-proof-file"
                        type="file"
                        accept=".pdf,application/pdf"
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white file:text-white"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            if (file.type !== "application/pdf") {
                              toast({
                                title: "Arquivo inválido",
                                description: "Apenas arquivos PDF são permitidos",
                                variant: "destructive",
                              });
                              e.target.value = "";
                              return;
                            }
                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: "Arquivo muito grande",
                                description: "Tamanho máximo: 5MB",
                                variant: "destructive",
                              });
                              e.target.value = "";
                              return;
                            }
                            setDepositProofFile(file);
                          }
                        }}
                        data-testid="input-deposit-proof-file"
                      />
                      <p className="text-xs text-purple-muted">
                        Envie o comprovante em PDF (máx. 5MB)
                      </p>
                      {depositProofFile && (
                        <p className="text-xs text-primary">
                          ✓ {depositProofFile.name} ({(depositProofFile.size / 1024).toFixed(1)} KB)
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={() => {
                        if (!depositProofFile) {
                          toast({
                            title: "Comprovante obrigatório",
                            description: "Por favor, envie o comprovante em PDF",
                            variant: "destructive",
                          });
                          return;
                        }
                        depositMutation.mutate({
                          amount: depositAmount,
                          currency: "BRL",
                          proofFile: depositProofFile,
                        });
                      }}
                      disabled={!depositAmount || !depositProofFile || depositMutation.isPending}
                      className="w-full gradient-purple border border-primary shadow-purple"
                      data-testid="button-deposit-pix"
                    >
                      {depositMutation.isPending ? "Enviando..." : "Solicitar Depósito"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="glass-card p-6 space-y-4">
                <h3 className="font-accent text-xl font-semibold text-white">Sacar</h3>
                <Tabs defaultValue="pix">
                  <TabsList className="grid w-full grid-cols-1 glass-card border-white/10">
                    <TabsTrigger value="pix" data-testid="tab-withdraw-pix">Sacar via PIX</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="space-y-4 mt-4">
                    <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 text-sm backdrop-blur-sm">
                      <span className="font-medium text-white">Saque via Assinatura Polygon</span>
                      <p className="text-purple-light mt-1">
                        Solicite saque via PIX. Você assinará uma autorização no MetaMask (sem custo de gas) 
                        para permitir que o admin queime seus tokens BRL3 on-chain. O pagamento PIX será processado após aprovação.
                      </p>
                    </div>

                    {window.ethereum && user?.walletAddress && (
                      <div className="bg-accent/20 border border-accent/30 rounded-lg p-3 text-xs backdrop-blur-sm flex items-start gap-2">
                        <Info className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" />
                        <div className="text-purple-light">
                          <span className="font-medium text-white block mb-1">Como funciona:</span>
                          1. Você assina uma autorização no MetaMask (gratuito, sem gas)<br />
                          2. Admin queima seus tokens BRL3 automaticamente<br />
                          3. Você recebe o PIX após aprovação
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="withdraw-pix" className="text-white">Valor em R$</Label>
                      <Input
                        id="withdraw-pix"
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                        data-testid="input-withdraw-pix"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pix-key" className="text-white">Chave PIX *</Label>
                      <Input
                        id="pix-key"
                        type="text"
                        placeholder="CPF, e-mail, telefone ou chave aleatória"
                        value={pixKey}
                        onChange={(e) => setPixKey(e.target.value)}
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30"
                        data-testid="input-pix-key"
                      />
                      <p className="text-xs text-purple-muted">
                        Digite sua chave PIX para receber o valor
                      </p>
                    </div>

                    {window.ethereum && user?.walletAddress && (
                      <Button
                        onClick={handleSwitchToPolygon}
                        disabled={isSwitchingNetwork}
                        variant="outline"
                        className="w-full border-accent/50 text-accent hover:bg-accent/10"
                        data-testid="button-switch-polygon"
                      >
                        {isSwitchingNetwork ? "Trocando rede..." : "🔄 Trocar para Polygon"}
                      </Button>
                    )}

                    <Button
                      onClick={handleWithdrawClick}
                      disabled={
                        !withdrawAmount || 
                        !pixKey || 
                        isSigningPermit || 
                        withdrawMutation.isPending
                      }
                      className="w-full gradient-purple border border-primary shadow-purple"
                      data-testid="button-withdraw-pix"
                    >
                      {isSigningPermit 
                        ? "Aguardando assinatura..." 
                        : withdrawMutation.isPending 
                        ? "Enviando..." 
                        : "Solicitar Saque"}
                    </Button>

                    {!user?.walletAddress && (
                      <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 text-xs backdrop-blur-sm flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                        <p className="text-yellow-100">
                          <span className="font-medium block">Carteira Polygon não configurada.</span>
                          Você pode solicitar o saque, mas precisará configurar sua carteira no perfil para 
                          que o admin possa processar a queima de tokens. Configure antes para agilizar o processo.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="glass-card p-6">
              <h3 className="font-accent text-xl font-semibold mb-4 text-white">Transações Recentes</h3>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0" data-testid={`transaction-${tx.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg backdrop-blur-sm ${
                          tx.type.includes('deposit') ? 'bg-primary/20' : 'bg-destructive/20'
                        }`}>
                          {tx.type.includes('deposit') ? (
                            <ArrowDownRight className={`h-4 w-4 ${tx.type.includes('deposit') ? 'text-primary' : 'text-destructive'}`} />
                          ) : (
                            <ArrowUpRight className={`h-4 w-4 ${tx.type.includes('deposit') ? 'text-primary' : 'text-destructive'}`} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize text-white">
                            {tx.type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-purple-muted">
                            {formatDateTimeBR(tx.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums text-white">
                          {formatBRL3(parseFloat(tx.amount))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-purple-light">
                  Nenhuma transação ainda
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <AIAssistant />
    </div>
  );
}
