import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { PublicNavbar } from "@/components/public-navbar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export default function PolymarketDetailPage() {
  const [match, params] = useRoute("/polymarket/:slug");
  const slug = params?.slug || "";

  // Fetch market details
  const { data: markets, isLoading: marketsLoading } = useQuery<any[]>({
    queryKey: ["/api/polymarket/markets"],
  });

  const market = markets?.find(m => m.slug === slug);

  // Fetch historical data
  const { data: history, isLoading: historyLoading } = useQuery<any[]>({
    queryKey: ["/api/polymarket/history", slug],
    enabled: !!slug,
  });

  // Transform history for chart
  const chartData = history?.map(snapshot => {
    const data: any = {
      timestamp: format(new Date(snapshot.timestamp), "dd/MM HH:mm"),
      fullDate: snapshot.timestamp,
    };
    
    // Add each outcome as a series
    snapshot.outcomes.forEach((outcome: any) => {
      data[outcome.name] = outcome.percent;
    });
    
    return data;
  }) || [];

  // Get outcome names for chart lines
  const outcomeNames = market?.outcomes.map((o: any) => o.name) || [];

  // Color palette for chart lines
  const colors = ["#8b5cf6", "#22c55e", "#3b82f6", "#f59e0b", "#ef4444"];

  if (marketsLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <main className="container mx-auto px-4 py-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!market) {
    return (
      <div className="min-h-screen bg-background">
        <PublicNavbar />
        <main className="container mx-auto px-4 py-6">
          <div className="text-center py-16 space-y-4">
            <h2 className="text-2xl font-bold">Mercado não encontrado</h2>
            <p className="text-muted-foreground">Este mercado Polymarket não está disponível.</p>
            <Link href="/">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para Home
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Back button */}
        <Link href="/">
          <Button variant="ghost" size="sm" data-testid="button-back">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>

        {/* Market Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Badge 
              variant="outline" 
              className="whitespace-nowrap inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-xs font-semibold bg-purple-500/10 text-purple-400 border-purple-500/30"
            >
              <TrendingUp className="h-3 w-3" />
              Polymarket
            </Badge>
            <Badge variant="secondary">Beta - Apenas Visualização</Badge>
          </div>
          
          <h1 className="text-3xl md:text-4xl font-bold" data-testid="text-market-title">
            {market.title}
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Probabilidades</h2>
            
            {historyLoading ? (
              <Skeleton className="h-96 w-full" />
            ) : chartData.length === 0 ? (
              <div className="h-96 flex items-center justify-center text-muted-foreground">
                Nenhum dado histórico disponível ainda
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                  />
                  <YAxis 
                    domain={[0, 100]}
                    stroke="hsl(var(--foreground))"
                    tick={{ fill: "hsl(var(--muted-foreground))" }}
                    label={{ value: 'Probabilidade (%)', angle: -90, position: 'insideLeft', fill: "hsl(var(--muted-foreground))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      borderColor: "hsl(var(--border))",
                      borderRadius: "0.5rem",
                      color: "hsl(var(--card-foreground))",
                    }}
                  />
                  <Legend />
                  {outcomeNames.map((name: string, idx: number) => (
                    <Line
                      key={name}
                      type="monotone"
                      dataKey={name}
                      stroke={colors[idx % colors.length]}
                      strokeWidth={2}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          {/* Sidebar - Current Odds */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Probabilidades Atuais</h2>
            
            <div className="space-y-4">
              {market.outcomes.map((outcome: any, idx: number) => (
                <div 
                  key={outcome.name}
                  className="space-y-2 pb-4 border-b border-border last:border-0 last:pb-0"
                  data-testid={`outcome-${idx}`}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{outcome.name}</span>
                    <span className="text-2xl font-bold tabular-nums text-primary">
                      {outcome.percent.toFixed(1)}%
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${outcome.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Info box */}
            <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm text-purple-400">⚠️ Piloto Beta</h3>
              <p className="text-xs text-muted-foreground">
                Este mercado é espelhado da Polymarket com spread de 2%. 
                Apenas visualização - apostas não estão disponíveis no MVP piloto.
              </p>
            </div>
          </Card>
        </div>

        {/* Additional Info */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Informações Adicionais</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Slug:</span>
              <span className="ml-2 font-mono">{market.slug}</span>
            </div>
            {market.volume && (
              <div>
                <span className="text-muted-foreground">Volume:</span>
                <span className="ml-2 font-semibold">${parseFloat(market.volume).toLocaleString()}</span>
              </div>
            )}
            {market.endsAt && (
              <div>
                <span className="text-muted-foreground">Encerramento:</span>
                <span className="ml-2">{format(new Date(market.endsAt), "dd/MM/yyyy HH:mm")}</span>
              </div>
            )}
            <div>
              <span className="text-muted-foreground">Última atualização:</span>
              <span className="ml-2">{format(new Date(market.lastUpdate), "dd/MM/yyyy HH:mm")}</span>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
}
