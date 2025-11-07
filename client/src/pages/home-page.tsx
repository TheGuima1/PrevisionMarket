import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { MarketCard } from "@/components/market-card";
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
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-3xl mx-auto py-8">
          <h1 className="font-accent text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">Palpite certo. Pix no bolso!</h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
            Preveja eventos futuros e ganhe em BRL3. Cada cota vencedora vale 1 BRL3 que você pode sacar via Pix.
          </p>
        </div>

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
