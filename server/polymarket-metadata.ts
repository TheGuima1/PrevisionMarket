/**
 * Mapping de slugs Polymarket para metadados PT-BR dos mercados Palpites.AI
 * 
 * Este arquivo define os 4 mercados da plataforma. 
 * Cada mercado Palpites.AI espelha um mercado Polymarket:
 * - Odds/probabilidades vêm do Polymarket via mirror system
 * - 2% spread aplicado na execução (invisível ao usuário)
 * - Metadados (título, descrição) localizados para PT-BR
 */

export interface MarketMetadata {
  polymarketSlug: string;
  title: string;
  description: string;
  category: "politics" | "crypto" | "tech" | "sports";
  tags: string[];
  resolutionSource: string;
  endDate: Date;
}

/**
 * Os 3 mercados da Palpites.AI
 * IMPORTANTE: Número de mercados = número de slugs (sempre 1:1)
 */
export const PALPITES_MARKETS: MarketMetadata[] = [
  {
    polymarketSlug: "us-recession-in-2025",
    title: "Recessão nos EUA em 2025?",
    description: "Mercado será resolvido como SIM se os EUA entrarem em recessão técnica (2 trimestres consecutivos de crescimento negativo do PIB) em 2025. NÃO caso contrário.",
    category: "politics",
    tags: ["USA", "Recession", "Economy"],
    resolutionSource: "US Bureau of Economic Analysis",
    endDate: new Date("2025-12-31T23:59:59Z"),
  },
  {
    polymarketSlug: "fed-rate-hike-in-2025",
    title: "Fed aumentará juros em 2025?",
    description: "Mercado será resolvido como SIM se o Federal Reserve aumentar a taxa de juros em qualquer momento durante 2025. NÃO caso contrário.",
    category: "politics",
    tags: ["Fed", "USA", "Juros"],
    resolutionSource: "Federal Reserve Official Announcements",
    endDate: new Date("2025-12-31T23:59:59Z"),
  },
  {
    polymarketSlug: "fed-emergency-rate-cut-in-2025",
    title: "Fed fará corte emergencial em 2025?",
    description: "Mercado será resolvido como SIM se o Federal Reserve realizar um corte de emergência na taxa de juros fora das reuniões programadas em 2025. NÃO caso contrário.",
    category: "crypto",
    tags: ["Fed", "Emergency", "Rate Cut"],
    resolutionSource: "Federal Reserve",
    endDate: new Date("2025-12-31T23:59:59Z"),
  },
];

/**
 * Retorna lista de slugs configurados para espelhamento
 * Esta é a fonte única de verdade (single source of truth)
 */
export function getConfiguredSlugs(): string[] {
  return PALPITES_MARKETS.map(m => m.polymarketSlug);
}

/**
 * Busca metadados por slug Polymarket
 */
export function getMetadataBySlug(slug: string): MarketMetadata | undefined {
  return PALPITES_MARKETS.find(m => m.polymarketSlug === slug);
}
