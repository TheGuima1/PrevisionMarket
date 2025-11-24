import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users } from "lucide-react";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";

interface ModernMarketCardProps {
  market: Market;
}

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

export function ModernMarketCard({ market }: ModernMarketCardProps) {
  const [, setLocation] = useLocation();

  const yesProb = getYesPriceFromReserves(market.yesReserve, market.noReserve);
  const noProb = getNoPriceFromReserves(market.yesReserve, market.noReserve);
  
  const yesPct = Math.round(yesProb * 100);
  const noPct = Math.round(noProb * 100);
  
  const yesOdds = yesProb > 0 ? (1 / yesProb).toFixed(2) : "∞";
  const noOdds = noProb > 0 ? (1 / noProb).toFixed(2) : "∞";

  const handleCardClick = () => {
    setLocation(`/market/${market.id}`);
  };

  return (
    <div
      className="group relative bg-card rounded-xl border border-border overflow-hidden hover-elevate cursor-pointer transition-all"
      onClick={handleCardClick}
      data-testid={`card-market-${market.id}`}
    >
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {categoryLabels[market.category] || market.category}
          </Badge>
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        </div>

        <h3 className="font-semibold text-lg leading-tight line-clamp-2 min-h-[56px]">
          {market.title}
        </h3>

        {/* Lastreado Badge */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TrendingUp className="w-3 h-3" />
          <span>Lastreado</span>
        </div>
      </div>

      {/* Probabilities */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-2 gap-3">
          {/* SIM */}
          <div className="bg-primary/5 rounded-lg p-4 text-center border border-primary/20">
            <div className="text-3xl font-bold text-primary" data-testid={`prob-yes-${market.id}`}>{yesPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">SIM</div>
          </div>

          {/* NÃO */}
          <div className="bg-muted/50 rounded-lg p-4 text-center border border-border">
            <div className="text-3xl font-bold" data-testid={`prob-no-${market.id}`}>{noPct}%</div>
            <div className="text-xs text-muted-foreground mt-1">NÃO</div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-mono" data-testid={`volume-${market.id}`}>
              R$ {parseFloat(market.totalVolume).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3 h-3" />
            <span data-testid={`users-${market.id}`}>1000</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 p-4 pt-0">
        <Button
          variant="default"
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground w-full"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/market/${market.id}`);
          }}
          data-testid={`button-yes-${market.id}`}
        >
          SIM {yesOdds}
        </Button>
        <Button
          variant="destructive"
          size="sm"
          className="w-full"
          onClick={(e) => {
            e.stopPropagation();
            setLocation(`/market/${market.id}`);
          }}
          data-testid={`button-no-${market.id}`}
        >
          NÃO {noOdds}
        </Button>
      </div>
    </div>
  );
}
