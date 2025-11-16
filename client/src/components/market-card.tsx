import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, DollarSign } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { probToOdds, formatOdds, formatProbability, getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";
import { formatBRLCompact } from "@shared/utils/currency";

interface MarketCardProps {
  market: Market;
  isPublic?: boolean;
}

const categoryColors: Record<string, string> = {
  trending: "bg-primary/20 text-primary-foreground border-primary/30",
  breaking: "bg-destructive/20 text-destructive-foreground border-destructive/30",
  new: "bg-accent/20 text-accent-foreground border-accent/30",
  elections: "bg-primary/20 text-primary-foreground border-primary/30",
  politics: "bg-primary/20 text-primary-foreground border-primary/30",
  sports: "bg-accent/20 text-accent-foreground border-accent/30",
  finance: "bg-primary/20 text-primary-foreground border-primary/30",
  crypto: "bg-primary/20 text-primary-foreground border-primary/30",
  geopolitics: "bg-primary/20 text-primary-foreground border-primary/30",
  tech: "bg-primary/20 text-primary-foreground border-primary/30",
  culture: "bg-primary/20 text-primary-foreground border-primary/30",
  world: "bg-primary/20 text-primary-foreground border-primary/30",
  economy: "bg-primary/20 text-primary-foreground border-primary/30",
};

const categoryLabels: Record<string, string> = {
  trending: "Em Alta",
  breaking: "Urgente",
  new: "Novos",
  elections: "Eleições",
  politics: "Política",
  sports: "Esportes",
  finance: "Finanças",
  crypto: "Crypto",
  geopolitics: "Geopolítica",
  tech: "Tecnologia",
  culture: "Cultura",
  world: "Mundo",
  economy: "Economia",
};

function TrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

export function MarketCard({ market, isPublic = false }: MarketCardProps) {
  const [, setLocation] = useLocation();
  const yesPrice = getYesPriceFromReserves(market.yesReserve, market.noReserve);
  const noPrice = getNoPriceFromReserves(market.yesReserve, market.noReserve);
  
  const yesOdds = probToOdds(yesPrice);
  const noOdds = probToOdds(noPrice);
  
  const volume = parseFloat(market.totalVolume);
  const totalReserves = parseFloat(market.yesReserve) + parseFloat(market.noReserve);
  const totalShares = totalReserves > 0 ? totalReserves : 0;

  return (
    <Card className="overflow-hidden hover-elevate bg-white/5 border-white/10 backdrop-blur-md" data-testid={`card-market-${market.id}`}>
      <div className="p-6 space-y-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <Badge 
              className={`whitespace-nowrap inline-flex items-center rounded-lg text-xs font-semibold transition-colors ${categoryColors[market.category]} border`}
              data-testid={`badge-category-${market.category}`}
            >
              {categoryLabels[market.category]}
            </Badge>
            {market.status === "active" && (
              <span className="flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
            )}
          </div>
          
          <Link href={`/market/${market.id}`}>
            <h3 className="font-semibold text-xl leading-tight text-white hover:text-primary transition-colors line-clamp-2 cursor-pointer" data-testid={`text-market-title-${market.id}`}>
              {market.title}
            </h3>
          </Link>
        </div>

        {/* Mini Chart Placeholder */}
        <div className="h-20 w-full rounded-lg bg-gradient-to-r from-purple-600/20 via-purple-500/10 to-purple-600/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-500/20 to-transparent"></div>
          <div className="absolute bottom-2 left-4 text-purple-light text-xs font-mono">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Lastreado
            </span>
          </div>
        </div>

        {/* Probabilities */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-purple/20 rounded-xl p-4 text-center border border-purple-500/20">
            <div className="text-3xl font-bold tabular-nums text-white drop-shadow-glow" data-testid={`text-yes-probability-${market.id}`}>
              {formatProbability(yesPrice)}
            </div>
            <div className="text-xs text-purple-light mt-1">SIM</div>
          </div>
          
          <div className="bg-gradient-red/20 rounded-xl p-4 text-center border border-red-500/20">
            <div className="text-3xl font-bold tabular-nums text-white drop-shadow-glow" data-testid={`text-no-probability-${market.id}`}>
              {formatProbability(noPrice)}
            </div>
            <div className="text-xs text-purple-light mt-1">NÃO</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-purple-light">
          <div className="flex items-center gap-1.5" data-testid={`text-volume-${market.id}`}>
            <DollarSign className="h-4 w-4" />
            <span>{formatBRLCompact(volume)}</span>
          </div>
          <div className="flex items-center gap-1.5" data-testid={`text-participants-${market.id}`}>
            <Users className="h-4 w-4" />
            <span>{Math.floor(totalShares / 10)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            size="lg"
            className="bg-gradient-purple text-white font-semibold shadow-purple border border-primary"
            onClick={() => setLocation(`/market/${market.id}?action=buy&type=yes`)}
            data-testid={`button-buy-yes-${market.id}`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>SIM</span>
              <span className="text-xs opacity-90" data-testid={`text-yes-odds-${market.id}`}>{formatOdds(yesOdds)}</span>
            </span>
          </Button>
          <Button
            size="lg"
            className="bg-gradient-red text-white font-semibold shadow-lg border border-destructive"
            onClick={() => setLocation(`/market/${market.id}?action=buy&type=no`)}
            data-testid={`button-buy-no-${market.id}`}
          >
            <span className="flex items-center justify-center gap-2">
              <span>NÃO</span>
              <span className="text-xs opacity-90" data-testid={`text-no-odds-${market.id}`}>{formatOdds(noOdds)}</span>
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
