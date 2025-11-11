/**
 * Utilit\u00e1rios para convers\u00e3o entre probabilidades e odds decimais
 * 
 * Odds Decimais = valor pago por 1 BRL apostado (stake inclu\u00eddo)
 * Exemplo: odds 2.50 = aposta R$ 100, retorna R$ 250 se ganhar
 * 
 * Probabilidade = chance de acontecer (0-1)
 * Exemplo: 0.4 = 40% de chance
 */

const MIN_PROB = 0.0001; // 0.01%
const MAX_PROB = 0.9999; // 99.99%

/**
 * Converte probabilidade para odds decimal
 * @param prob Probabilidade (0-1)
 * @returns Odds decimal (ex: 2.50)
 */
export function probToOdds(prob: number): number {
  const clamped = Math.min(Math.max(prob, MIN_PROB), MAX_PROB);
  return 1 / clamped;
}

/**
 * Converte odds decimal para probabilidade
 * @param odds Odds decimal (ex: 2.50)
 * @returns Probabilidade (0-1)
 */
export function oddsToProbability(odds: number): number {
  if (odds <= 1) return MAX_PROB;
  return 1 / odds;
}

/**
 * Converte probabilidades YES/NO para odds decimais
 * @param yesPrice Probabilidade YES (0-1)
 * @param noPrice Probabilidade NO (0-1)
 * @returns Odds decimais { yes, no }
 */
export function probToOddsYesNo(yesPrice: number, noPrice: number) {
  return {
    yes: probToOdds(yesPrice),
    no: probToOdds(noPrice),
  };
}

/**
 * Calcula probabilidade impl\u00edcita de uma odd
 * (usado em tooltips)
 */
export function impliedProbability(odds: number): number {
  return oddsToProbability(odds);
}

/**
 * Formata odds para exibi\u00e7\u00e3o (2 casas decimais)
 */
export function formatOdds(odds: number): string {
  return odds.toFixed(2);
}

/**
 * Formata probabilidade como percentual
 */
export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(2)}%`;
}

/**
 * Calcula retorno potencial dado uma aposta
 * @param stakeBRL Valor apostado em BRL
 * @param odds Odds decimal
 * @returns Retorno total (stake + lucro)
 */
export function calculatePayout(stakeBRL: number, odds: number): number {
  return stakeBRL * odds;
}

/**
 * Calcula lucro l\u00edquido (sem stake)
 * @param stakeBRL Valor apostado em BRL
 * @param odds Odds decimal
 * @returns Lucro (sem incluir stake)
 */
export function calculateProfit(stakeBRL: number, odds: number): number {
  return stakeBRL * (odds - 1);
}

/**
 * Calcula probabilidade (preço) de YES a partir das reservas AMM
 * Formula AMM: yesPrice = yesReserve / (yesReserve + noReserve)
 * @returns Probabilidade YES (0-1), ou 0.5 se sem liquidez
 */
export function getYesPriceFromReserves(yesReserve: string, noReserve: string): number {
  const yes = parseFloat(yesReserve);
  const no = parseFloat(noReserve);
  
  if (yes === 0 && no === 0) return 0.5;
  
  const total = yes + no;
  if (total === 0) return 0.5;
  
  return yes / total;
}

/**
 * Calcula probabilidade (preço) de NO a partir das reservas AMM
 * Formula AMM: noPrice = noReserve / (yesReserve + noReserve)
 * @returns Probabilidade NO (0-1), ou 0.5 se sem liquidez
 */
export function getNoPriceFromReserves(yesReserve: string, noReserve: string): number {
  const yes = parseFloat(yesReserve);
  const no = parseFloat(noReserve);
  
  if (yes === 0 && no === 0) return 0.5;
  
  const total = yes + no;
  if (total === 0) return 0.5;
  
  return no / total;
}
