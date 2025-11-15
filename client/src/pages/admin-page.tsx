import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Market } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CheckCircle, XCircle, Clock, ExternalLink, Users, ArrowRight, Wallet as WalletIcon, TrendingUp, Link2, Trash2, AlertCircle } from "lucide-react";
import type { Transaction } from "@shared/schema";
import { formatBRL3, formatDateTimeBR } from "@shared/utils/currency";

interface PendingDeposit {
  id: string;
  userId: string;
  amount: string;
  currency: string;
  proofFilePath: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  user: {
    username: string;
    email: string;
  };
}

interface AdminUser {
  id: string;
  username: string;
  email: string;
  balanceBrl: string;
  balanceUsdc: string;
  isAdmin: boolean;
  createdAt: Date;
}

interface UserDetails {
  user: AdminUser;
  transactions: Transaction[];
}

interface PolymarketPreview {
  valid: boolean;
  slug?: string;
  title?: string;
  probYes?: number;
  probNo?: number;
  volumeUsd?: number;
  error?: string;
}

export default function AdminPage() {
  const { toast } = useToast();
  
  const [newMarket, setNewMarket] = useState({
    title: "",
    description: "",
    category: "politica" as const,
    resolutionSource: "",
    endDate: "",
  });

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  
  // Polymarket mirror state
  const [polySlug, setPolySlug] = useState("");
  const [polyPreview, setPolyPreview] = useState<PolymarketPreview | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const { data: markets } = useQuery<Market[]>({
    queryKey: ["/api/admin/markets"],
  });

  const { data: pendingDeposits, isLoading: depositsLoading } = useQuery<PendingDeposit[]>({
    queryKey: ["/api/deposits/pending"],
    refetchInterval: 30000, // Refresh every 30s
  });

  const { data: allUsers, isLoading: usersLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
    refetchInterval: 60000, // Refresh every 60s
  });

  const { data: userDetails, isLoading: userDetailsLoading } = useQuery<UserDetails>({
    queryKey: ["/api/admin/users", selectedUserId],
    enabled: !!selectedUserId,
  });

  const createMarketMutation = useMutation({
    mutationFn: async (market: typeof newMarket) => {
      const res = await apiRequest("POST", "/api/admin/markets", market);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado criado!",
        description: "O mercado foi publicado com sucesso",
      });
      setNewMarket({
        title: "",
        description: "",
        category: "politica",
        resolutionSource: "",
        endDate: "",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveMarketMutation = useMutation({
    mutationFn: async ({ marketId, outcome }: { marketId: string; outcome: "yes" | "no" | "cancelled" }) => {
      const res = await apiRequest("POST", `/api/admin/markets/${marketId}/resolve`, { outcome });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado resolvido!",
        description: "O resultado foi registrado e as posições foram liquidadas",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao resolver mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const approveDepositMutation = useMutation({
    mutationFn: async (depositId: string) => {
      const res = await apiRequest("POST", `/api/deposits/${depositId}/approve`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Depósito aprovado!",
        description: data.message || "O saldo do usuário foi atualizado e o BRL3 foi mintado.",
        duration: 5000,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao aprovar depósito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const rejectDepositMutation = useMutation({
    mutationFn: async ({ depositId, reason }: { depositId: string; reason?: string }) => {
      const res = await apiRequest("POST", `/api/deposits/${depositId}/reject`, { reason });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Depósito rejeitado",
        description: "O usuário foi notificado sobre a rejeição.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/deposits/pending"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao rejeitar depósito",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const createMirrorMarketMutation = useMutation({
    mutationFn: async (data: { polymarketSlug: string; title?: string; description?: string }) => {
      const res = await apiRequest("POST", "/api/admin/markets/mirror", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado espelhado criado!",
        description: "O mercado do Polymarket foi adicionado e já está sincronizando.",
      });
      setPolySlug("");
      setPolyPreview(null);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar mercado espelhado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMarketMutation = useMutation({
    mutationFn: async (marketId: string) => {
      const res = await apiRequest("DELETE", `/api/admin/markets/${marketId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Mercado removido!",
        description: "O mercado foi excluído com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao remover mercado",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleValidateSlug = async () => {
    if (!polySlug.trim()) {
      setPolyPreview(null);
      return;
    }

    setIsValidating(true);
    try {
      const res = await apiRequest("POST", "/api/admin/markets/validate-slug", { slug: polySlug.trim() });
      const data = await res.json();
      setPolyPreview(data);
    } catch (error: any) {
      setPolyPreview({
        valid: false,
        error: error.message || "Erro ao validar slug",
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleCreateMirrorMarket = () => {
    if (!polyPreview?.valid || !polyPreview.slug) return;
    
    createMirrorMarketMutation.mutate({
      polymarketSlug: polyPreview.slug,
      title: polyPreview.title,
    });
  };

  const handleCreateMarket = (e: React.FormEvent) => {
    e.preventDefault();
    createMarketMutation.mutate(newMarket);
  };

  const pendingMarkets = markets?.filter(m => m.status === "active" && new Date(m.endDate) < new Date());
  const activeMarkets = markets?.filter(m => m.status === "active");
  const resolvedMarkets = markets?.filter(m => m.status === "resolved");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div>
          <h1 className="font-accent text-4xl font-bold mb-2">Painel Admin</h1>
          <p className="text-muted-foreground">Gerenciar mercados e resoluções</p>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList>
            <TabsTrigger value="create" data-testid="tab-create-market">
              <PlusCircle className="h-4 w-4 mr-2" />
              Criar Mercado
            </TabsTrigger>
            <TabsTrigger value="mirror" data-testid="tab-mirror-polymarket">
              <Link2 className="h-4 w-4 mr-2" />
              Espelhar Polymarket
            </TabsTrigger>
            <TabsTrigger value="deposits" data-testid="tab-pending-deposits">
              <Clock className="h-4 w-4 mr-2" />
              Depósitos ({pendingDeposits?.filter(d => d.status === "pending").length || 0})
            </TabsTrigger>
            <TabsTrigger value="clients" data-testid="tab-clients">
              <Users className="h-4 w-4 mr-2" />
              Clientes ({allUsers?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="resolve" data-testid="tab-resolve-markets">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resolver ({pendingMarkets?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="all" data-testid="tab-all-markets">
              Todos os Mercados
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <Card className="p-6">
              <form onSubmit={handleCreateMarket} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Mercado</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Lula vencerá as eleições de 2026?"
                    value={newMarket.title}
                    onChange={(e) => setNewMarket({ ...newMarket, title: e.target.value })}
                    required
                    data-testid="input-market-title"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva os critérios de resolução e detalhes importantes..."
                    value={newMarket.description}
                    onChange={(e) => setNewMarket({ ...newMarket, description: e.target.value })}
                    className="min-h-32"
                    required
                    data-testid="textarea-market-description"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={newMarket.category}
                      onValueChange={(value: any) => setNewMarket({ ...newMarket, category: value })}
                    >
                      <SelectTrigger data-testid="select-market-category">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="politica">Política</SelectItem>
                        <SelectItem value="economia">Economia</SelectItem>
                        <SelectItem value="cultura">Cultura</SelectItem>
                        <SelectItem value="esportes">Esportes</SelectItem>
                        <SelectItem value="ciencia">Ciência</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data de Encerramento</Label>
                    <Input
                      id="endDate"
                      type="datetime-local"
                      value={newMarket.endDate}
                      onChange={(e) => setNewMarket({ ...newMarket, endDate: e.target.value })}
                      required
                      data-testid="input-market-enddate"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolutionSource">Fonte de Resolução (opcional)</Label>
                  <Input
                    id="resolutionSource"
                    placeholder="Ex: Resultado oficial do TSE"
                    value={newMarket.resolutionSource}
                    onChange={(e) => setNewMarket({ ...newMarket, resolutionSource: e.target.value })}
                    data-testid="input-market-resolution-source"
                  />
                </div>

                <Button
                  type="submit"
                  size="lg"
                  disabled={createMarketMutation.isPending}
                  data-testid="button-create-market"
                >
                  {createMarketMutation.isPending ? "Criando..." : "Criar Mercado"}
                </Button>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="mirror">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Espelhar Mercado do Polymarket</h3>
                <p className="text-sm text-muted-foreground">
                  Adicione mercados do Polymarket com sincronização automática de odds
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="polySlug">Slug do Polymarket</Label>
                  <div className="flex gap-2">
                    <Input
                      id="polySlug"
                      placeholder="Ex: us-recession-in-2025"
                      value={polySlug}
                      onChange={(e) => setPolySlug(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleValidateSlug();
                        }
                      }}
                      data-testid="input-poly-slug"
                    />
                    <Button
                      type="button"
                      onClick={handleValidateSlug}
                      disabled={isValidating || !polySlug.trim()}
                      data-testid="button-validate-slug"
                    >
                      {isValidating ? "Validando..." : "Validar"}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Cole o slug do mercado do Polymarket (última parte da URL)
                  </p>
                </div>

                {polyPreview && !polyPreview.valid && (
                  <Alert variant="destructive" data-testid="alert-invalid-slug">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {polyPreview.error || "Slug inválido ou mercado não encontrado"}
                    </AlertDescription>
                  </Alert>
                )}

                {polyPreview && polyPreview.valid && (
                  <Card className="p-4 bg-muted/50 space-y-4" data-testid="card-poly-preview">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-muted-foreground mb-1">
                            Título do Mercado
                          </p>
                          <p className="font-medium">{polyPreview.title}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Válido
                        </Badge>
                      </div>
                      
                      <Separator />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Odds YES</p>
                          <p className="text-2xl font-mono font-bold text-primary">
                            {((polyPreview.probYes || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Odds NO</p>
                          <p className="text-2xl font-mono font-bold text-destructive">
                            {((polyPreview.probNo || 0) * 100).toFixed(1)}%
                          </p>
                        </div>
                      </div>

                      {polyPreview.volumeUsd && (
                        <div>
                          <p className="text-sm text-muted-foreground">Volume Polymarket</p>
                          <p className="text-lg font-mono">
                            ${(polyPreview.volumeUsd / 1000000).toFixed(2)}M
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleCreateMirrorMarket}
                      disabled={createMirrorMarketMutation.isPending}
                      size="lg"
                      className="w-full"
                      data-testid="button-create-mirror-market"
                    >
                      {createMirrorMarketMutation.isPending ? "Criando..." : "Criar Mercado Espelhado"}
                    </Button>
                  </Card>
                )}

                <Alert>
                  <AlertDescription className="text-sm space-y-2">
                    <p className="font-semibold">Como funciona:</p>
                    <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                      <li>Mercados espelhados sincronizam odds automaticamente a cada 60s</li>
                      <li>Você pode personalizar título e descrição em PT-BR</li>
                      <li>Odds do Polymarket + 2% spread transparente na execução</li>
                      <li>Resolução manual pelo admin quando o evento ocorrer</li>
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            </Card>

            <Card className="p-6 mt-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Mercados Espelhados Ativos</h4>
                  <p className="text-sm text-muted-foreground">
                    {markets?.filter(m => m.origin === "polymarket").length || 0} mercados sincronizando
                  </p>
                </div>

                <div className="space-y-3">
                  {markets?.filter(m => m.origin === "polymarket").map(market => (
                    <div
                      key={market.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover-elevate"
                      data-testid={`market-row-${market.id}`}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{market.title}</p>
                        <p className="text-sm text-muted-foreground">
                          Slug: {market.polymarketSlug}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Remover mercado "${market.title}"?`)) {
                            deleteMarketMutation.mutate(market.id);
                          }
                        }}
                        disabled={deleteMarketMutation.isPending}
                        data-testid={`button-delete-market-${market.id}`}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    </div>
                  ))}
                  
                  {markets?.filter(m => m.origin === "polymarket").length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      Nenhum mercado espelhado ainda. Adicione um acima!
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="deposits">
            <Card className="p-6 space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Depósitos Pendentes</h3>
                <p className="text-sm text-muted-foreground">
                  Analise os comprovantes PIX e aprove ou rejeite as solicitações de depósito
                </p>
              </div>

              {depositsLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : pendingDeposits && pendingDeposits.filter(d => d.status === "pending").length > 0 ? (
                <div className="space-y-4">
                  {pendingDeposits.filter(d => d.status === "pending").map((deposit) => (
                    <Card key={deposit.id} className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/20">
                              Pendente
                            </Badge>
                            <span className="font-medium">
                              {deposit.user.username || deposit.user.email}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
                            <div>
                              <span className="text-muted-foreground">Valor:</span>{" "}
                              <span className="font-semibold text-primary">
                                R$ {parseFloat(deposit.amount).toFixed(2)}
                              </span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Moeda:</span>{" "}
                              <span className="font-mono">{deposit.currency}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Email:</span>{" "}
                              <span className="text-xs">{deposit.user.email}</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Data:</span>{" "}
                              <span className="text-xs">
                                {new Date(deposit.createdAt).toLocaleString("pt-BR")}
                              </span>
                            </div>
                          </div>

                          {deposit.proofFilePath && (
                            <a
                              href={`/api/deposits/proof/${deposit.id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
                              data-testid={`link-proof-${deposit.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Baixar Comprovante PDF
                            </a>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => approveDepositMutation.mutate(deposit.id)}
                            disabled={approveDepositMutation.isPending || rejectDepositMutation.isPending}
                            className="bg-green-600 hover:bg-green-500"
                            data-testid={`button-approve-${deposit.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => rejectDepositMutation.mutate({ depositId: deposit.id })}
                            disabled={approveDepositMutation.isPending || rejectDepositMutation.isPending}
                            data-testid={`button-reject-${deposit.id}`}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rejeitar
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium">Nenhum depósito pendente</p>
                  <p className="text-sm mt-1">Quando usuários solicitarem depósitos, eles aparecerão aqui</p>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="resolve">
            <div className="space-y-4">
              {pendingMarkets && pendingMarkets.length > 0 ? (
                pendingMarkets.map((market) => (
                  <Card key={market.id} className="p-6" data-testid={`pending-market-${market.id}`}>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <h3 className="font-semibold text-lg">{market.title}</h3>
                          <Badge variant="outline" className="bg-secondary/10 border-secondary/20">
                            {market.category}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {market.description}
                        </p>
                      </div>

                      <Separator />

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Volume Total:</span>
                          <span className="font-medium ml-2">{parseFloat(market.totalVolume).toLocaleString('pt-BR')} BRL3</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Encerrou em:</span>
                          <span className="font-medium ml-2">{new Date(market.endDate).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: "yes" })}
                          disabled={resolveMarketMutation.isPending}
                          className="flex-1"
                          data-testid={`button-resolve-yes-${market.id}`}
                        >
                          Resolver como SIM
                        </Button>
                        <Button
                          onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: "no" })}
                          disabled={resolveMarketMutation.isPending}
                          variant="destructive"
                          className="flex-1"
                          data-testid={`button-resolve-no-${market.id}`}
                        >
                          Resolver como NÃO
                        </Button>
                        <Button
                          onClick={() => resolveMarketMutation.mutate({ marketId: market.id, outcome: "cancelled" })}
                          disabled={resolveMarketMutation.isPending}
                          variant="outline"
                          data-testid={`button-resolve-cancel-${market.id}`}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="p-12 text-center">
                  <h3 className="text-xl font-semibold mb-2">Nenhum mercado pendente</h3>
                  <p className="text-muted-foreground">
                    Todos os mercados encerrados foram resolvidos
                  </p>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="clients">
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="font-accent text-xl font-semibold mb-4">
                  Todos os Clientes ({allUsers?.length || 0})
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Atualizado a cada minuto
                </p>
                
                {usersLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Carregando clientes...
                  </div>
                ) : allUsers && allUsers.length > 0 ? (
                  <div className="space-y-2 max-h-[600px] overflow-y-auto">
                    {allUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUserId(user.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-all hover-elevate active-elevate-2 ${
                          selectedUserId === user.id
                            ? 'bg-primary/10 border-primary'
                            : 'border-border'
                        }`}
                        data-testid={`button-select-user-${user.id}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="font-semibold">{user.username}</div>
                          {user.isAdmin && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mb-2">
                          {user.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <WalletIcon className="h-3 w-3 text-primary" />
                          <span className="font-mono font-semibold text-primary">
                            {parseFloat(user.balanceBrl).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} BRL3
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Nenhum cliente encontrado</p>
                  </div>
                )}
              </Card>

              <Card className="p-6">
                {selectedUserId && userDetails ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-accent text-xl font-semibold mb-1">
                        {userDetails.user.username}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {userDetails.user.email}
                      </p>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Saldo BRL3</div>
                        <div className="text-2xl font-bold font-mono text-primary" data-testid="text-user-balance-brl">
                          {formatBRL3(parseFloat(userDetails.user.balanceBrl))}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-sm text-muted-foreground">Cadastro</div>
                        <div className="text-sm font-medium">
                          {formatDateTimeBR(new Date(userDetails.user.createdAt))}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="font-semibold mb-3">
                        Transações Recentes ({userDetails.transactions.length})
                      </h4>
                      
                      {userDetails.transactions.length > 0 ? (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto">
                          {userDetails.transactions.map((tx) => (
                            <div
                              key={tx.id}
                              className="p-3 border rounded-lg text-sm"
                              data-testid={`transaction-${tx.id}`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-medium capitalize">
                                  {tx.type.replace('_', ' ')}
                                </span>
                                <span className={`font-mono font-semibold ${
                                  parseFloat(tx.amount) >= 0 ? 'text-primary' : 'text-destructive'
                                }`}>
                                  {parseFloat(tx.amount) >= 0 ? '+' : ''}{formatBRL3(parseFloat(tx.amount))}
                                </span>
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {formatDateTimeBR(new Date(tx.createdAt))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          Nenhuma transação encontrada
                        </div>
                      )}
                    </div>
                  </div>
                ) : selectedUserId && userDetailsLoading ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">Carregando detalhes...</p>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <h4 className="font-semibold mb-2">Selecione um cliente</h4>
                    <p className="text-sm text-muted-foreground">
                      Escolha um cliente na lista para ver seus detalhes e transações
                    </p>
                  </div>
                )}
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="all">
            <div className="space-y-6">
              <div>
                <h3 className="font-accent text-xl font-semibold mb-4">Ativos ({activeMarkets?.length || 0})</h3>
                <div className="space-y-2">
                  {activeMarkets?.slice(0, 5).map((market) => (
                    <div key={market.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{market.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Volume: {parseFloat(market.totalVolume).toLocaleString('pt-BR')} BRL3
                        </div>
                      </div>
                      <Badge>{market.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="font-accent text-xl font-semibold mb-4">Resolvidos ({resolvedMarkets?.length || 0})</h3>
                <div className="space-y-2">
                  {resolvedMarkets?.slice(0, 5).map((market) => (
                    <div key={market.id} className="flex items-center justify-between p-4 border rounded-lg opacity-60">
                      <div className="flex-1">
                        <div className="font-medium">{market.title}</div>
                        <div className="text-sm text-muted-foreground">
                          Resultado: {market.resolvedOutcome === "yes" ? "SIM" : market.resolvedOutcome === "no" ? "NÃO" : "CANCELADO"}
                        </div>
                      </div>
                      <Badge variant="outline">{market.category}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
