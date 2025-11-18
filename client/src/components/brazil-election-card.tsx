import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";

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
  
  // Sort markets by probability (descending) - memoized for stability
  const sortedMarkets = useMemo(() => {
    return [...markets].sort((a, b) => {
      const probA = parseFloat(a.yesReserve) / (parseFloat(a.yesReserve) + parseFloat(a.noReserve));
      const probB = parseFloat(b.yesReserve) / (parseFloat(b.yesReserve) + parseFloat(b.noReserve));
      return probB - probA;
    });
  }, [markets]);

  return (
    <div 
      className="bg-[#17181D] rounded-xl border border-white/10 overflow-hidden"
      data-testid="card-brazil-election-2026"
    >
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🇧🇷</span>
          <h2 className="text-white font-semibold text-lg">Brazil Presidential Election</h2>
        </div>
        <a
          href="https://polymarket.com/event/brazil-presidential-election"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
        >
          <span>View on Polymarket</span>
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

      {/* Candidates Summary with Dots */}
      <div className="p-3 border-b border-white/10">
        <div className="flex flex-wrap gap-4 text-xs text-white/60">
          {sortedMarkets.map((market) => {
            const candidateName = market.title.split(' vencerá')[0];
            const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
            const color = CANDIDATE_COLORS[candidateName] || "#888";
            const candidateSlug = candidateName.toLowerCase().replace(/\s+/g, '-');
            
            return (
              <div 
                key={market.id} 
                className="flex items-center gap-2"
                data-testid={`summary-${candidateSlug}`}
              >
                <div 
                  className="w-2 h-2 rounded-full flex-shrink-0" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-white/80">{candidateName}</span>
                <span className="text-white/40">{(prob * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Candidates List */}
      <div className="divide-y divide-white/5">
        {sortedMarkets.map((market) => {
          const candidateName = market.title.split(' vencerá')[0];
          const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
          const volume = parseFloat(market.totalVolume || "0");
          
          // Use REAL Polymarket price change data
          const priceChange = market.oneDayPriceChange 
            ? parseFloat(market.oneDayPriceChange) 
            : 0;
          const priceChangeColor = priceChange >= 0 ? "#10B981" : "#EF4444";
          const priceChangeSign = priceChange >= 0 ? "+" : "";
          
          // Calculate buy prices (in cents)
          const buyYesPrice = Math.round(prob * 100);
          const buyNoPrice = Math.round((1 - prob) * 100);
          
          const candidateSlug = candidateName.toLowerCase().replace(/\s+/g, '-');
          
          return (
            <div 
              key={market.id} 
              className="p-4 hover:bg-white/5 transition-colors cursor-pointer"
              onClick={() => setLocation('/brazil-election-2026')}
              data-testid={`row-candidate-${candidateSlug}`}
            >
              <div className="flex items-center justify-between gap-4">
                {/* Left: Avatar + Name + Volume */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    data-testid={`avatar-${candidateSlug}`}
                  >
                    {candidateName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="text-white font-semibold text-sm truncate"
                      data-testid={`name-${candidateSlug}`}
                    >
                      {candidateName}
                    </div>
                    <div 
                      className="text-white/40 text-xs"
                      data-testid={`volume-${candidateSlug}`}
                    >
                      ${volume.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} Vol.
                    </div>
                  </div>
                </div>

                {/* Middle: Percentage */}
                <div className="flex items-center gap-2">
                  <span 
                    className="text-white font-bold text-lg"
                    data-testid={`percentage-${candidateSlug}`}
                  >
                    {(prob * 100).toFixed(1)}%
                  </span>
                  {priceChange !== 0 && (
                    <span 
                      className="text-xs font-medium px-1.5 py-0.5 rounded"
                      style={{ 
                        backgroundColor: `${priceChangeColor}20`,
                        color: priceChangeColor 
                      }}
                      data-testid={`change-${candidateSlug}`}
                    >
                      {priceChangeSign}{(priceChange * 100).toFixed(1)}%
                    </span>
                  )}
                </div>

                {/* Right: Buy Buttons */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 h-8 px-3 text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/brazil-election-2026');
                    }}
                    data-testid={`button-buy-yes-${candidateSlug}`}
                  >
                    Buy Yes {buyYesPrice}¢
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 h-8 px-3 text-xs font-medium"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation('/brazil-election-2026');
                    }}
                    data-testid={`button-buy-no-${candidateSlug}`}
                  >
                    Buy No {buyNoPrice}¢
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
