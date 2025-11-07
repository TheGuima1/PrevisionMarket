import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/queryClient";
import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { formatBRL } from "@shared/utils/currency";

interface RecentTrade {
  id: string;
  marketTitle: string;
  username: string;
  type: "yes" | "no";
  filledShares: string;
  price: string;
  executedAt: string;
}

export function RecentActivityFeed() {
  const { data: recentTrades, isLoading } = useQuery<RecentTrade[]>({
    queryKey: ["/api/recent-trades"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    refetchInterval: 5000, // Atualiza a cada 5 segundos
  });

  if (isLoading) {
    return (
      <Card className="p-4" data-testid="recent-activity-loading">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </Card>
    );
  }

  if (!recentTrades || recentTrades.length === 0) {
    return (
      <Card className="p-6 text-center text-muted-foreground" data-testid="recent-activity-empty">
        <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>Nenhuma atividade recente</p>
      </Card>
    );
  }

  return (
    <div className="space-y-2" data-testid="recent-activity-feed">
      <h3 className="text-lg font-semibold mb-4">Atividade Recente</h3>
      <div className="space-y-2">
        {recentTrades.slice(0, 10).map((trade) => {
          // Calculate accurate total value using filledShares
          const filledShares = parseFloat(trade.filledShares);
          const price = parseFloat(trade.price);
          const totalValue = parseFloat((filledShares * price).toFixed(2));
          
          return (
            <Card 
              key={trade.id} 
              className="p-3 hover-elevate transition-colors"
              data-testid={`trade-${trade.id}`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {trade.type === "yes" ? (
                      <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    <span className="font-medium text-sm truncate" data-testid={`trade-username-${trade.id}`}>
                      @{trade.username}
                    </span>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        trade.type === "yes"
                          ? "bg-primary/10 text-primary"
                          : "bg-destructive/10 text-destructive"
                      }`}
                      data-testid={`trade-type-${trade.id}`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate" data-testid={`trade-market-${trade.id}`}>
                    {trade.marketTitle}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                    <span data-testid={`trade-shares-${trade.id}`}>
                      {filledShares.toFixed(0)} shares
                    </span>
                    <span>•</span>
                    <span data-testid={`trade-value-${trade.id}`}>
                      {formatBRL(totalValue)}
                    </span>
                    <span>•</span>
                    <span data-testid={`trade-time-${trade.id}`}>
                      {trade.executedAt ? formatDistanceToNow(new Date(trade.executedAt), {
                        addSuffix: true,
                        locale: ptBR,
                      }) : 'Recente'}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
