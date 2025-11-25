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
 * IMPORTANTE: Número de mercados = número de slugs (sempre 1:1)
 */
export const PALPITES_MARKETS: MarketMetadata[] = [
  {
    polymarketSlug: "brazil-election-2026-lula",
    title: "Lula vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-tarcisio",
    title: "Tarcísio de Freitas vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Tarcísio de Freitas vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-haddad",
    title: "Fernando Haddad vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Fernando Haddad vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-renan",
    title: "Renan Santos vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Renan Santos vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-ratinho",
    title: "Ratinho Júnior vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Carlos Roberto Massa Júnior (Ratinho Júnior) vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-jair",
    title: "Jair Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Jair Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-flavio",
    title: "Flávio Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Flávio Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-michelle",
    title: "Michelle Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Michelle Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "brazil-election-2026-eduardo",
    title: "Eduardo Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Eduardo Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
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
