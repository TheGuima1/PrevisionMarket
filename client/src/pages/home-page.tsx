import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { Navbar } from "@/components/navbar";
import { ModernMarketCard } from "@/components/modern-market-card";
import { MultiOptionEventCard } from "@/components/multi-option-event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import type { Market } from "@shared/schema";
import { Zap, Lock, TrendingUp, LineChart } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  
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
            // Blacklist generic category tags that should not be treated as events
            const genericTags = new Set([
              'Brasil', 'Brazil', 'Política', 'Politics', 'Esportes', 'Sports',
              'Economia', 'Economy', 'Eleições', 'Elections', 'Futebol', 'Football',
              'Cripto', 'Crypto', 'Tecnologia', 'Technology'
            ]);
            
            // Group markets by tags to detect multi-option events
            const tagGroups: { [key: string]: Market[] } = {};
            
            markets.forEach(market => {
              market.tags?.forEach(tag => {
                // Skip generic category tags
                if (genericTags.has(tag.trim())) {
                  return;
                }
                
                if (!tagGroups[tag]) {
                  tagGroups[tag] = [];
                }
                tagGroups[tag].push(market);
              });
            });
            
            // Separate multi-option events (3+ markets) from binary markets
            // Prioritize longer, more specific tags
            const multiOptionEvents: { tag: string; markets: Market[] }[] = [];
            const processedMarketIds = new Set<string>();
            
            Object.entries(tagGroups)
              .sort(([tagA], [tagB]) => tagB.length - tagA.length) // Longer tags first
              .forEach(([tag, tagMarkets]) => {
                // Only group if 8+ markets (true multi-option events like elections, championships)
                // This excludes smaller groups like Bitcoin (4 timeframes) which are independent binary markets
                const unprocessedMarkets = tagMarkets.filter(m => !processedMarketIds.has(m.id));
                
                if (unprocessedMarkets.length >= 8) {
                  multiOptionEvents.push({ tag, markets: unprocessedMarkets });
                  unprocessedMarkets.forEach(m => processedMarketIds.add(m.id));
                }
              });
            
            const binaryMarkets = markets.filter(m => !processedMarketIds.has(m.id));
            
            // Event metadata mapping (normalized keys without trailing spaces)
            const eventMetadata: { [key: string]: { title: string; slug: string; url?: string; icon: "vote" | "globe" | "trophy" } } = {
              "Eleição Brasil 2026": {
                title: "Eleição Presidencial Brasil 2026",
                slug: "brazil-election-2026",
                url: "https://polymarket.com/event/brazil-presidential-election",
                icon: "vote"
              },
              "2026 FIFA World Cup Winner": {
                title: "2026 FIFA World Cup Winner",
                slug: "2026-fifa-world-cup-winner-595",
                url: "https://polymarket.com/event/2026-fifa-world-cup-winner-595",
                icon: "globe"
              },
              "Brasileiro Serie A League Winner": {
                title: "Brasileiro Série A League Winner",
                slug: "brasileiro-serie-a-league-winner",
                url: "https://polymarket.com/event/brasileiro-serie-a-league-winner",
                icon: "trophy"
              }
            };
            
            return (
              <div className="space-y-8">
                {/* Multi-option Events - Top 2 format */}
                {multiOptionEvents.map(({ tag, markets: eventMarkets }) => {
                  const normalizedTag = tag.trim();
                  const metadata = eventMetadata[normalizedTag] || {
                    title: normalizedTag,
                    slug: normalizedTag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
                    icon: "globe" as const
                  };
                  
                  return (
                    <MultiOptionEventCard
                      key={tag}
                      markets={eventMarkets}
                      eventTitle={metadata.title}
                      eventSlug={metadata.slug}
                      polymarketUrl={metadata.url}
                      icon={metadata.icon}
                    />
                  );
                })}
                
                {/* Binary Markets - Traditional cards */}
                {binaryMarkets.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-markets">
                    {binaryMarkets.map((market) => (
                      <ModernMarketCard key={market.id} market={market} />
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
