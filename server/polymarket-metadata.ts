/**
 * Mapping de slugs Polymarket para metadados PT-BR dos mercados Palpites.AI
 * 
 * Este arquivo define os mercados da plataforma. 
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
 * Os mercados da Palpites.AI
 * IMPORTANTE: slugs devem ser os EXATOS do Polymarket
 */
export const PALPITES_MARKETS: MarketMetadata[] = [
  // Mercados serão adicionados aqui conforme necessário
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
