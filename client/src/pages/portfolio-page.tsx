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
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, DollarSign, Settings } from "lucide-react";
import type { Position, Market, Transaction } from "@shared/schema";
import { useState } from "react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { formatBRL3, formatDateTimeBR } from "@shared/utils/currency";
import { getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";

export default function PortfolioPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [depositAmount, setDepositAmount] = useState("");
  const [depositProofFile, setDepositProofFile] = useState<File | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");

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
    mutationFn: async (data: { amount: string; currency: "BRL3"; type: string }) => {
      const res = await apiRequest("POST", "/api/wallet/withdraw", data);
      return await res.json();
    },
    onSuccess: () => {
      setWithdrawAmount("");
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Saque realizado!",
        description: "Fundos retirados com sucesso",
      });
    },
  });

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
  const totalValue = positions?.reduce((acc, pos) => acc + calculatePnL(pos).currentValue, 0) || 0;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-accent text-4xl font-bold mb-2">Portfólio</h1>
            <p className="text-muted-foreground">Gerencie suas posições e carteira</p>
          </div>
          {user?.isAdmin && (
            <Button 
              variant="outline" 
              className="gap-2 border-[var(--primary-blue)]/30 text-[var(--primary-blue)] hover:bg-[var(--glass-blue)]"
              onClick={() => setLocation("/admin")}
              data-testid="button-admin-access"
            >
              <Settings className="h-4 w-4" />
              Painel Admin
            </Button>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Wallet className="h-4 w-4" />
              <span>Valor Total</span>
            </div>
            <div className="text-3xl font-bold tabular-nums" data-testid="text-total-value">
              {formatBRL3(totalValue)}
            </div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <DollarSign className="h-4 w-4" />
              <span>Investido</span>
            </div>
            <div className="text-3xl font-bold tabular-nums" data-testid="text-total-invested">
              {formatBRL3(totalInvested)}
            </div>
          </Card>

          <Card className="p-6 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <TrendingUp className="h-4 w-4" />
              <span>P&L Total</span>
            </div>
            <div className={`text-3xl font-bold tabular-nums ${totalPnL >= 0 ? 'text-primary' : 'text-destructive'}`} data-testid="text-total-pnl">
              {totalPnL >= 0 ? '+' : ''}{formatBRL3(totalPnL)}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="positions" className="space-y-6">
          <TabsList>
            <TabsTrigger value="positions" data-testid="tab-positions">Posições</TabsTrigger>
            <TabsTrigger value="orders" data-testid="tab-orders">Ordens</TabsTrigger>
            <TabsTrigger value="wallet" data-testid="tab-wallet">Carteira</TabsTrigger>
            <TabsTrigger value="history" data-testid="tab-history">Histórico</TabsTrigger>
          </TabsList>

          <TabsContent value="positions" className="space-y-4">
            {positionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32" />
                ))}
              </div>
            ) : positions && positions.length > 0 ? (
              <div className="space-y-4" data-testid="list-positions">
                {positions.map((position) => {
                  const { pnl, pnlPercent, currentValue } = calculatePnL(position);
                  const yesShares = parseFloat(position.yesShares);
                  const noShares = parseFloat(position.noShares);

                  return (
                    <Card key={position.id} className="p-6" data-testid={`position-${position.id}`}>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <Link href={`/market/${position.market.id}`}>
                            <h3 className="font-semibold hover:text-primary transition-colors">
                              {position.market.title}
                            </h3>
                          </Link>
                          <div className="flex flex-wrap gap-2 text-sm">
                            {yesShares > 0 && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                                {yesShares.toFixed(2)} SIM
                              </Badge>
                            )}
                            {noShares > 0 && (
                              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                                {noShares.toFixed(2)} NÃO
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex gap-6 text-sm">
                          <div>
                            <div className="text-muted-foreground mb-1">Valor Atual</div>
                            <div className="font-semibold tabular-nums">
                              {formatBRL3(currentValue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground mb-1">P&L</div>
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
              <Card className="p-12 text-center">
                <h3 className="text-xl font-semibold mb-2">Nenhuma posição ativa</h3>
                <p className="text-muted-foreground mb-6">
                  Comece a negociar para ver suas posições aqui
                </p>
                <Link href="/">
                  <Button>Explorar Mercados</Button>
                </Link>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="orders">
            <OpenOrders />
          </TabsContent>

          <TabsContent value="wallet" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <h3 className="font-accent text-xl font-semibold">Depositar</h3>
                <Tabs defaultValue="pix">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="pix" data-testid="tab-deposit-pix">Depositar via PIX</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="space-y-4 mt-4">
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4 text-sm">
                      <span className="font-medium">Depósito Manual com Aprovação</span>
                      <p className="text-muted-foreground mt-1">
                        Envie o comprovante PIX. Seu depósito será aprovado pelo admin e o BRL3 será mintado on-chain.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-pix">Valor em R$</Label>
                      <Input
                        id="deposit-pix"
                        type="number"
                        placeholder="0.00"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        data-testid="input-deposit-pix"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deposit-proof-file">Comprovante PIX (PDF) *</Label>
                      <Input
                        id="deposit-proof-file"
                        type="file"
                        accept=".pdf,application/pdf"
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
                      <p className="text-xs text-muted-foreground">
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
                      className="w-full bg-brand-500 hover:bg-brand-400"
                      data-testid="button-deposit-pix"
                    >
                      {depositMutation.isPending ? "Enviando..." : "Solicitar Depósito"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="font-accent text-xl font-semibold">Sacar</h3>
                <Tabs defaultValue="pix">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="pix" data-testid="tab-withdraw-pix">Sacar via PIX</TabsTrigger>
                  </TabsList>

                  <TabsContent value="pix" className="space-y-4 mt-4">
                    <div className="bg-brand-500/10 border border-brand-500/20 rounded-lg p-4 text-sm">
                      <span className="font-medium">Saque via PIX</span>
                      <p className="text-muted-foreground mt-1">
                        Converta BRL3 → PIX e receba na sua conta bancária.
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="withdraw-pix">Valor em R$</Label>
                      <Input
                        id="withdraw-pix"
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="0"
                        step="0.01"
                        data-testid="input-withdraw-pix"
                      />
                    </div>
                    <Button
                      onClick={() => withdrawMutation.mutate({
                        amount: withdrawAmount,
                        currency: "BRL3",
                        type: "withdrawal_pix"
                      })}
                      disabled={!withdrawAmount || withdrawMutation.isPending}
                      className="w-full"
                      variant="outline"
                      data-testid="button-withdraw-pix"
                    >
                      {withdrawMutation.isPending ? "Processando..." : "Sacar via PIX"}
                    </Button>
                  </TabsContent>
                </Tabs>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="history">
            <Card className="p-6">
              <h3 className="font-accent text-xl font-semibold mb-4">Transações Recentes</h3>
              {transactions && transactions.length > 0 ? (
                <div className="space-y-2">
                  {transactions.slice(0, 20).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-3 border-b last:border-0" data-testid={`transaction-${tx.id}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${
                          tx.type.includes('deposit') ? 'bg-primary/10' : 'bg-destructive/10'
                        }`}>
                          {tx.type.includes('deposit') ? (
                            <ArrowDownRight className={`h-4 w-4 ${tx.type.includes('deposit') ? 'text-primary' : 'text-destructive'}`} />
                          ) : (
                            <ArrowUpRight className={`h-4 w-4 ${tx.type.includes('deposit') ? 'text-primary' : 'text-destructive'}`} />
                          )}
                        </div>
                        <div>
                          <div className="font-medium capitalize">
                            {tx.type.replace('_', ' ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTimeBR(tx.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold tabular-nums">
                          {formatBRL3(parseFloat(tx.amount))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
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
