/**
 * Mapping de slugs Polymarket para metadados PT-BR dos mercados Palpites.AI
 * 
 * Este arquivo define os mercados da plataforma. 
 * Cada mercado Palpites.AI espelha um mercado Polymarket:
 * - Odds/probabilidades vêm do Polymarket via mirror system
 * - 2% spread aplicado na execução (invisível ao usuário)
 * - Metadados (título, descrição) localizados para PT-BR
 * 
 * IMPORTANTE: Os slugs devem corresponder EXATAMENTE aos slugs do Polymarket
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
 * IMPORTANTE: slugs devem ser os EXATOS do Polymarket (não simplificados)
 */
export const PALPITES_MARKETS: MarketMetadata[] = [
  {
    polymarketSlug: "will-luiz-incio-lula-da-silva-win-the-2026-brazilian-presidential-election",
    title: "Lula vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Luiz Inácio Lula da Silva vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-tarcisio-de-frietas-win-the-2026-brazilian-presidential-election",
    title: "Tarcísio de Freitas vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Tarcísio de Freitas vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-fernando-haddad-win-the-2026-brazilian-presidential-election",
    title: "Fernando Haddad vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Fernando Haddad vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-renan-santos-win-the-2026-brazilian-presidential-election",
    title: "Renan Santos vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Renan Santos vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-carlos-roberto-massa-jnior-win-the-2026-brazilian-presidential-election",
    title: "Ratinho Júnior vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Carlos Roberto Massa Júnior (Ratinho Júnior) vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-jair-bolsonaro-win-the-2026-brazilian-presidential-election",
    title: "Jair Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Jair Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-flvio-bolsonaro-win-the-2026-brazilian-presidential-election",
    title: "Flávio Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Flávio Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-michelle-bolsonaro-win-the-2026-brazilian-presidential-election",
    title: "Michelle Bolsonaro vencerá as eleições presidenciais brasileiras de 2026?",
    description: "Mercado espelhado do Polymarket sobre as eleições presidenciais brasileiras de 2026. Será resolvido como SIM se Michelle Bolsonaro vencer as eleições. NÃO caso contrário.",
    category: "politics",
    tags: ["Eleição Brasil 2026", "Política", "Brasil"],
    resolutionSource: "Tribunal Superior Eleitoral (TSE)",
    endDate: new Date("2026-10-04T23:59:59Z"),
  },
  {
    polymarketSlug: "will-eduardo-bolsonaro-win-the-2026-brazilian-presidential-election",
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
