import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Users, DollarSign } from "lucide-react";
import { Link } from "wouter";
import type { Market } from "@shared/schema";
import { probToOdds, formatOdds, formatProbability, getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";
import { formatBRLCompact } from "@shared/utils/currency";

interface MarketCardProps {
  market: Market;
  isPublic?: boolean;
}

const categoryColors: Record<string, string> = {
  trending: "bg-primary/10 text-primary border-primary/20",
  breaking: "bg-destructive/10 text-destructive border-destructive/20",
  new: "bg-accent/10 text-accent-foreground border-accent/20",
  elections: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  politics: "bg-chart-2/10 text-chart-2 border-chart-2/20",
  sports: "bg-chart-3/10 text-chart-3 border-chart-3/20",
  finance: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  crypto: "bg-chart-5/10 text-chart-5 border-chart-5/20",
  geopolitics: "bg-secondary/10 text-secondary-foreground border-secondary/20",
  tech: "bg-primary/10 text-primary border-primary/20",
  culture: "bg-accent/10 text-accent-foreground border-accent/20",
  world: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  economy: "bg-chart-2/10 text-chart-2 border-chart-2/20",
};

const categoryLabels: Record<string, string> = {
  trending: "Em Alta",
  breaking: "Urgente",
  new: "Novos",
  elections: "Eleições",
  politics: "Política",
  sports: "Esportes",
  finance: "Finanças",
  crypto: "Cripto",
  geopolitics: "Geopolítica",
  tech: "Tecnologia",
  culture: "Cultura",
  world: "Mundo",
  economy: "Economia",
};

export function MarketCard({ market, isPublic = false }: MarketCardProps) {
  const yesPrice = getYesPriceFromReserves(market.yesReserve, market.noReserve);
  const noPrice = getNoPriceFromReserves(market.yesReserve, market.noReserve);
  
  const yesOdds = probToOdds(yesPrice);
  const noOdds = probToOdds(noPrice);
  
  const volume = parseFloat(market.totalVolume);
  const totalReserves = parseFloat(market.yesReserve) + parseFloat(market.noReserve);
  const totalShares = totalReserves > 0 ? totalReserves : 0;

  return (
    <Card className="overflow-hidden hover-elevate transition-all duration-200" data-testid={`card-market-${market.id}`}>
      <div className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge 
              variant="outline" 
              className={`${categoryColors[market.category]} border`}
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
            <h3 className="font-semibold text-base leading-tight hover:text-primary transition-colors line-clamp-2" data-testid={`text-market-title-${market.id}`}>
              {market.title}
            </h3>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1 cursor-help">
                <div className="text-xs text-muted-foreground">SIM</div>
                <div className="text-2xl font-bold tabular-nums text-primary" data-testid={`text-yes-odds-${market.id}`}>
                  {formatOdds(yesOdds)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Probabilidade impl\u00edcita: {formatProbability(yesPrice)}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="space-y-1 cursor-help">
                <div className="text-xs text-muted-foreground">NÃO</div>
                <div className="text-2xl font-bold tabular-nums text-destructive" data-testid={`text-no-odds-${market.id}`}>
                  {formatOdds(noOdds)}
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Probabilidade impl\u00edcita: {formatProbability(noPrice)}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1" data-testid={`text-volume-${market.id}`}>
            <DollarSign className="h-3 w-3" />
            <span>{formatBRLCompact(volume)}</span>
          </div>
          <div className="flex items-center gap-1" data-testid={`text-participants-${market.id}`}>
            <Users className="h-3 w-3" />
            <span>{Math.floor(totalShares / 10)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2">
          <Link href={`/market/${market.id}?action=buy&type=yes`}>
            <Button 
              size="sm" 
              className="w-full bg-primary hover:bg-primary/90" 
              data-testid={`button-buy-yes-${market.id}`}
            >
              Comprar SIM
            </Button>
          </Link>
          <Link href={`/market/${market.id}?action=buy&type=no`}>
            <Button 
              size="sm" 
              variant="destructive" 
              className="w-full" 
              data-testid={`button-buy-no-${market.id}`}
            >
              Comprar NÃO
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
}
