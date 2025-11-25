import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Market } from "@shared/schema";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, TrendingDown, HelpCircle, Loader2 } from "lucide-react";
import { probToOdds, formatOdds, formatProbability, getYesPriceFromReserves, getNoPriceFromReserves } from "@shared/utils/odds";
import { formatBRL3 } from "@shared/utils/currency";

interface TradePanelProps {
  market: Market;
  userBalance?: { balanceBrl: string; balanceUsdc: string };
}

interface PreviewResult {
  displayProbYes: number;      // Polymarket probability % (e.g., 13.5)
  displayProbNo: number;
  displayOddsYes: number;       // Decimal odds (e.g., 7.41)
  displayOddsNo: number;
  estimatedShares: number;      // Net shares after 2% platform fee
  totalCost: number;
  platformFee: number;          // 2% platform fee (displayed transparently)
  potentialPayout: number;
  potentialProfit: number;
}

export function TradePanel({ market, userBalance }: TradePanelProps) {
  const [orderType, setOrderType] = useState<"yes" | "no">("yes");
  const [amountBRL, setAmountBRL] = useState("");
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const { toast } = useToast();

  const { data: fetchedUser } = useQuery<{ balanceBrl: string; balanceUsdc: string }>({
    queryKey: ["/api/user/profile"],
    enabled: !userBalance,
  });

  const effectiveUserBalance = userBalance || fetchedUser;

  // Guard: if market data is incomplete, show loading state
  if (!market || market.yesReserve === undefined || market.noReserve === undefined) {
    return (
      <Card className="p-6 space-y-6">
        <div className="space-y-2">
          <h3 className="font-accent text-xl font-semibold">Apostar</h3>
          <p className="text-sm text-muted-foreground">Carregando dados do mercado...</p>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </Card>
    );
  }

  const probability = orderType === "yes" 
    ? getYesPriceFromReserves(market.yesReserve, market.noReserve)
    : getNoPriceFromReserves(market.yesReserve, market.noReserve);
  const odds = probToOdds(probability);
  
  const stakeBRL = amountBRL ? parseFloat(amountBRL) : 0;
  const availableBalance = effectiveUserBalance?.balanceBrl ? parseFloat(effectiveUserBalance.balanceBrl) : 0;
  const hasInsufficientBalance = stakeBRL > availableBalance;
  const isValidAmount = stakeBRL > 0;
  
  // Use preview data if available, otherwise fallback to simple calculation
  const estimatedShares = previewData?.estimatedShares ?? 0;
  const estimatedPayout = previewData?.potentialPayout ?? 0;
  const estimatedProfit = previewData?.potentialProfit ?? 0;

  // Debounced preview fetch with abort controller
  useEffect(() => {
    if (!stakeBRL || stakeBRL <= 0) {
      setPreviewData(null);
      setIsLoadingPreview(false); // FIX: Reset loading state when clearing input
      return;
    }

    const controller = new AbortController();

    const timeoutId = setTimeout(async () => {
      setIsLoadingPreview(true);
      try {
        const res = await apiRequest("POST", "/api/orders/preview", {
          marketId: market.id,
          type: orderType,
          usdcAmount: stakeBRL,
        });
        const data = await res.json();
        
        // Only update if this is still the latest request
        if (!controller.signal.aborted) {
          setPreviewData(data);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Preview failed:", error);
          setPreviewData(null);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoadingPreview(false);
        }
      }
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(timeoutId);
      controller.abort(); // Cancel fetch if deps change
    };
  }, [stakeBRL, orderType, market.id]);

  const buyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/orders", {
        marketId: market.id,
        type: orderType,
        usdcAmount: stakeBRL,
      });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Aposta realizada!",
        description: `Você apostou ${formatBRL3(stakeBRL)} em ${orderType === "yes" ? "SIM" : "NÃO"}`,
      });
      setAmountBRL("");
      queryClient.invalidateQueries({ queryKey: ["/api/markets", market.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/markets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] });
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
    if (!amountBRL || parseFloat(amountBRL) <= 0) {
      toast({
        title: "Valor inválido",
        description: "Digite um valor válido em reais",
        variant: "destructive",
      });
      return;
    }
    buyMutation.mutate();
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="space-y-2">
        <h3 className="font-accent text-xl font-semibold">Apostar</h3>
        <p className="text-sm text-muted-foreground">
          Escolha SIM ou NÃO e defina o valor da aposta
        </p>
      </div>

      <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "yes" | "no")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger 
            value="yes" 
            className="data-[state=active]:bg-action-yes data-[state=active]:text-white hover-elevate"
            data-testid="tab-buy-yes"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            SIM
          </TabsTrigger>
          <TabsTrigger 
            value="no"
            className="data-[state=active]:bg-action-no data-[state=active]:text-white hover-elevate"
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
                    <p className="text-xs">Retorno por 1 BRL3 apostado (incluindo stake)</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-3xl font-bold tabular-nums text-primary" data-testid="text-yes-odds">
                {formatOdds(odds)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-primary/10">
              <span className="flex items-center gap-1">
                Probabilidade implícita
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" data-testid="tooltip-trigger-spot-price" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-1">Probabilidade de Mercado</p>
                    <p className="text-xs">Probabilidade baseada no preço atual de mercado. Quanto maior a probabilidade, maior a chance do evento acontecer.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span data-testid="text-yes-probability">{formatProbability(probability)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-yes">Valor da aposta (BRL3)</Label>
            <Input
              id="amount-yes"
              type="number"
              placeholder="0.00"
              value={amountBRL}
              onChange={(e) => setAmountBRL(e.target.value)}
              min="0"
              step="0.01"
              data-testid="input-amount-yes"
            />
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-yes">{formatBRL3(stakeBRL)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">Retorno Total</span>
              {isLoadingPreview && stakeBRL > 0 ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-semibold tabular-nums text-primary text-base" data-testid="text-potential-payout-yes">
                  {formatBRL3(estimatedPayout)}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={!isValidAmount || buyMutation.isPending || isLoadingPreview || hasInsufficientBalance}
            className="w-full bg-primary hover:bg-primary/90"
            size="lg"
            data-testid="button-buy-yes-execute"
          >
            {buyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : hasInsufficientBalance && isValidAmount ? (
              "Saldo insuficiente"
            ) : (
              "Apostar em SIM"
            )}
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
                    <p className="text-xs">Retorno por 1 BRL3 apostado (incluindo stake)</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="text-3xl font-bold tabular-nums text-destructive" data-testid="text-no-odds">
                {formatOdds(odds)}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs text-muted-foreground pt-1 border-t border-destructive/10">
              <span className="flex items-center gap-1">
                Probabilidade implícita
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-3 w-3 cursor-help" data-testid="tooltip-trigger-spot-price" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs font-medium mb-1">Probabilidade de Mercado</p>
                    <p className="text-xs">Probabilidade baseada no preço atual de mercado. Quanto maior a probabilidade, maior a chance do evento acontecer.</p>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span data-testid="text-no-probability">{formatProbability(probability)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount-no">Valor da aposta (BRL3)</Label>
            <Input
              id="amount-no"
              type="number"
              placeholder="0.00"
              value={amountBRL}
              onChange={(e) => setAmountBRL(e.target.value)}
              min="0"
              step="0.01"
              data-testid="input-amount-no"
            />
          </div>

          <div className="space-y-3 bg-muted/30 rounded-lg p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Investimento</span>
              <span className="font-semibold tabular-nums" data-testid="text-total-cost-no">{formatBRL3(stakeBRL)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-border">
              <span className="text-muted-foreground font-medium">Retorno Total</span>
              {isLoadingPreview && stakeBRL > 0 ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <span className="font-semibold tabular-nums text-destructive text-base" data-testid="text-potential-payout-no">
                  {formatBRL3(estimatedPayout)}
                </span>
              )}
            </div>
          </div>

          <Button
            onClick={handleBuy}
            disabled={!isValidAmount || buyMutation.isPending || isLoadingPreview || hasInsufficientBalance}
            className="w-full"
            variant="destructive"
            size="lg"
            data-testid="button-buy-no-execute"
          >
            {buyMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : hasInsufficientBalance && isValidAmount ? (
              "Saldo insuficiente"
            ) : (
              "Apostar em NÃO"
            )}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="pt-4 border-t">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Saldo BRL3:</span>
          <span className="font-medium">{formatBRL3(parseFloat(effectiveUserBalance?.balanceBrl || "0"))}</span>
        </div>
      </div>
    </Card>
  );
}
