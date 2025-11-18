import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { AIAssistant } from "@/components/ai-assistant";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Market } from "@shared/schema";
import { ExternalLink } from "lucide-react";

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

export default function BrazilElectionPage() {
  const { data: allMarkets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
  });

  // Filter Brazil election markets
  const electionMarkets = allMarkets?.filter(m => 
    m.tags?.includes("Eleição Brasil 2026")
  ) || [];

  // Sort by probability (descending)
  const sortedMarkets = [...electionMarkets].sort((a, b) => {
    const probA = parseFloat(a.yesReserve) / (parseFloat(a.yesReserve) + parseFloat(a.noReserve));
    const probB = parseFloat(b.yesReserve) / (parseFloat(b.yesReserve) + parseFloat(b.noReserve));
    return probB - probA;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-6 max-w-5xl">
        <Card className="bg-[#17181D] border-white/10 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🇧🇷</span>
              <h1 className="text-white font-semibold text-xl" data-testid="text-event-title">
                Brazil Presidential Election
              </h1>
            </div>
            <a
              href="https://polymarket.com/event/brazil-presidential-election"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
              data-testid="link-view-polymarket"
            >
              <span>View on Polymarket</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Summary Bar with all candidates */}
          <div className="p-3 border-b border-white/10 bg-[#1A1B21]">
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

          {/* Polymarket Graph Embed */}
          <div className="w-full bg-[#1A1B21] border-b border-white/10" data-testid="container-polymarket-graph">
            <iframe
              src="https://polymarket.com/event/brazil-presidential-election?embed=true"
              className="w-full h-[400px] border-0"
              title="Polymarket Brazil Election Chart"
              loading="lazy"
            />
          </div>

          {/* Candidate List */}
          <div className="divide-y divide-white/5">
            {sortedMarkets.map((market) => {
              const candidateName = market.title.split(' vencerá')[0];
              const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
              const volume = parseFloat(market.totalVolume || "0");
              
              // Real Polymarket price change
              const priceChange = market.oneDayPriceChange 
                ? parseFloat(market.oneDayPriceChange) 
                : 0;
              const priceChangeColor = priceChange >= 0 ? "#10B981" : "#EF4444";
              const priceChangeSign = priceChange >= 0 ? "+" : "";
              
              // Calculate buy prices (in cents)
              const buyYesPrice = Math.round(prob * 100);
              const buyNoPrice = Math.round((1 - prob) * 100);
              
              const candidateSlug = candidateName.toLowerCase().replace(/\s+/g, '-');
              const color = CANDIDATE_COLORS[candidateName] || "#888";
              
              return (
                <div 
                  key={market.id} 
                  className="p-4 bg-[#17181D] hover:bg-[#1A1B21] transition-colors"
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
                          className="text-white font-semibold text-sm"
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

                    {/* Middle: Percentage + Change */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span 
                        className="text-white font-bold text-xl"
                        data-testid={`percentage-${candidateSlug}`}
                      >
                        {(prob * 100).toFixed(1)}%
                      </span>
                      {priceChange !== 0 && (
                        <span 
                          className="text-xs font-medium px-2 py-1 rounded"
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
                        className="bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981] hover:bg-[#10B981]/20 h-9 px-4 text-xs font-medium"
                        onClick={() => window.location.href = `/market/${market.id}`}
                        data-testid={`button-buy-yes-${candidateSlug}`}
                      >
                        Buy Yes {buyYesPrice}¢
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-[#EF4444]/10 border-[#EF4444]/30 text-[#EF4444] hover:bg-[#EF4444]/20 h-9 px-4 text-xs font-medium"
                        onClick={() => window.location.href = `/market/${market.id}`}
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
        </Card>
      </main>

      <AIAssistant />
    </div>
  );
}
