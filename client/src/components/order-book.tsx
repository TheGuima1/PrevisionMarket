import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TrendingUp, TrendingDown, BarChart3 } from "lucide-react";

interface OrderBookProps {
  marketId: string;
}

interface OrderBookEntry {
  price: string;
  totalShares: number;
  numOrders: number;
}

interface OrderBookData {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
}

export function OrderBook({ marketId }: OrderBookProps) {
  const { data: orderbook, isLoading } = useQuery<OrderBookData>({
    queryKey: ["/api/clob/orderbook", marketId],
    refetchInterval: 5000,
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <div className="flex items-center gap-2 justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h3 className="font-accent text-xl font-semibold">Order Book</h3>
          </div>
        </div>
        <Skeleton className="h-64" />
      </Card>
    );
  }

  const maxBidDepth = orderbook?.bids.reduce((max, b) => Math.max(max, b.totalShares), 0) || 1;
  const maxAskDepth = orderbook?.asks.reduce((max, a) => Math.max(max, a.totalShares), 0) || 1;

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center gap-2 justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          <h3 className="font-accent text-xl font-semibold">Order Book</h3>
        </div>
        <Badge variant="outline" className="text-xs">
          Atualiza a cada 5s
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
        <div>Preço</div>
        <div className="text-right">Quantidade</div>
        <div className="text-right">Ordens</div>
      </div>

      <ScrollArea className="h-[300px]">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">BIDS (SIM)</span>
            </div>
            {!orderbook?.bids || orderbook.bids.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhuma ordem de compra
              </div>
            ) : (
              orderbook.bids.map((bid, idx) => {
                const depthPercent = (bid.totalShares / maxBidDepth) * 100;
                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-3 gap-2 text-xs py-1.5 px-2 rounded hover-elevate"
                    data-testid={`orderbook-bid-${idx}`}
                  >
                    <div
                      className="absolute inset-0 bg-primary/10 rounded"
                      style={{ width: `${depthPercent}%` }}
                    />
                    <div className="relative font-medium text-primary">
                      {(parseFloat(bid.price) * 100).toFixed(1)}%
                    </div>
                    <div className="relative text-right tabular-nums">
                      {bid.totalShares.toFixed(2)}
                    </div>
                    <div className="relative text-right text-muted-foreground">
                      {bid.numOrders}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="border-t pt-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-3.5 w-3.5 text-destructive" />
              <span className="text-xs font-semibold text-destructive">ASKS (NÃO)</span>
            </div>
            {!orderbook?.asks || orderbook.asks.length === 0 ? (
              <div className="text-xs text-muted-foreground text-center py-4">
                Nenhuma ordem de venda
              </div>
            ) : (
              orderbook.asks.map((ask, idx) => {
                const depthPercent = (ask.totalShares / maxAskDepth) * 100;
                return (
                  <div
                    key={idx}
                    className="relative grid grid-cols-3 gap-2 text-xs py-1.5 px-2 rounded hover-elevate"
                    data-testid={`orderbook-ask-${idx}`}
                  >
                    <div
                      className="absolute inset-0 bg-destructive/10 rounded"
                      style={{ width: `${depthPercent}%` }}
                    />
                    <div className="relative font-medium text-destructive">
                      {(parseFloat(ask.price) * 100).toFixed(1)}%
                    </div>
                    <div className="relative text-right tabular-nums">
                      {ask.totalShares.toFixed(2)}
                    </div>
                    <div className="relative text-right text-muted-foreground">
                      {ask.numOrders}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </ScrollArea>

      <div className="pt-4 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total Bids:</span>
          <span className="font-medium">{orderbook?.bids.length || 0} níveis</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Total Asks:</span>
          <span className="font-medium">{orderbook?.asks.length || 0} níveis</span>
        </div>
      </div>
    </Card>
  );
}
