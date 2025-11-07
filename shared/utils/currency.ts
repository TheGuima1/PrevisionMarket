/**
 * Utilit\u00e1rios para formata\u00e7\u00e3o de moeda em Real brasileiro (BRL)
 */

/**
 * Formata valor em BRL com padr\u00e3o brasileiro
 * @param value Valor num\u00e9rico
 * @returns String formatada (ex: "R$ 1.234,56")
 */
export function formatBRL(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Formata valor em BRL de forma compacta (sem centavos se inteiro)
 * @param value Valor num\u00e9rico
 * @returns String formatada (ex: "R$ 1.234" ou "R$ 1.234,50")
 */
export function formatBRLCompact(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  const isInteger = numValue % 1 === 0;
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: isInteger ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Formata n\u00famero sem s\u00edmbolo de moeda
 * @param value Valor num\u00e9rico
 * @returns String formatada (ex: "1.234,56")
 */
export function formatNumber(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue);
}

/**
 * Parse string BRL para n\u00famero
 * @param value String em formato PT-BR (ex: "1.234,56" ou "R$ 1.234,56")
 * @returns N\u00famero
 */
export function parseBRL(value: string): number {
  // Remove R$, espa\u00e7os e pontos de milhar
  const cleaned = value
    .replace(/R\$/g, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(/,/g, '.');
  
  return parseFloat(cleaned) || 0;
}

/**
 * Formata data em padr\u00e3o brasileiro
 * @param date Data
 * @returns String formatada (ex: "31/12/2025")
 */
export function formatDateBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(dateObj);
}

/**
 * Formata data e hora em padr\u00e3o brasileiro
 * @param date Data
 * @returns String formatada (ex: "31/12/2025 14:30")
 */
export function formatDateTimeBR(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
}

/**
 * Formata valor em BRL3 (token nativo da plataforma)
 * @param value Valor numérico
 * @returns String formatada (ex: "1.234,56 BRL3")
 */
export function formatBRL3(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numValue) + ' BRL3';
}
