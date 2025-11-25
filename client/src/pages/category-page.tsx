import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { PublicNavbar } from "@/components/public-navbar";
import { Navbar } from "@/components/navbar";
import { CategoryNav } from "@/components/category-nav";
import { MultiOptionEventCard } from "@/components/multi-option-event-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Market } from "@shared/schema";
import { Vote, Globe, Trophy, Bitcoin, AlertCircle, Landmark } from "lucide-react";

interface CategoryConfig {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  eventTags: string[];
  eventMetadata: { [key: string]: { title: string; slug: string; icon: "vote" | "globe" | "trophy" } };
}

const categoryConfigs: { [key: string]: CategoryConfig } = {
  politica: {
    id: "politica",
    title: "Política",
    description: "Mercados sobre eleições e eventos políticos",
    icon: Landmark,
    eventTags: ["Eleição Brasil 2026", "US recession by end of 2026?"],
    eventMetadata: {
      "Eleição Brasil 2026": {
        title: "Eleição Presidencial Brasil 2026",
        slug: "brazil-presidential-election",
        icon: "vote"
      },
      "US recession by end of 2026?": {
        title: "Recessão nos EUA até 2026?",
        slug: "us-recession-by-end-of-2026",
        icon: "globe"
      }
    }
  },
  esportes: {
    id: "esportes",
    title: "Esportes",
    description: "Mercados sobre eventos esportivos mundiais",
    icon: Trophy,
    eventTags: ["2026 FIFA World Cup Winner"],
    eventMetadata: {
      "2026 FIFA World Cup Winner": {
        title: "Copa do Mundo FIFA 2026",
        slug: "2026-fifa-world-cup-winner-595",
        icon: "trophy"
      }
    }
  },
  cripto: {
    id: "cripto",
    title: "Cripto",
    description: "Mercados sobre criptomoedas e blockchain",
    icon: Bitcoin,
    eventTags: ["When will Bitcoin hit $150k?"],
    eventMetadata: {
      "When will Bitcoin hit $150k?": {
        title: "Quando Bitcoin vai atingir $150k?",
        slug: "when-will-bitcoin-hit-150k",
        icon: "globe"
      }
    }
  }
};

export default function CategoryPage() {
  const { user } = useAuth();
  const [, params] = useRoute("/categoria/:categoryId");
  const categoryId = params?.categoryId || "";
  const config = categoryConfigs[categoryId];
  
  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  if (!config) {
    return (
      <div className="min-h-screen">
        {user ? <Navbar /> : <PublicNavbar />}
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-7xl mx-auto">
            <CategoryNav />
            <div className="text-center py-16 space-y-4">
              <AlertCircle className="w-16 h-16 mx-auto text-destructive" />
              <h3 className="text-xl font-semibold text-white">Categoria não encontrada</h3>
              <p className="text-purple-light">A categoria "{categoryId}" não existe.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const Icon = config.icon;

  const filterMarkets = () => {
    if (!markets) return [];
    
    const allEvents: { tag: string; markets: Market[] }[] = [];
    const processedMarketIds = new Set<string>();
    
    config.eventTags.forEach(eventTag => {
      const tagMarkets = markets.filter(m => 
        m.tags?.some(t => t.trim() === eventTag)
      );
      
      if (tagMarkets.length > 0) {
        const unprocessedMarkets = tagMarkets.filter(m => !processedMarketIds.has(m.id));
        if (unprocessedMarkets.length > 0) {
          allEvents.push({ tag: eventTag, markets: unprocessedMarkets });
          unprocessedMarkets.forEach(m => processedMarketIds.add(m.id));
        }
      }
    });
    
    return allEvents;
  };

  const filteredEvents = filterMarkets();

  return (
    <div className="min-h-screen">
      {user ? <Navbar /> : <PublicNavbar />}
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-purple flex items-center justify-center shadow-purple">
              <Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">{config.title}</h1>
              <p className="text-purple-light">{config.description}</p>
            </div>
          </div>

          <CategoryNav />

          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
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

          {!isLoading && !error && filteredEvents.length > 0 && (
            <div className="space-y-8">
              {filteredEvents.map(({ tag, markets: eventMarkets }) => {
                const metadata = config.eventMetadata[tag] || {
                  title: tag,
                  slug: tag.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
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

          {!isLoading && !error && filteredEvents.length === 0 && (
            <div className="text-center py-16 space-y-4">
              <h3 className="text-xl font-semibold text-white">Nenhum mercado nesta categoria</h3>
              <p className="text-purple-light">Aguarde novos mercados em breve</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
