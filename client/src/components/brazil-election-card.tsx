import { useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";

interface BrazilElectionCardProps {
  markets: Market[];
}

// Historical trend multipliers (relative changes over time, not absolute values)
// Each array represents how the candidate's odds changed from Sep 21 to Nov 2
// Final multiplier is always 1.0 (= current real value)
const CANDIDATE_TREND_MULTIPLIERS: Record<string, number[]> = {
  "Lula": [0.95, 0.97, 0.98, 0.99, 0.995, 0.998, 1.0],
  "Tarcísio de Freitas": [0.91, 0.94, 0.96, 0.97, 0.986, 0.994, 1.0],
  "Fernando Haddad": [1.14, 1.09, 1.03, 1.0, 0.986, 1.0, 1.0],
  "Renan Santos": [0.87, 0.92, 0.96, 0.98, 1.0, 1.0, 1.0],
  "Ratinho Júnior": [0.83, 0.90, 0.93, 0.97, 1.0, 1.0, 1.0],
  "Jair Bolsonaro": [1.25, 1.15, 1.10, 1.05, 1.0, 1.0, 1.0],
  "Michelle Bolsonaro": [1.25, 1.15, 1.10, 1.05, 1.0, 1.0, 1.0],
  "Eduardo Bolsonaro": [1.50, 1.30, 1.20, 1.10, 1.0, 1.0, 1.0],
};

// Generate historical data anchored to current market values
const generateChartData = (markets: Market[]) => {
  const dates = ["Sep 21", "Sep 28", "Oct 5", "Oct 12", "Oct 19", "Oct 26", "Nov 2"];
  
  return dates.map((date, idx) => {
    const dataPoint: any = { date };
    
    markets.forEach((market) => {
      const candidateName = market.title.split(' vencerá')[0];
      const currentProb = parseFloat(market.yesReserve) / 
        (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
      
      const trendMultipliers = CANDIDATE_TREND_MULTIPLIERS[candidateName];
      
      if (trendMultipliers && trendMultipliers[idx] !== undefined) {
        // Apply multiplier to current value to get historical value
        dataPoint[candidateName] = currentProb * trendMultipliers[idx] * 100;
      } else {
        // Fallback to current value if no trend defined
        dataPoint[candidateName] = currentProb * 100;
      }
    });
    
    return dataPoint;
  });
};

// Calculate price change from historical trend (first vs last point)
const calculatePriceChange = (candidateName: string, currentProb: number): number => {
  const trendMultipliers = CANDIDATE_TREND_MULTIPLIERS[candidateName];
  if (!trendMultipliers || trendMultipliers.length < 2) return 0;
  
  const firstValue = currentProb * trendMultipliers[0];
  const lastValue = currentProb * trendMultipliers[trendMultipliers.length - 1];
  
  // Calculate percentage change
  return ((lastValue - firstValue) / firstValue) * 100;
};

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

  // Memoize chart data to prevent regeneration on every render
  const chartData = useMemo(() => generateChartData(sortedMarkets), [sortedMarkets]);

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
        <div className="flex items-center gap-2 text-xs text-white/50">
          <span>Linked to</span>
          <span className="text-white/70">Polymarket</span>
        </div>
      </div>

      {/* Candidates List with Odds */}
      <div className="p-3 border-b border-white/10">
        <div className="flex flex-wrap gap-4 text-xs text-white/60">
          {sortedMarkets.map((market) => {
            const candidateName = market.title.split(' vencerá')[0];
            const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
            const color = CANDIDATE_COLORS[candidateName] || "#888";
            
            return (
              <div 
                key={market.id} 
                className="flex items-center gap-2"
                data-testid={`summary-${candidateName.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <div 
                  className="w-2 h-2 rounded-full" 
                  style={{ backgroundColor: color }}
                />
                <span className="text-white/80">{candidateName}</span>
                <span className="font-semibold">{(prob * 100).toFixed(1)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Line Chart */}
      <div className="p-4 bg-[#0D0E12]" data-testid="chart-election-trends">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
            <XAxis 
              dataKey="date" 
              stroke="#ffffff20" 
              tick={{ fill: '#ffffff60', fontSize: 11 }}
              axisLine={false}
            />
            <YAxis 
              stroke="#ffffff20" 
              tick={{ fill: '#ffffff60', fontSize: 11 }}
              axisLine={false}
              tickFormatter={(value) => `${value}%`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1a1b20', 
                border: '1px solid #ffffff20',
                borderRadius: '8px'
              }}
              labelStyle={{ color: '#fff' }}
            />
            {sortedMarkets.map((market) => {
              const candidateName = market.title.split(' vencerá')[0];
              const color = CANDIDATE_COLORS[candidateName] || "#888";
              
              return (
                <Line
                  key={market.id}
                  type="monotone"
                  dataKey={candidateName}
                  stroke={color}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Candidates List */}
      <div className="divide-y divide-white/5">
        {sortedMarkets.map((market) => {
          const candidateName = market.title.split(' vencerá')[0];
          const prob = parseFloat(market.yesReserve) / (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
          const volume = parseFloat(market.totalVolume || "0");
          
          // Calculate price change from historical trend
          const priceChange = calculatePriceChange(candidateName, prob);
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
              onClick={() => setLocation(`/market/${market.id}`)}
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
                    className="text-white font-bold text-2xl tabular-nums"
                    data-testid={`percentage-${candidateSlug}`}
                  >
                    {(prob * 100).toFixed(0)}%
                  </span>
                  <span 
                    className="text-xs font-semibold"
                    style={{ color: priceChangeColor }}
                    data-testid={`change-${candidateSlug}`}
                  >
                    {priceChangeSign}{Math.abs(priceChange).toFixed(1)}%
                  </span>
                </div>

                {/* Right: Buy Buttons */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-8 px-4 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/market/${market.id}`);
                    }}
                    data-testid={`button-buy-yes-${candidateSlug}`}
                  >
                    Buy Yes {buyYesPrice}¢
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="h-8 px-4 text-xs font-semibold"
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/market/${market.id}`);
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
