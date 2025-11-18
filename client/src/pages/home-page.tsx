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

          {!isLoading && !error && markets && (() => {
            // Group Brazil Election markets
            const brazilElectionMarkets = markets.filter(m => 
              m.tags?.includes('Eleição Brasil 2026')
            );
            const otherMarkets = markets.filter(m => 
              !m.tags?.includes('Eleição Brasil 2026')
            );
            
            return (
              <div className="space-y-8">
                {/* Brazil Election 2026 - Special Card */}
                {brazilElectionMarkets.length > 0 && (
                  <div className="glass-card rounded-2xl p-6 border border-glow hover:border-glow-bright transition-all">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h3 className="text-2xl font-bold text-white mb-1">
                          Eleição Presidencial Brasil 2026
                        </h3>
                        <p className="text-purple-light text-sm">
                          Quem vencerá as eleições? Sincronizado com Polymarket
                        </p>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-xs font-semibold">
                        {brazilElectionMarkets.length} candidatos
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {brazilElectionMarkets.map((market) => {
                        const probYes = parseFloat(market.yesReserve) / 
                          (parseFloat(market.yesReserve) + parseFloat(market.noReserve));
                        const percentage = (probYes * 100).toFixed(1);
                        
                        // Extract candidate name from title
                        const candidateName = market.title.split(' vencerá')[0];
                        
                        return (
                          <button
                            key={market.id}
                            onClick={() => setLocation(`/market/${market.id}`)}
                            className="glass-card rounded-xl p-4 text-left hover:border-glow-bright transition-all group"
                            data-testid={`card-election-${market.id}`}
                          >
                            <div className="space-y-3">
                              <div className="flex items-start justify-between">
                                <h4 className="font-semibold text-white group-hover:text-primary transition-colors line-clamp-2">
                                  {candidateName}
                                </h4>
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-3xl font-bold text-primary">
                                    {percentage}%
                                  </span>
                                  <span className="text-xs text-purple-light">
                                    chance
                                  </span>
                                </div>
                                
                                {/* Progress bar */}
                                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-purple transition-all duration-300"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {/* Other Markets */}
                {otherMarkets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6" data-testid="grid-markets">
                    {otherMarkets.map((market) => (
                      <MarketCard key={market.id} market={market} isPublic />
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

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
