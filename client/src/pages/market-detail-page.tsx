import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Navbar } from "@/components/navbar";
import { PublicNavbar } from "@/components/public-navbar";
import { TradePanel } from "@/components/trade-panel";
import { PriceChart } from "@/components/price-chart";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, TrendingUp, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";

const categoryLabels: Record<string, string> = {
  trending: "Em Alta",
  breaking: "Últimas Notícias",
  new: "Novo",
  politics: "Política",
  sports: "Esportes",
  finance: "Finanças",
  crypto: "Cripto",
  geopolitics: "Geopolítica",
  earnings: "Mercado",
  tech: "Tecnologia",
  culture: "Cultura",
  world: "Mundo",
  economy: "Economia",
  elections: "Eleições",
  mentions: "Menções",
};

export default function MarketDetailPage() {
  const [, params] = useRoute("/market/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const marketId = params?.id;

  const { data: market, isLoading: marketLoading } = useQuery<Market>({
    queryKey: ["/api/markets", marketId],
    enabled: !!marketId,
  });

  if (marketLoading) {
    return (
      <div className="min-h-screen bg-background">
        {user ? <Navbar /> : <PublicNavbar />}
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-96" />
        </main>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        {user ? <Navbar /> : <PublicNavbar />}
        <main className="container mx-auto px-4 py-8">
          <div className="text-center py-16 space-y-4">
            <h3 className="text-xl font-semibold">Mercado não encontrado</h3>
            <Button onClick={() => setLocation("/")}>Voltar à página inicial</Button>
          </div>
        </main>
      </div>
    );
  }

  const isActive = market.status === "active";
  const yesPrice = getYesPriceFromReserves(market.yesReserve, market.noReserve);
  const noPrice = getNoPriceFromReserves(market.yesReserve, market.noReserve);
  
  const yesPct = (yesPrice * 100).toFixed(2);
  const noPct = (noPrice * 100).toFixed(2);

  return (
    <div className="min-h-screen bg-background">
      {user ? <Navbar /> : <PublicNavbar />}
      
      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation("/")}
          className="mb-4"
          data-testid="button-back-to-home"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        {/* Header */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-start gap-3 flex-1">
                <Badge variant="outline" className="shrink-0">
                  {categoryLabels[market.category] || market.category}
                </Badge>
                {isActive && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">
                    Ativo
                  </Badge>
                )}
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold leading-tight">
              {market.title}
            </h1>

            <p className="text-muted-foreground leading-relaxed">
              {market.description}
            </p>

            <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                <span className="font-mono">
                  {new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                    minimumFractionDigits: 2,
                  }).format(parseFloat(market.totalVolume))}
                </span>
                <span className="text-xs">Vol.</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(market.endDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </span>
              </div>
            </div>

          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Probabilities Display */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Probabilidades Atuais</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-primary/5 rounded-lg p-6 text-center border border-primary/20">
                  <div className="text-4xl font-bold text-primary mb-2">{yesPct}%</div>
                  <div className="text-sm text-muted-foreground">Probabilidade SIM</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Odds: {yesPrice > 0 ? (1 / yesPrice).toFixed(2) : "∞"}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-6 text-center border border-border">
                  <div className="text-4xl font-bold mb-2">{noPct}%</div>
                  <div className="text-sm text-muted-foreground">Probabilidade NÃO</div>
                  <div className="text-xs text-muted-foreground mt-2">
                    Odds: {noPrice > 0 ? (1 / noPrice).toFixed(2) : "∞"}
                  </div>
                </div>
              </div>
            </Card>

            {/* Price Chart */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Histórico de Probabilidades</h2>
              {market.polymarketSlug ? (
                <PriceChart 
                  polymarketSlug={market.polymarketSlug}
                  market={market}
                />
              ) : (
                <div 
                  className="w-full h-96 flex flex-col items-center justify-center bg-muted/30 rounded-lg border border-border"
                  data-testid="chart-placeholder"
                >
                  <p className="text-muted-foreground text-center" data-testid="text-chart-unavailable">
                    Gráfico de preços em breve
                  </p>
                  <p className="text-sm text-muted-foreground/70 mt-2" data-testid="text-chart-description">
                    Este mercado ainda não possui histórico de preços
                  </p>
                </div>
              )}
            </Card>

            {/* Market Info */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Informações do Mercado</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume Total:</span>
                  <span className="font-mono font-semibold">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    }).format(parseFloat(market.totalVolume))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-semibold">
                    {market.status === "active" ? "Ativo" : "Encerrado"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Encerra em:</span>
                  <span className="font-semibold">
                    {format(new Date(market.endDate), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                {market.resolutionSource && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fonte:</span>
                    <span className="font-semibold">{market.resolutionSource}</span>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column - Trade Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6" data-trade-panel>
              <TradePanel market={market} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
