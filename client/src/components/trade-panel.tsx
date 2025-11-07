import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Market } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, HelpCircle } from "lucide-react";
import { probToOdds, formatOdds, formatProbability, calculatePayout, calculateProfit } from "@shared/utils/odds";
import { formatBRL } from "@shared/utils/currency";

interface TradePanelProps {
  market: Market;
  userBalance?: { brl: string; usdc: string };
}

export function TradePanel({ market, userBalance }: TradePanelProps) {
  const [orderMode, setOrderMode] = useState<"market" | "limit">("market");
  const [orderType, setOrderType] = useState<"yes" | "no">("yes");
  const [shares, setShares] = useState("");
  const [limitPrice, setLimitPrice] = useState("");
  const [limitAction, setLimitAction] = useState<"buy" | "sell">("buy");
  const { toast } = useToast();

  const probability = orderType === "yes" ? parseFloat(market.yesPrice) : parseFloat(market.noPrice);
  const odds = probToOdds(probability);
  
  const sharesNum = shares ? parseFloat(shares) : 0;
  const stakeBRL = sharesNum * probability;
  const totalPayout = sharesNum > 0 ? calculatePayout(stakeBRL, odds) : 0;
  const netProfit = sharesNum > 0 ? calculateProfit(stakeBRL, odds) : 0;

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

  const limitOrderMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/clob/orders", {
        marketId: market.id,
        action: limitAction,
        type: orderType,
        shares: parseFloat(shares),
        price: parseFloat(limitPrice),
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Ordem limitada criada!",
        description: `${limitAction === "buy" ? "Compra" : "Venda"} de ${shares} ações ${orderType === "yes" ? "SIM" : "NÃO"} a ${(parseFloat(limitPrice) * 100).toFixed(1)}%`,
      });
      setShares("");
      setLimitPrice("");
      queryClient.invalidateQueries({ queryKey: ["/api/clob/orderbook", market.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/clob/my-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets", market.id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar limit order",
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

  const handleLimitOrder = () => {
    if (!shares || parseFloat(shares) <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "Digite uma quantidade válida de ações",
        variant: "destructive",
      });
      return;
    }
    if (!limitPrice || parseFloat(limitPrice) <= 0 || parseFloat(limitPrice) >= 1) {
      toast({
        title: "Preço inválido",
        description: "Digite um preço entre 0.01 e 0.99",
        variant: "destructive",
      });
      return;
    }
    limitOrderMutation.mutate();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="font-accent text-xl font-semibold">Negociar</h3>
        <p className="text-sm text-muted-foreground">
          Escolha entre ordem a mercado ou limitada
        </p>
      </div>

      <Tabs value={orderMode} onValueChange={(v) => setOrderMode(v as "market" | "limit")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="market" data-testid="tab-order-market">
            Ordem a Mercado
          </TabsTrigger>
          <TabsTrigger value="limit" data-testid="tab-order-limit">
            Ordem Limitada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="market" className="mt-6">
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
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                Odds SIM
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Retorno por R$ 1 apostado (incluindo stake)</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-3xl font-bold tabular-nums text-primary" data-testid="text-yes-odds">
                {formatOdds(odds)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-primary/10">
              <span>Probabilidade impl\u00edcita</span>
              <span data-testid="text-yes-probability">{formatProbability(probability)}</span>
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
              <span className="text-muted-foreground">Investimento</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-yes">{formatBRL(stakeBRL)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retorno total (se ganhar)</span>
              <span className="font-semibold tabular-nums text-primary" data-testid="text-potential-payout-yes">
                {formatBRL(totalPayout)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro l\u00edquido</span>
              <span className="font-semibold tabular-nums text-primary" data-testid="text-potential-profit-yes">
                {formatBRL(netProfit)}
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
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                Odds NÃO
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Retorno por R$ 1 apostado (incluindo stake)</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-3xl font-bold tabular-nums text-destructive" data-testid="text-no-odds">
                {formatOdds(odds)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-destructive/10">
              <span>Probabilidade impl\u00edcita</span>
              <span data-testid="text-no-probability">{formatProbability(probability)}</span>
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
              <span className="text-muted-foreground">Investimento</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-no">{formatBRL(stakeBRL)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Retorno total (se ganhar)</span>
              <span className="font-semibold tabular-nums text-destructive" data-testid="text-potential-payout-no">
                {formatBRL(totalPayout)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Lucro l\u00edquido</span>
              <span className="font-semibold tabular-nums text-destructive" data-testid="text-potential-profit-no">
                {formatBRL(netProfit)}
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
        </TabsContent>

        <TabsContent value="limit" className="mt-6 space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Button
                variant={limitAction === "buy" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setLimitAction("buy")}
                data-testid="button-limit-buy"
              >
                Comprar
              </Button>
              <Button
                variant={limitAction === "sell" ? "default" : "outline"}
                className="flex-1"
                onClick={() => setLimitAction("sell")}
                data-testid="button-limit-sell"
              >
                Vender
              </Button>
            </div>

            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "yes" | "no")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="yes" data-testid="tab-limit-yes">
                  SIM
                </TabsTrigger>
                <TabsTrigger value="no" data-testid="tab-limit-no">
                  NÃO
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-2">
              <Label htmlFor="limit-price" className="flex items-center gap-1">
                Probabilidade (0.01 - 0.99)
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Probabilidade em decimal (0.50 = 50%)</p>
                  </TooltipContent>
                </Tooltip>
              </Label>
              <Input
                id="limit-price"
                type="number"
                placeholder="0.50"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                min="0.01"
                max="0.99"
                step="0.01"
                data-testid="input-limit-price"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="limit-shares">Quantidade de ações</Label>
              <Input
                id="limit-shares"
                type="number"
                placeholder="10.00"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                min="0.01"
                step="0.01"
                data-testid="input-limit-shares"
              />
            </div>

            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Odds da ordem</span>
                <span className="font-semibold tabular-nums">
                  {limitPrice ? formatOdds(probToOdds(parseFloat(limitPrice))) : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Probabilidade</span>
                <span className="font-semibold tabular-nums text-xs">
                  {limitPrice ? formatProbability(parseFloat(limitPrice)) : "-"}
                </span>
              </div>
              <div className="flex justify-between text-sm border-t border-border pt-2">
                <span className="text-muted-foreground">Valor estimado</span>
                <span className="font-semibold tabular-nums">
                  {limitPrice && shares ? formatBRL(parseFloat(limitPrice) * parseFloat(shares)) : formatBRL(0)}
                </span>
              </div>
            </div>

            <Button
              type="button"
              onClick={handleLimitOrder}
              disabled={!shares || !limitPrice || limitOrderMutation.isPending}
              className="w-full"
              size="lg"
              data-testid="button-limit-execute"
            >
              {limitOrderMutation.isPending ? "Criando..." : `${limitAction === "buy" ? "Comprar" : "Vender"} ${orderType === "yes" ? "SIM" : "NÃO"}`}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Saldo BRL:</span>
          <span className="font-medium">{formatBRL(parseFloat(userBalance?.brl || "0"))}</span>
        </div>
      </div>
    </Card>
  );
}
