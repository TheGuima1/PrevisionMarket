import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { MarketCard } from "@/components/market-card";
import HowItWorks from "@/components/how-it-works";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Market } from "@shared/schema";
import { TrendingUp, Vote, Bitcoin, Cpu, Trophy } from "lucide-react";

// Simplified 5-tab navigation system
const tabs = [
  { value: "trending", label: "Trending", icon: TrendingUp },
  { value: "politics", label: "Política", icon: Vote },
  { value: "crypto", label: "Crypto", icon: Bitcoin },
  { value: "tech", label: "Tech", icon: Cpu },
  { value: "sports", label: "Sports", icon: Trophy },
];

export default function HomePage() {
  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Filter markets by tab
  const getMarketsByTab = (tabValue: string): Market[] => {
    if (!markets) return [];
    
    if (tabValue === "trending") {
      // Top 4 markets by totalVolume
      return [...markets]
        .sort((a, b) => parseFloat(b.totalVolume) - parseFloat(a.totalVolume))
        .slice(0, 4);
    }
    
    // Filter by category
    return markets.filter(m => m.category === tabValue);
  };

  // Render markets grid for a tab
  const renderMarketsGrid = (tabMarkets: Market[], tabValue: string) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-lg" />
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl opacity-50">⚠️</div>
          <h3 className="text-xl font-semibold text-destructive">Erro ao carregar mercados</h3>
          <p className="text-muted-foreground">
            {error instanceof Error ? error.message : "Tente recarregar a página"}
          </p>
        </div>
      );
    }

    if (tabMarkets.length === 0) {
      return (
        <div className="text-center py-16 space-y-4">
          <div className="text-6xl opacity-50">📊</div>
          <h3 className="text-xl font-semibold">Nenhum mercado encontrado</h3>
          <p className="text-muted-foreground">Nenhum mercado disponível nesta categoria</p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid={`grid-markets-${tabValue}`}>
        {tabMarkets.map((market) => (
          <MarketCard key={market.id} market={market} isPublic />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <PublicNavbar />
      
      <main className="container mx-auto px-4 py-6 space-y-6">
        {/* Hero Section */}
        <div className="space-y-3 text-center max-w-3xl mx-auto">
          <h1 className="font-accent text-3xl md:text-4xl font-bold text-white">
            Acerte previsões. Ganhe em BRL3.
          </h1>
          <p className="text-white/70 text-base">
            Probabilidade = preço. Cada cota vencedora paga 1 BRL3.
          </p>
        </div>

        {/* How It Works Section */}
        <HowItWorks />

        {/* Markets Section - Centered Layout */}
        <div className="max-w-7xl mx-auto">
          <Tabs defaultValue="trending" className="w-full">
            <TabsList className="w-full grid grid-cols-5 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="flex items-center gap-2"
                    data-testid={`tab-${tab.value}`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {tabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value}>
                {renderMarketsGrid(getMarketsByTab(tab.value), tab.value)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </main>
    </div>
  );
}
