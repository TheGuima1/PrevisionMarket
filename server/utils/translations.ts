/**
 * Portuguese translations for market titles from Polymarket
 * Used by event sync worker and seed scripts to ensure all titles are in PT-BR
 */

// Country name translations (English → Portuguese)
export const countryTranslations: Record<string, string> = {
  'Argentina': 'Argentina',
  'Australia': 'Austrália',
  'Belgium': 'Bélgica',
  'Brazil': 'Brasil',
  'Canada': 'Canadá',
  'Colombia': 'Colômbia',
  'Ecuador': 'Equador',
  'England': 'Inglaterra',
  'France': 'França',
  'Germany': 'Alemanha',
  'Iran': 'Irã',
  'Italy': 'Itália',
  'Japan': 'Japão',
  'Jordan': 'Jordânia',
  'Mexico': 'México',
  'Morocco': 'Marrocos',
  'Netherlands': 'Países Baixos',
  'New Zealand': 'Nova Zelândia',
  'Norway': 'Noruega',
  'Other': 'Outro',
  'Paraguay': 'Paraguai',
  'Peru': 'Peru',
  'Portugal': 'Portugal',
  'South Korea': 'Coreia do Sul',
  'Spain': 'Espanha',
  'Tunisia': 'Tunísia',
  'Uruguay': 'Uruguai',
  'USA': 'EUA',
  'Uzbekistan': 'Uzbequistão',
};

// Date translations for Bitcoin markets
export const dateTranslations: Record<string, string> = {
  'by December 31, 2025': 'até 31 de Dezembro de 2025',
  'by December 31, 2026': 'até 31 de Dezembro de 2026',
  'by June 30, 2026': 'até 30 de Junho de 2026',
  'by March 31, 2026': 'até 31 de Março de 2026',
  'by September 30, 2025': 'até 30 de Setembro de 2025',
  'by September 30, 2026': 'até 30 de Setembro de 2026',
};

// Full market title translations
export const marketTitleTranslations: Record<string, string> = {
  'US recession by end of 2026?': 'Recessão nos EUA até 2026?',
  ...countryTranslations,
  ...dateTranslations,
};

/**
 * Translate a market title from English to Portuguese
 * @param title Original title from Polymarket
 * @returns Translated title in PT-BR
 */
export function translateMarketTitle(title: string): string {
  // Check for exact match first
  if (marketTitleTranslations[title]) {
    return marketTitleTranslations[title];
  }
  
  // Check for country name matches
  if (countryTranslations[title]) {
    return countryTranslations[title];
  }
  
  // Check for date patterns
  if (dateTranslations[title]) {
    return dateTranslations[title];
  }
  
  // Return original if no translation found
  return title;
}
