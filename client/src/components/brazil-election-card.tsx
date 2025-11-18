import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { Vote } from "lucide-react";

interface BrazilElectionCardProps {
  markets: Market[];
}

const CANDIDATE_COLORS: Record<string, string> = {
  "Lula": "#FF6B2C",
  "Tarcísio de Freitas": "#4A90E2",
  "Fernando Haddad": "#F5A623",
  "Renan Santos": "#7ED321",
  "Ratinho Júnior": "#9013FE",
  "Jair Bolsonaro": "#50E3C2",
  "Michelle Bolsonaro": "#BD10E0",
  "Eduardo Bolsonaro": "#417505",
};

export function BrazilElectionCard({ markets }: BrazilElectionCardProps) {
  const [, setLocation] = useLocation();
  
  // Sort markets by probability (descending) and take TOP 2
  const topTwoCandidates = useMemo(() => {
    const sorted = [...markets].sort((a, b) => {
      const probA = parseFloat(a.yesReserve) / (parseFloat(a.yesReserve) + parseFloat(a.noReserve));
      const probB = parseFloat(b.yesReserve) / (parseFloat(b.yesReserve) + parseFloat(b.noReserve));
      return probB - probA;
    });
    return sorted.slice(0, 2);
  }, [markets]);

  return (
    <div 
      className="bg-card rounded-xl border border-border overflow-hidden hover-elevate"
      data-testid="card-brazil-election-2026"
    >
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Vote className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">Eleição Presidencial Brasil 2026</h2>
        </div>
        <a
          href="https://polymarket.com/event/brazil-presidential-election"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <span>Polymarket</span>
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      </div>

      {/* TOP 2 Candidates */}
      <div className="divide-y divide-border">
        {topTwoCandidates.map((market) => {
          const candidateName = market.title.split(' vencerá')[0];
          const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
          const volume = parseFloat(market.totalVolume || "0");
          
          // Use REAL Polymarket price change data
          const priceChange = market.oneDayPriceChange 
            ? parseFloat(market.oneDayPriceChange) 
            : 0;
          const priceChangeColor = priceChange >= 0 ? "text-green-500" : "text-red-500";
          const priceChangeSign = priceChange >= 0 ? "+" : "";
          
          const candidateSlug = candidateName.toLowerCase().replace(/\s+/g, '-');
          const color = CANDIDATE_COLORS[candidateName] || "#8B5CF6";
          
          return (
            <div 
              key={market.id} 
              className="p-4 hover-elevate active-elevate-2 transition-colors cursor-pointer"
              onClick={() => setLocation(`/market/${market.id}`)}
              data-testid={`row-candidate-${candidateSlug}`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Avatar + Name + Volume */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                    data-testid={`avatar-${candidateSlug}`}
                  >
                    {candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-semibold text-sm truncate"
                      data-testid={`name-${candidateSlug}`}
                    >
                      {candidateName}
                    </div>
                    <div 
                      className="text-muted-foreground text-xs"
                      data-testid={`volume-${candidateSlug}`}
                    >
                      {volume.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BRL3 Vol.
                    </div>
                  </div>
                </div>

                {/* Right: Percentage + Change */}
                <div className="flex flex-col items-end gap-1">
                  <span 
                    className="font-bold text-lg"
                    data-testid={`percentage-${candidateSlug}`}
                  >
                    {(prob * 100).toFixed(1)}%
                  </span>
                  {priceChange !== 0 && (
                    <span 
                      className={`text-xs font-medium ${priceChangeColor}`}
                      data-testid={`change-${candidateSlug}`}
                    >
                      {priceChangeSign}{(priceChange * 100).toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Show All Link */}
      <div className="p-3 border-t border-border text-center">
        <button
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          onClick={() => setLocation('/event/brazil-election-2026')}
          data-testid="button-view-all-candidates"
        >
          Ver todos os candidatos →
        </button>
      </div>
    </div>
  );
}
