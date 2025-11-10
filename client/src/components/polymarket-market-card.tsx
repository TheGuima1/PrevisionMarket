import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, DollarSign } from "lucide-react";
import { Link } from "wouter";
import { formatBRLCompact } from "@shared/utils/currency";

interface PolymarketOutcome {
  name: string;
  percent: number;
  raw: number;
}

interface PolymarketMarket {
  slug: string;
  title: string;
  outcomes: PolymarketOutcome[];
  volume?: string | null;
  endsAt?: string | null;
  lastUpdate?: string;
}

interface PolymarketMarketCardProps {
  market: PolymarketMarket;
}

export function PolymarketMarketCard({ market }: PolymarketMarketCardProps) {
  // Show top 2 outcomes
  const topOutcomes = market.outcomes.slice(0, 2);
  const volume = market.volume ? parseFloat(market.volume) : 0;

  return (
    <Link href={`/polymarket/${market.slug}`}>
      <Card 
        className="overflow-hidden hover-elevate transition-all duration-200 border-purple-500/30 cursor-pointer" 
        data-testid={`polymarket-card-${market.slug}`}
      >
        <div className="p-4 space-y-4">
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <Badge 
                variant="outline" 
                className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 bg-purple-500/10 text-purple-400 border-purple-500/30 border"
                data-testid={`badge-polymarket-${market.slug}`}
              >
                <TrendingUp className="h-3 w-3" />
                Polymarket
              </Badge>
              {/* Beta pill */}
              <Badge 
                variant="secondary" 
                className="text-xs"
              >
                Beta
              </Badge>
            </div>
            
            <h3 
              className="font-semibold text-base leading-tight hover:text-primary transition-colors line-clamp-2" 
              data-testid={`text-polymarket-title-${market.slug}`}
            >
              {market.title}
            </h3>
          </div>

          <div className="space-y-2">
            {topOutcomes.map((outcome, idx) => (
              <div 
                key={outcome.name}
                className="flex justify-between items-center text-sm"
                data-testid={`outcome-${idx}-${market.slug}`}
              >
                <span className="text-muted-foreground truncate pr-2">{outcome.name}</span>
                <span className="font-mono font-semibold text-primary shrink-0">
                  {outcome.percent.toFixed(1)}%
                </span>
              </div>
            ))}
          </div>

          {volume > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2 border-t border-border">
              <DollarSign className="h-3 w-3" />
              <span>Volume: {formatBRLCompact(volume)}</span>
            </div>
          )}

          <div className="text-xs text-purple-400/70 italic">
            Odds espelhadas da Polymarket com spread de 2%
          </div>
        </div>
      </Card>
    </Link>
  );
}
