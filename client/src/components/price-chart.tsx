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
      queryKey: [`/api/polymarket/history/${slug}?range=${timeRange}`, timeRange],
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

  // Get unique outcome names for legend
  const outcomeNames = historyData?.[0]?.outcomes.map(o => o.name) || [];

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
      <div className="w-full h-96 bg-card rounded-lg border border-border p-4">
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
              domain={[0, 100]}
              tickFormatter={(value) => `${value}%`}
              axisLine={{ stroke: 'hsl(var(--border))' }}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                padding: '8px 12px',
              }}
              labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600, marginBottom: '4px' }}
              formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '16px' }}
              iconType="line"
            />
            {outcomeNames.map((name, index) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={false}
                name={name}
                activeDot={{ r: 6, strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
