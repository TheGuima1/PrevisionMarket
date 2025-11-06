import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Market } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TradePanelProps {
  market: Market;
  userBalance?: { brl: string; usdc: string };
}

export function TradePanel({ market, userBalance }: TradePanelProps) {
  const [orderType, setOrderType] = useState<"yes" | "no">("yes");
  const [shares, setShares] = useState("");
  const { toast } = useToast();

  const price = orderType === "yes" ? parseFloat(market.yesPrice) : parseFloat(market.noPrice);
  const totalCost = shares ? (parseFloat(shares) * price).toFixed(2) : "0.00";
  const potentialPayout = shares ? parseFloat(shares).toFixed(2) : "0.00";
  const potentialProfit = shares ? (parseFloat(shares) - parseFloat(totalCost)).toFixed(2) : "0.00";

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        marketId: market.id,
        type: orderType,
        shares: parseFloat(shares),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ordem executada!",
        description: `Você comprou ${shares} ações ${orderType === "yes" ? "SIM" : "NÃO"}`,
      });
      setShares("");
      queryClient.invalidateQueries({ queryKey: ["/api/markets", market.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao executar ordem",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBuy = () => {
    if (!shares || parseFloat(shares) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Digite uma quantidade válida de ações",
        variant: "destructive",
      });
      return;
    }
    buyMutation.mutate();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="font-accent text-xl font-semibold">Negociar</h3>
        <p className="text-sm text-muted-foreground">
          Escolha sua posição e quantidade
        </p>
      </div>

      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "yes" | "no")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="yes" 
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            data-testid="tab-buy-yes"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            SIM
          </TabsTrigger>
          <TabsTrigger 
            value="no"
            className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground"
            data-testid="tab-buy-no"
          >
            <TrendingDown className="h-4 w-4 mr-2" />
            NÃO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="yes" className="mt-6 space-y-6">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Preço atual (SIM)</span>
              <span className="text-2xl font-bold tabular-nums text-primary" data-testid="text-yes-price">
                {(price * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Decimal: {(1 / price).toFixed(2)}</span>
              <span>
                Americano: {price >= 0.5 
                  ? `-${Math.round((price / (1 - price)) * 100)}`
                  : `+${Math.round(((1 - price) / price) * 100)}`
                }
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares-yes">Quantidade de ações</Label>
            <Input
              id="shares-yes"
              type="number"
              placeholder="0.00"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="0"
              step="0.01"
              data-testid="input-shares-yes"
            />
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo total</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-yes">R$ {totalCost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ganho potencial</span>
              <span className="font-semibold tabular-nums text-primary" data-testid="text-potential-payout-yes">
                R$ {potentialPayout}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro potencial</span>
              <span className="font-semibold tabular-nums text-primary" data-testid="text-potential-profit-yes">
                R$ {potentialProfit}
              </span>
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={!shares || buyMutation.isPending}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            data-testid="button-buy-yes-execute"
          >
            {buyMutation.isPending ? "Executando..." : "Comprar SIM"}
          </Button>
        </TabsContent>

        <TabsContent value="no" className="mt-6 space-y-6">
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Preço atual (NÃO)</span>
              <span className="text-2xl font-bold tabular-nums text-destructive" data-testid="text-no-price">
                {(price * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Decimal: {(1 / price).toFixed(2)}</span>
              <span>
                Americano: {price >= 0.5 
                  ? `-${Math.round((price / (1 - price)) * 100)}`
                  : `+${Math.round(((1 - price) / price) * 100)}`
                }
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shares-no">Quantidade de ações</Label>
            <Input
              id="shares-no"
              type="number"
              placeholder="0.00"
              value={shares}
              onChange={(e) => setShares(e.target.value)}
              min="0"
              step="0.01"
              data-testid="input-shares-no"
            />
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Custo total</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-no">R$ {totalCost}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Ganho potencial</span>
              <span className="font-semibold tabular-nums text-destructive" data-testid="text-potential-payout-no">
                R$ {potentialPayout}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro potencial</span>
              <span className="font-semibold tabular-nums text-destructive" data-testid="text-potential-profit-no">
                R$ {potentialProfit}
              </span>
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={!shares || buyMutation.isPending}
            className="w-full"
            variant="destructive"
            size="lg"
            data-testid="button-buy-no-execute"
          >
            {buyMutation.isPending ? "Executando..." : "Comprar NÃO"}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Saldo BRL:</span>
          <span className="font-medium">R$ {parseFloat(userBalance?.brl || "0").toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
    </Card>
  );
}
