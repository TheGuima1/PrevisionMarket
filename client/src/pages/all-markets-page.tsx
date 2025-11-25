import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { Navbar } from "@/components/navbar";
import { CategoryNav } from "@/components/category-nav";
import { MultiOptionEventCard } from "@/components/multi-option-event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Market } from "@shared/schema";
import { LayoutGrid } from "lucide-react";

export default function AllMarketsPage() {
  const { user } = useAuth();
  
  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const genericTags = new Set([
    'Brasil', 'Brazil', 'Política', 'Politics', 'Esportes', 'Sports',
    'Economia', 'Economy', 'Eleições', 'Elections', 'Futebol', 'Football',
    'Cripto', 'Crypto', 'Tecnologia', 'Technology', 'Music', 'Música'
  ]);

  const eventMetadata: { [key: string]: { title: string; slug: string; icon: "vote" | "globe" | "trophy" } } = {
    "Eleição Brasil 2026": {
      title: "Eleição Presidencial Brasil 2026",
      slug: "brazil-presidential-election",
      icon: "vote"
    },
    "2026 FIFA World Cup Winner": {
      title: "Copa do Mundo FIFA 2026",
      slug: "2026-fifa-world-cup-winner-595",
      icon: "trophy"
    },
    "When will Bitcoin hit $150k?": {
      title: "Quando Bitcoin vai atingir $150k?",
      slug: "when-will-bitcoin-hit-150k",
      icon: "globe"
    },
    "US recession by end of 2026?": {
      title: "Recessão nos EUA até 2026?",
      slug: "us-recession-by-end-of-2026",
      icon: "globe"
    }
  };

  const groupMarkets = () => {
    if (!markets) return [];
    
    const tagGroups: { [key: string]: Market[] } = {};
    
    markets.forEach(market => {
      market.tags?.forEach(tag => {
        if (genericTags.has(tag.trim())) return;
        if (!tagGroups[tag]) tagGroups[tag] = [];
        tagGroups[tag].push(market);
      });
    });
    
    const allEvents: { tag: string; markets: Market[] }[] = [];
    const processedMarketIds = new Set<string>();
    
    Object.entries(tagGroups)
      .sort(([tagA], [tagB]) => tagB.length - tagA.length)
      .forEach(([tag, tagMarkets]) => {
        const unprocessedMarkets = tagMarkets.filter(m => !processedMarketIds.has(m.id));
        if (unprocessedMarkets.length > 0) {
          allEvents.push({ tag, markets: unprocessedMarkets });
          unprocessedMarkets.forEach(m => processedMarketIds.add(m.id));
        }
      });
    
    const ungroupedMarkets = markets.filter(m => !processedMarketIds.has(m.id));
    ungroupedMarkets.forEach(market => {
      allEvents.push({ tag: market.title, markets: [market] });
    });
    
    return allEvents;
  };

  return (
    <div className="min-h-screen">
      {user ? <Navbar /> : <PublicNavbar />}
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-purple flex items-center justify-center shadow-purple">
              <LayoutGrid className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Todos os Mercados</h1>
              <p className="text-purple-light">Explore todos os mercados disponíveis</p>
            </div>
          </div>

          <CategoryNav />

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
            <div className="space-y-8">
              {groupMarkets().map(({ tag, markets: eventMarkets }) => {
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
                    icon={metadata.icon}
                  />
                );
              })}
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
