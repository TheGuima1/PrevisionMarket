import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { X, TrendingUp, TrendingDown } from "lucide-react";

interface Order {
  id: string;
  marketId: string;
  action: "buy" | "sell";
  type: "yes" | "no";
  shares: string;
  price: string;
  status: "open" | "filled" | "cancelled" | "partially_filled";
  filledShares: string;
  createdAt: string;
}

export function OpenOrders() {
  const { toast } = useToast();

  const { data: orders, isLoading } = useQuery<Order[]>({
    queryKey: ["/api/clob/my-orders"],
    refetchInterval: 5000,
  });

  const cancelMutation = useMutation({
    mutationFn: async (orderId: string) => {
      const res = await apiRequest("DELETE", `/api/clob/orders/${orderId}`, {});
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ordem cancelada",
        description: "Sua ordem foi cancelada com sucesso",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/clob/my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao cancelar ordem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <Card className="p-6 space-y-4">
        <h3 className="font-accent text-xl font-semibold">Ordens Abertas</h3>
        <Skeleton className="h-32" />
      </Card>
    );
  }

  const openOrders = orders?.filter(o => o.status === "open" || o.status === "partially_filled") || [];

  return (
    <Card className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-accent text-xl font-semibold">Ordens Abertas</h3>
        <Badge variant="outline">{openOrders.length} ordens</Badge>
      </div>

      {openOrders.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Você não tem ordens abertas no momento
        </div>
      ) : (
        <div className="space-y-3">
          {openOrders.map((order) => {
            const pricePercent = (parseFloat(order.price) * 100).toFixed(1);
            const filled = parseFloat(order.filledShares);
            const total = parseFloat(order.shares);
            const fillPercent = total > 0 ? ((filled / total) * 100).toFixed(0) : "0";

            return (
              <div
                key={order.id}
                className="border rounded-lg p-4 space-y-3 hover-elevate"
                data-testid={`open-order-${order.id}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge 
                        variant={order.action === "buy" ? "default" : "outline"}
                        className="uppercase"
                      >
                        {order.action === "buy" ? "Comprar" : "Vender"}
                      </Badge>
                      <div className="flex items-center gap-1">
                        {order.type === "yes" ? (
                          <TrendingUp className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <TrendingDown className="h-3.5 w-3.5 text-destructive" />
                        )}
                        <span className="text-sm font-medium">
                          {order.type === "yes" ? "SIM" : "NÃO"}
                        </span>
                      </div>
                      {order.status === "partially_filled" && (
                        <Badge variant="outline" className="bg-accent/10">
                          Parcialmente preenchida ({fillPercent}%)
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div>
                        <span className="text-muted-foreground">Preço:</span>{" "}
                        <span className="font-medium tabular-nums">{pricePercent}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Quantidade:</span>{" "}
                        <span className="font-medium tabular-nums">
                          {filled > 0 ? `${filled.toFixed(2)} / ` : ""}{total.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-muted-foreground">Criada:</span>{" "}
                        <span className="text-xs">
                          {new Date(order.createdAt).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => cancelMutation.mutate(order.id)}
                    disabled={cancelMutation.isPending}
                    data-testid={`button-cancel-order-${order.id}`}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
