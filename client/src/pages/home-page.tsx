import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/navbar";
import { MarketCard } from "@/components/market-card";
import { AIAssistant } from "@/components/ai-assistant";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { Market } from "@shared/schema";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = [
  { value: "all", label: "Todos" },
  { value: "politica", label: "Política" },
  { value: "economia", label: "Economia" },
  { value: "cultura", label: "Cultura" },
  { value: "esportes", label: "Esportes" },
  { value: "ciencia", label: "Ciência" },
];

export default function HomePage() {
  const [selectedCategory, setSelectedCategory] = useState("all");

  const { data: markets, isLoading } = useQuery<Market[]>({
    queryKey: ["/api/markets", selectedCategory],
  });

  const filteredMarkets = markets?.filter(
    (m) => selectedCategory === "all" || m.category === selectedCategory
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="space-y-4">
          <div>
            <h1 className="font-accent text-4xl md:text-5xl font-bold mb-2">
              Aposte no Futuro do Brasil
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Negocie previsões sobre eventos futuros. Os preços refletem a sabedoria coletiva do mercado.
            </p>
          </div>

          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="flex-wrap h-auto gap-2 bg-muted/50">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.value}
                  value={cat.value}
                  className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  data-testid={`tab-category-${cat.value}`}
                >
                  {cat.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-lg" />
            ))}
          </div>
        ) : filteredMarkets && filteredMarkets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-markets">
            {filteredMarkets.map((market) => (
              <MarketCard key={market.id} market={market} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 space-y-4">
            <div className="text-6xl">📊</div>
            <h3 className="text-xl font-semibold">Nenhum mercado disponível</h3>
            <p className="text-muted-foreground">
              {selectedCategory === "all" 
                ? "Não há mercados ativos no momento"
                : `Não há mercados na categoria ${categories.find(c => c.value === selectedCategory)?.label}`
              }
            </p>
          </div>
        )}
      </main>

      <AIAssistant />
    </div>
  );
}
