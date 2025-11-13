import { useQuery } from "@tanstack/react-query";
import { PublicNavbar } from "@/components/public-navbar";
import { Navbar } from "@/components/navbar";
import { MarketCard } from "@/components/market-card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import type { Market } from "@shared/schema";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch Palpites.AI markets (exactly 4 markets mirroring Polymarket)
  const { data: markets, isLoading, error } = useQuery<Market[]>({
    queryKey: ["/api/markets"],
    staleTime: 0,
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  return (
    <div className="min-h-screen bg-background">
      {user ? <Navbar /> : <PublicNavbar />}
      <main className="container mx-auto px-4 py-6 space-y-8">
        {/* Hero Section */}
        <div className="space-y-4 text-center max-w-3xl mx-auto py-8">
          <h1 className="font-accent text-4xl md:text-5xl lg:text-6xl font-bold text-primary">Palpite certo. Pix no bolso!</h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">Mensagem a ser escrita - subtitulo</p>
        </div>

        {/* Palpites.AI Markets */}
        <div className="max-w-7xl mx-auto">
          <section>
            <h2 className="text-3xl font-bold mb-6">Mercados Disponíveis</h2>
            
            {isLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-56 rounded-lg" />
                ))}
              </div>
            )}

            {error && (
              <div className="text-center py-16 space-y-4">
                <h3 className="text-xl font-semibold text-destructive">Erro ao carregar mercados</h3>
                <p className="text-muted-foreground">
                  {error instanceof Error ? error.message : "Tente recarregar a página"}
                </p>
              </div>
            )}

            {!isLoading && !error && markets && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="grid-markets">
                {markets.map((market) => (
                  <MarketCard key={market.id} market={market} isPublic />
                ))}
              </div>
            )}

            {!isLoading && !error && (!markets || markets.length === 0) && (
              <div className="text-center py-16 space-y-4">
                <h3 className="text-xl font-semibold">Nenhum mercado disponível</h3>
                <p className="text-muted-foreground">Aguarde novos mercados em breve</p>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
