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
  trending: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  breaking: "bg-[var(--red-tech)]/10 text-[var(--red-tech)] border-[var(--red-tech)]/20",
  new: "bg-[var(--green-tech)]/10 text-[var(--green-tech)] border-[var(--green-tech)]/20",
  elections: "bg-[var(--chart-blue-light)] text-[var(--chart-blue)] border-[var(--chart-blue)]/20",
  politics: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  sports: "bg-[var(--green-tech)]/10 text-[var(--green-tech)] border-[var(--green-tech)]/20",
  finance: "bg-[var(--chart-blue-light)] text-[var(--chart-blue)] border-[var(--chart-blue)]/20",
  crypto: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  geopolitics: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  tech: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  culture: "bg-[var(--primary-blue-bg)] text-[var(--primary-blue)] border-[var(--primary-blue)]/20",
  world: "bg-[var(--chart-blue-light)] text-[var(--chart-blue)] border-[var(--chart-blue)]/20",
  economy: "bg-[var(--chart-blue-light)] text-[var(--chart-blue)] border-[var(--chart-blue)]/20",
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
    <Card className="overflow-hidden bg-white border-[var(--border-soft)] shadow-card hover:shadow-md transition-all duration-200" data-testid={`card-market-${market.id}`}>
      <div className="p-6 space-y-4 bg-[#f5edff]">
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <Badge 
              variant="outline" 
              className={`whitespace-nowrap inline-flex items-center rounded-md px-3 py-1 text-xs font-semibold transition-colors ${categoryColors[market.category]} border shadow-xs`}
              data-testid={`badge-category-${market.category}`}
            >
              {categoryLabels[market.category]}
            </Badge>
            {market.status === "active" && (
              <span className="flex h-2 w-2 mt-1">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-[var(--primary-blue)] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary-blue)]"></span>
              </span>
            )}
          </div>
          
          <Link href={`/market/${market.id}`}>
            <h3 className="font-semibold text-lg leading-tight text-[var(--text-dark)] hover:text-[var(--primary-blue)] transition-colors line-clamp-2 cursor-pointer" data-testid={`text-market-title-${market.id}`}>
              {market.title}
            </h3>
          </Link>
        </div>

        {/* Mini chart placeholder */}
        <div className="h-14 w-full rounded-lg bg-[var(--chart-blue-light)] opacity-60"></div>

        <div className="grid grid-cols-2 gap-3 text-center">
          <div>
            <div className="text-[26px] font-bold tabular-nums text-[var(--primary-blue)]" data-testid={`text-yes-probability-${market.id}`}>
              {formatProbability(yesPrice)}
            </div>
          </div>
          
          <div>
            <div className="text-[26px] font-bold tabular-nums text-[var(--red-tech)]" data-testid={`text-no-probability-${market.id}`}>
              {formatProbability(noPrice)}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-xs text-[var(--text-light)]">
          <div className="flex items-center gap-1" data-testid={`text-volume-${market.id}`}>
            <DollarSign className="h-3 w-3" />
            <span>{formatBRLCompact(volume)}</span>
          </div>
          <div className="flex items-center gap-1" data-testid={`text-participants-${market.id}`}>
            <Users className="h-3 w-3" />
            <span>{Math.floor(totalShares / 10)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button 
            variant="actionYes"
            size="sm"
            className="w-full font-semibold" 
            onClick={() => setLocation(`/market/${market.id}?action=buy&type=yes`)}
            data-testid={`button-buy-yes-${market.id}`}
          >
            <span className="flex items-center justify-center gap-1">
              <span>SIM</span>
              <span className="text-xs opacity-90" data-testid={`text-yes-odds-${market.id}`}>- {formatOdds(yesOdds)}</span>
            </span>
          </Button>
          <Button 
            variant="actionNo"
            size="sm"
            className="w-full font-semibold" 
            onClick={() => setLocation(`/market/${market.id}?action=buy&type=no`)}
            data-testid={`button-buy-no-${market.id}`}
          >
            <span className="flex items-center justify-center gap-1">
              <span>NÃO</span>
              <span className="text-xs opacity-90" data-testid={`text-no-odds-${market.id}`}>- {formatOdds(noOdds)}</span>
            </span>
          </Button>
        </div>
      </div>
    </Card>
  );
}
