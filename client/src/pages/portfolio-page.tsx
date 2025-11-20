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
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, DollarSign, Settings, AlertCircle, Info, Copy, Check } from "lucide-react";
import type { Position, Market, Transaction } from "@shared/schema";
import { useEffect, useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { formatBRL3, formatDateTimeBR } from "@shared/utils/currency";
import { getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";
import { useMetaMask } from "@/contexts/MetaMaskContext";
import { ethers } from "ethers";

export default function PortfolioPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { state: metaMaskState, connect: connectMetaMask } = useMetaMask();
  const [, setLocation] = useLocation();
  const [walletAddress, setWalletAddress] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [cnpjCopied, setCnpjCopied] = useState(false);

  useEffect(() => {
    if (metaMaskState.account) {
      setWalletAddress(metaMaskState.account);
    }
  }, [metaMaskState.account]);

  const { data: positions, isLoading: positionsLoading } = useQuery<
    (Position & { market: Market })[]
  >({
    queryKey: ["/api/positions"],
  });

  const { data: transactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const depositMutation = useMutation({
    mutationFn: async (data: { amount: string; currency: "BRL"; proofFile: File; walletAddress: string }) => {
      const formData = new FormData();
      formData.append("amount", data.amount);
      formData.append("currency", data.currency);
      formData.append("proofFile", data.proofFile);
      formData.append("walletAddress", data.walletAddress);

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
      walletAddress: string;
    }) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw/request", data);
      return await res.json();
    },
    onSuccess: () => {
      setWithdrawAmount("");
      setPixKey("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
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

  const handleWithdrawClick = async () => {
    if (!withdrawAmount || !pixKey) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o valor e a chave PIX",
        variant: "destructive",
      });
      return;
    }

    if (!walletAddress || !ethers.isAddress(walletAddress)) {
      toast({
        title: "Carteira inválida",
        description: "Conecte sua carteira no MetaMask ou informe um endereço válido.",
        variant: "destructive",
      });
      return;
    }

    await withdrawMutation.mutateAsync({
      amount: withdrawAmount,
      pixKey: pixKey,
      walletAddress,
    });
  };

  // Função para copiar CNPJ
  const handleCopyCnpj = async () => {
    const cnpj = "60.028.471/0001-30";
    try {
      await navigator.clipboard.writeText(cnpj);
      setCnpjCopied(true);
      toast({
        title: "CNPJ copiado!",
        description: "Cole no app do seu banco para fazer o PIX",
      });
      setTimeout(() => setCnpjCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Erro ao copiar",
        description: "Tente copiar manualmente: 60.028.471/0001-30",
        variant: "destructive",
      });
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

                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3 backdrop-blur-sm">
                      <div className="flex items-center gap-2 text-sm">
                        <Wallet className="h-4 w-4 text-primary" />
                        <span className="font-medium text-white">Destinatário do PIX</span>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-purple-light text-xs">CNPJ</Label>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-white/5 border border-white/10 rounded-md px-3 py-2 font-mono text-white text-sm">
                            60.028.471/0001-30
                          </div>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={handleCopyCnpj}
                            className="border-primary/50 hover:bg-primary/10 flex-shrink-0"
                            data-testid="button-copy-cnpj"
                          >
                            {cnpjCopied ? (
                              <Check className="h-4 w-4 text-primary" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        <p className="text-xs text-purple-muted">
                          Use este CNPJ como destinatário no app do seu banco
                        </p>
                      </div>
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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="deposit-wallet" className="text-white">Carteira para receber BRL3</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary/50 hover:bg-primary/10"
                          onClick={() => connectMetaMask()}
                        >
                          Conectar MetaMask
                        </Button>
                      </div>
                      <Input
                        id="deposit-wallet"
                        type="text"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30 font-mono"
                      />
                      <p className="text-xs text-purple-muted">
                        Tokens BRL3 serão mintados para este endereço na aprovação do admin.
                      </p>
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
                        if (!walletAddress || !ethers.isAddress(walletAddress)) {
                          toast({
                            title: "Carteira inválida",
                            description: "Conecte ou insira um endereço de carteira válido para receber BRL3.",
                            variant: "destructive",
                          });
                          return;
                        }
                        depositMutation.mutate({
                          amount: depositAmount,
                          currency: "BRL",
                          proofFile: depositProofFile,
                          walletAddress,
                        });
                      }}
                      disabled={!depositAmount || !depositProofFile || !walletAddress || depositMutation.isPending}
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
                    <div className="bg-accent/20 border border-accent/30 rounded-lg p-4 text-sm backdrop-blur-sm">
                      <span className="font-medium text-white">Saque Manual com Aprovação</span>
                      <p className="text-purple-light mt-1">
                        Solicite saque via PIX. Seu saque será aprovado pelo admin e o PIX será processado.
                      </p>
                    </div>

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
                      <div className="flex items-center justify-between">
                        <Label htmlFor="withdraw-wallet" className="text-white">Carteira de onde queimar BRL3</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-primary/50 hover:bg-primary/10"
                          onClick={() => connectMetaMask()}
                        >
                          Conectar MetaMask
                        </Button>
                      </div>
                      <Input
                        id="withdraw-wallet"
                        type="text"
                        placeholder="0x..."
                        value={walletAddress}
                        onChange={(e) => setWalletAddress(e.target.value)}
                        className="bg-white/5 backdrop-blur-sm border-white/10 text-white placeholder:text-purple-muted focus-visible:ring-primary focus-visible:border-white/30 font-mono"
                      />
                      <p className="text-xs text-purple-muted">
                        O admin queimará tokens deste endereço antes de processar o saque.
                      </p>
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

                    <Button
                      onClick={handleWithdrawClick}
                      disabled={
                        !withdrawAmount || 
                        !pixKey || 
                        !walletAddress ||
                        withdrawMutation.isPending
                      }
                      className="w-full gradient-purple border border-primary shadow-purple"
                      data-testid="button-withdraw-pix"
                    >
                      {withdrawMutation.isPending ? "Enviando..." : "Solicitar Saque"}
                    </Button>
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
