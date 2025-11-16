import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { Navbar } from "@/components/navbar";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import type { Market } from "@shared/schema";
import { Zap, Lock, TrendingUp, LineChart } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
  // Redirect admins to admin panel
  useEffect(() => {
    if (user?.isAdmin && location === "/") {
      setLocation("/admin");
    }
  }, [user, location, setLocation]);
  
  // Fetch markets
  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen">
      {user ? <Navbar /> : <PublicNavbar />}
      
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-16">
        {/* Hero Section */}
        <div className="space-y-6 text-center max-w-4xl mx-auto py-12">
          <h1 className="font-accent text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
            Palpite certo.<br />Lucro real.
          </h1>
          <p className="text-purple-light text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Transforme probabilidades em resultados reais usando BRL3.
          </p>
          <Button 
            size="lg"
            onClick={() => setLocation("/wallet/deposit")}
            className="bg-gradient-purple text-white font-semibold shadow-purple border border-primary"
            data-testid="button-hero-deposit"
          >
            Depositar via PIX
          </Button>
        </div>

        {/* Feature Icons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          {[
            { icon: Zap, label: "Instantâneo" },
            { icon: Lock, label: "100% Seguro" },
            { icon: TrendingUp, label: "1:1 Lastreado" },
            { icon: LineChart, label: "Transparência Total" },
          ].map((feature, i) => (
            <div key={i} className="glass-card rounded-2xl p-6 text-center space-y-3 hover:border-glow-bright transition-all">
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-purple flex items-center justify-center shadow-purple">
                <feature.icon className="w-8 h-8 text-white" />
              </div>
              <p className="text-white font-semibold">{feature.label}</p>
            </div>
          ))}
        </div>

        {/* Markets Grid */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-white">Mercados Disponíveis</h2>
          
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-64 rounded-2xl bg-white/10" />
              ))}
            </div>
          )}

          {error && (
            <div className="text-center py-16 space-y-4">
              <h3 className="text-xl font-semibold text-destructive">Erro ao carregar mercados</h3>
              <p className="text-purple-light">
                {error instanceof Error ? error.message : "Tente recarregar a página"}
              </p>
            </div>
          )}

          {!isLoading && !error && markets && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-markets">
              {markets.map((market) => (
                <MarketCard key={market.id} market={market} isPublic />
              ))}
            </div>
          )}

          {!isLoading && !error && (!markets || markets.length === 0) && (
            <div className="text-center py-16 space-y-4">
              <h3 className="text-xl font-semibold text-white">Nenhum mercado disponível</h3>
              <p className="text-purple-light">Aguarde novos mercados em breve</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
