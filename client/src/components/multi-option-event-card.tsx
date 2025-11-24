import { useMemo } from "react";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { Trophy, Globe, Vote } from "lucide-react";

interface MultiOptionEventCardProps {
  markets: Market[];
  eventTitle: string;
  eventSlug: string;
  polymarketUrl?: string;
  icon?: "trophy" | "globe" | "vote";
}

const iconMap = {
  trophy: Trophy,
  globe: Globe,
  vote: Vote,
};

const AVATAR_COLORS = [
  "#FF6B2C", "#4A90E2", "#F5A623", "#7ED321", 
  "#9013FE", "#50E3C2", "#BD10E0", "#417505",
  "#FF5733", "#C70039", "#900C3F", "#581845",
  "#FFC300", "#DAF7A6", "#33FFBD", "#3380FF",
];

function getAvatarColor(index: number): string {
  return AVATAR_COLORS[index % AVATAR_COLORS.length];
}

export function MultiOptionEventCard({ 
  markets, 
  eventTitle, 
  eventSlug,
  polymarketUrl,
  icon = "globe"
}: MultiOptionEventCardProps) {
  const [, setLocation] = useLocation();
  const IconComponent = iconMap[icon];
  
  const topTwoOptions = useMemo(() => {
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
      data-testid={`card-event-${eventSlug}`}
    >
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <IconComponent className="w-5 h-5 text-primary" />
          </div>
          <h2 className="font-semibold text-lg">{eventTitle}</h2>
        </div>
        {polymarketUrl && (
          <a
            href={polymarketUrl}
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
        )}
      </div>

      <div className="divide-y divide-border">
        {topTwoOptions.map((market, index) => {
          // Extract option name by removing common suffixes
          const extractOptionName = (title: string): string => {
            const patterns = [
              / vencerá.*/i,
              / ganhará.*/i,
              / win.*/i,
              / winner.*/i,
              / to win.*/i,
            ];
            
            for (const pattern of patterns) {
              const match = title.replace(pattern, '').trim();
              if (match && match !== title) {
                return match;
              }
            }
            
            return title;
          };
          
          const optionName = extractOptionName(market.title);
          const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
          const volume = parseFloat(market.totalVolume || "0");
          
          const priceChange = market.oneDayPriceChange 
            ? parseFloat(market.oneDayPriceChange) 
            : 0;
          const priceChangeColor = priceChange >= 0 ? "text-green-500" : "text-red-500";
          const priceChangeSign = priceChange >= 0 ? "+" : "";
          
          const optionSlug = optionName.toLowerCase().replace(/\s+/g, '-');
          const color = getAvatarColor(index);
          
          return (
            <div 
              key={market.id} 
              className="p-4 hover-elevate active-elevate-2 transition-colors cursor-pointer"
              onClick={() => setLocation(`/event/${eventSlug}`)}
              data-testid={`row-option-${optionSlug}`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: color }}
                    data-testid={`avatar-${optionSlug}`}
                  >
                    {optionName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div 
                      className="font-semibold text-sm truncate"
                      data-testid={`name-${optionSlug}`}
                    >
                      {optionName}
                    </div>
                    <div 
                      className="text-muted-foreground text-xs"
                      data-testid={`volume-${optionSlug}`}
                    >
                      {volume.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} BRL3 Vol.
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <span 
                    className="font-bold text-lg"
                    data-testid={`percentage-${optionSlug}`}
                  >
                    {(prob * 100).toFixed(1)}%
                  </span>
                  {priceChange !== 0 && (
                    <span 
                      className={`text-xs font-medium ${priceChangeColor}`}
                      data-testid={`change-${optionSlug}`}
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

      <div className="p-3 border-t border-border text-center">
        <button
          className="text-sm text-primary hover:text-primary/80 transition-colors font-medium"
          onClick={() => setLocation(`/event/${eventSlug}`)}
          data-testid={`button-view-all-${eventSlug}`}
        >
          Ver todos →
        </button>
      </div>
    </div>
  );
}
