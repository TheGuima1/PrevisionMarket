import { useState } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Button } from "@/components/ui/button";
import type { Market } from "@shared/schema";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PriceChartProps {
  polymarketSlug?: string;
  market?: Market;
  alternatives?: Market[];
}

type TimeRange = '1W' | '1M' | 'ALL';

interface HistoricalDataPoint {
  timestamp: Date;
  outcomes: Array<{
    name: string;
    percent: number;
    raw: number;
  }>;
}

const COLORS = [
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#f59e0b',
  '#ef4444',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
];

export function PriceChart({ polymarketSlug, market, alternatives }: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('1W');
  
  // For events with alternatives, fetch snapshots for each alternative market
  const shouldFetchAlternatives = !!(alternatives && alternatives.length > 0);
  const slugsToFetch = shouldFetchAlternatives 
    ? alternatives!.filter(alt => alt.polymarketSlug).map(alt => ({
        slug: alt.polymarketSlug!,
        title: alt.title
      }))
    : polymarketSlug ? [{ slug: polymarketSlug, title: 'Market' }] : [];
  
  // Fetch historical data from Polymarket snapshots for each slug
  const queries = useQueries({
    queries: slugsToFetch.map(({ slug }) => ({
      queryKey: ['/api/polymarket/history', slug, timeRange],
      queryFn: async () => {
        const res = await fetch(`/api/polymarket/history/${slug}?range=${timeRange}`);
        if (!res.ok) throw new Error('Erro ao carregar histórico');
        return res.json();
      },
      enabled: !!slug,
    })),
  });
  
  const isLoading = queries.some(q => q.isLoading);
  
  // Combine data from all queries - align by timestamp
  const timestampMap = new Map<string, { timestamp: Date; outcomes: Map<string, { percent: number; raw: number }> }>();
  
  queries.forEach((query, index) => {
    const data = query.data as HistoricalDataPoint[] | undefined;
    if (!data || data.length === 0) return;
    
    const { title: marketTitle } = slugsToFetch[index];
    
    // Add this market's data to timestamp map
    data.forEach((point) => {
      const timestampKey = new Date(point.timestamp).toISOString();
      
      if (!timestampMap.has(timestampKey)) {
        timestampMap.set(timestampKey, {
          timestamp: point.timestamp,
          outcomes: new Map(),
        });
      }
      
      const yesOutcome = point.outcomes.find(o => o.name === 'Yes');
      if (yesOutcome) {
        timestampMap.get(timestampKey)!.outcomes.set(marketTitle, {
          percent: yesOutcome.percent,
          raw: yesOutcome.raw,
        });
      }
    });
  });
  
  // Convert map to array and sort by timestamp
  const combinedHistoryData = Array.from(timestampMap.values())
    .map(entry => ({
      timestamp: entry.timestamp,
      outcomes: Array.from(entry.outcomes.entries()).map(([name, data]) => ({
        name,
        percent: data.percent,
        raw: data.raw,
      })),
    }))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  
  const historyData = combinedHistoryData.length > 0 ? combinedHistoryData : null;

  // Transform data for multi-line chart (for events with alternatives)
  const chartData = historyData?.map(point => {
    const dataPoint: any = {
      timestamp: new Date(point.timestamp).getTime(),
      time: format(new Date(point.timestamp), 'dd/MM HH:mm', { locale: ptBR }),
    };
    
    // Add each outcome as a separate line
    point.outcomes.forEach(outcome => {
      dataPoint[outcome.name] = outcome.percent;
    });
    
    return dataPoint;
  }) || [];

  // Get unique outcome names for legend and extract candidate names
  const allOutcomeNames = historyData?.[0]?.outcomes.map(o => {
    const fullName = o.name;
    // Extract candidate name from titles like "Lula vencerá as eleições presidenciais brasileiras de 2026?"
    // or "Tarcísio de Freitas vencerá as eleições presidenciais brasileiras de 2026?"
    const match = fullName.match(/^(.+?)\s+vencerá/);
    return {
      full: fullName,
      short: match ? match[1] : fullName, // e.g., "Lula" or "Tarcísio de Freitas"
    };
  }) || [];
  
  // Get latest probabilities to find top 4
  const latestDataPoint = chartData[chartData.length - 1] || {};
  const outcomesByProbability = allOutcomeNames
    .map(outcome => ({
      ...outcome,
      probability: latestDataPoint[outcome.full] || 0,
    }))
    .sort((a, b) => b.probability - a.probability);
  
  // Show only top 4 in chart
  const outcomeNames = outcomesByProbability.slice(0, 4);
  
  // Calculate dynamic Y-axis max based on highest probability
  const maxProbability = Math.max(...outcomeNames.map(o => o.probability), 0);
  const yAxisMax = Math.ceil(maxProbability / 10) * 10; // Round up to nearest 10
  const yAxisTicks = Array.from({ length: (yAxisMax / 10) + 1 }, (_, i) => i * 10);

  const timeRanges: TimeRange[] = ['1W', '1M', 'ALL'];

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-card rounded-lg border border-border">
        <p className="text-muted-foreground">Carregando gráfico...</p>
      </div>
    );
  }

  if (!historyData || historyData.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="flex gap-2">
          {timeRanges.map(range => (
            <Button
              key={range}
              variant={timeRange === range ? "default" : "outline"}
              size="sm"
              onClick={() => setTimeRange(range)}
              data-testid={`button-time-range-${range}`}
            >
              {range}
            </Button>
          ))}
        </div>
        <div className="w-full h-96 flex flex-col items-center justify-center bg-card rounded-lg border border-border">
          <p className="text-muted-foreground text-center">
            Nenhum dado histórico disponível ainda
          </p>
          <p className="text-sm text-muted-foreground/70 mt-2">
            O gráfico será preenchido conforme dados forem coletados
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Time range selector */}
      <div className="flex gap-2">
        {timeRanges.map(range => (
          <Button
            key={range}
            variant={timeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setTimeRange(range)}
            data-testid={`button-time-range-${range}`}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Chart */}
      <div className="w-full h-[550px] bg-card rounded-lg border border-border p-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="hsl(var(--border))" 
              opacity={0.2}
              vertical={false}
            />
            <XAxis 
              dataKey="time" 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
              domain={[0, yAxisMax]}
              ticks={yAxisTicks}
              tickFormatter={(value) => `${value}%`}
              axisLine={{ stroke: 'hsl(var(--border))' }}
              width={50}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: number, name: string) => {
                // Find the short name for tooltip
                const outcome = outcomeNames.find(o => o.full === name);
                return [`${value.toFixed(1)}%`, outcome?.short || name];
              }}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="line"
              formatter={(value: string) => {
                // Show short name in legend
                const outcome = outcomeNames.find(o => o.full === value);
                const displayName = outcome?.short;
                // Ensure we always return a string
                return displayName && typeof displayName === 'string' ? displayName : value;
              }}
            />
            {outcomeNames.map((outcome, index) => (
              <Line
                key={outcome.full}
                type="natural"
                dataKey={outcome.full}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={false}
                activeDot={false}
                name={outcome.full}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
