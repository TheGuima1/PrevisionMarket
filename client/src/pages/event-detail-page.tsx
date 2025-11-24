import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Vote, Calendar, TrendingUp } from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import { TradePanel } from "@/components/trade-panel";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { getYesPriceFromReserves } from "@shared/utils/odds";
import type { Market } from "@shared/schema";
import { useState } from "react";

interface EventData {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  flagIcon: string | null;
  endDate: string;
  totalVolume: string;
  alternatives: Market[];
  polymarketUrl: string | null;
}

export default function EventDetailPage() {
  const [match, params] = useRoute("/event/:slug");
  const [, setLocation] = useLocation();
  const [selectedMarketId, setSelectedMarketId] = useState<string | null>(null);

  // Fetch event with all alternatives
  const { data: event, isLoading } = useQuery<EventData>({
    queryKey: [`/api/events/${params?.slug}`],
    enabled: !!params?.slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Carregando evento...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Evento não encontrado</h1>
          <p className="text-muted-foreground">
            O evento que você procura não existe ou foi removido.
          </p>
          {params?.slug && (
            <p className="text-sm text-muted-foreground font-mono bg-muted px-3 py-1 rounded">
              Slug: {params.slug}
            </p>
          )}
        </div>
        <Button onClick={() => setLocation("/")} data-testid="button-back-home">
          Voltar à página inicial
        </Button>
      </div>
    );
  }

  // Calculate Yes price for each alternative
  const alternativesWithPrices = event.alternatives.map(alt => {
    const yesPrice = getYesPriceFromReserves(
      alt.yesReserve,
      alt.noReserve
    );
    const percentage = Math.round(yesPrice * 100);
    
    // Get price change
    const priceChange = alt.oneDayPriceChange 
      ? parseFloat(alt.oneDayPriceChange)
      : 0;

    return {
      ...alt,
      yesPrice,
      percentage,
      priceChange,
    };
  });

  // Sort by percentage (descending)
  const sortedAlternatives = [...alternativesWithPrices].sort((a, b) => b.percentage - a.percentage);

  // Get the market for trade panel (selected or first one)
  const displayMarket = selectedMarketId 
    ? sortedAlternatives.find(m => m.id === selectedMarketId) || sortedAlternatives[0]
    : sortedAlternatives[0];
  
  // Get Polymarket URL for selected market or event
  const polymarketSourceUrl = displayMarket?.polymarketSlug
    ? `https://polymarket.com/market/${displayMarket.polymarketSlug}`
    : event.polymarketUrl;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[1400px] mx-auto p-6 space-y-6">
        {/* Header */}
        <Card className="p-6">
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-4 flex-1">
              {/* Event Icon */}
              <div className="w-14 h-14 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Vote className="w-7 h-7 text-primary" />
              </div>

              {/* Event Info */}
              <div className="flex-1 space-y-3">
                <h1 className="text-2xl font-bold">{event.title}</h1>
                <p className="text-muted-foreground">{event.description}</p>

                <div className="flex items-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-mono">
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        minimumFractionDigits: 2,
                      }).format(parseFloat(event.totalVolume))}
                    </span>
                    <span className="text-xs">Vol.</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(new Date(event.endDate), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Chart and Alternatives */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Chart */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Histórico de Probabilidades</h2>
              <PriceChart 
                alternatives={event.alternatives}
              />
            </Card>

            {/* Alternatives (Outcome List) */}
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Opções</h2>
              <div className="space-y-3">
                {sortedAlternatives.map((alt, index) => {
                  const isSelected = alt.id === displayMarket.id;
                  return (<div
                    key={alt.id}
                    className={`flex items-center justify-between gap-4 p-4 rounded-lg border ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border'
                    } hover-elevate cursor-pointer transition-colors`}
                    onClick={() => setSelectedMarketId(alt.id)}
                    data-testid={`alternative-${index}`}
                  >
                    {/* Left: Name and Volume */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{alt.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                          notation: 'compact',
                          maximumFractionDigits: 1,
                        }).format(parseFloat(alt.totalVolume))} Vol.
                      </p>
                    </div>

                    {/* Center: Percentage */}
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {alt.percentage}%
                      </div>
                      {alt.priceChange !== 0 && (
                        <div className={`text-sm ${alt.priceChange > 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {alt.priceChange > 0 ? '+' : ''}{Math.round(alt.priceChange * 100)}%
                        </div>
                      )}
                    </div>

                    {/* Right: Buy Buttons */}
                    <div className="flex gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white min-w-[100px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarketId(alt.id);
                          // Scroll to trade panel on mobile
                          const tradePanel = document.querySelector('[data-trade-panel]');
                          tradePanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        data-testid={`button-buy-yes-${index}`}
                      >
                        Sim {Math.round(alt.yesPrice * 100)}¢
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-600/10 min-w-[100px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedMarketId(alt.id);
                          // Scroll to trade panel on mobile
                          const tradePanel = document.querySelector('[data-trade-panel]');
                          tradePanel?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                        }}
                        data-testid={`button-buy-no-${index}`}
                      >
                        Não {Math.round((1 - alt.yesPrice) * 100)}¢
                      </Button>
                    </div>
                  </div>);
              })}
              </div>
            </Card>
          </div>

          {/* Right Column - Trade Panel */}
          <div className="lg:col-span-1">
            <div className="sticky top-6" data-trade-panel>
              <TradePanel market={displayMarket} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
