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
import type { Market } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const { toast } = useToast();
  
  const [newMarket, setNewMarket] = useState({
    title: "",
    description: "",
    category: "politica" as const,
    resolutionSource: "",
    endDate: "",
  });

  const { data: markets } = useQuery<Market[]>({
    queryKey: ["/api/admin/markets"],
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
                          <span className="font-medium ml-2">R$ {parseFloat(market.totalVolume).toLocaleString('pt-BR')}</span>
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
                  <div className="text-6xl mb-4">✅</div>
                  <h3 className="text-xl font-semibold mb-2">Nenhum mercado pendente</h3>
                  <p className="text-muted-foreground">
                    Todos os mercados encerrados foram resolvidos
                  </p>
                </Card>
              )}
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
                          Volume: R$ {parseFloat(market.totalVolume).toLocaleString('pt-BR')}
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
