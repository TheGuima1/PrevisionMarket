# Plano de Migração Híbrida - Integração Polymarket API

## 🎯 Objetivo
Adicionar integração com Polymarket API como **piloto** (3-5 mercados), mantendo MVP atual intacto (6 mercados AMM próprio).

---

## 📋 Escopo da Implementação

### ✅ **O que será MANTIDO (sem mudanças):**
- ✓ 6 mercados brasileiros com AMM próprio (CPMM + 2% spread)
- ✓ Sistema completo de Auth (Passport.js + sessions)
- ✓ Portfolio page (posições, P&L, wallet mock)
- ✓ AI Assistant (Cachorro GPT-5)
- ✓ Comments system (Reddit-style)
- ✓ Admin panel (criar/resolver markets)
- ✓ Full PT-BR localization
- ✓ Trade preview system (/api/orders/preview)
- ✓ TypeScript + React + Drizzle ORM
- ✓ Design guidelines e branding roxo

### 🆕 **O que será ADICIONADO:**
- ➕ Tabelas novas: `polymarket_markets`, `polymarket_snapshots`
- ➕ Serviço `server/polymarket-client.ts` (busca API)
- ➕ Cron job `server/polymarket-cron.ts` (snapshots 60s)
- ➕ Rotas novas: `GET /api/polymarket/markets`, `GET /api/polymarket/history/:slug`
- ➕ Componente `PolymarketMarketCard.tsx` (visual diferente)
- ➕ Página `polymarket-detail-page.tsx` (gráfico histórico)
- ➕ Feature flag: `ENABLE_POLYMARKET` (on/off)
- ➕ Sistema de cache local (fallback se API cair)

---

## 🗂️ Estrutura de Arquivos Novos

```
server/
  polymarket-client.ts       # Cliente API Polymarket
  polymarket-cron.ts         # Snapshot job (60s)
  routes.ts                  # Adicionar rotas /api/polymarket/*

client/src/
  components/
    polymarket-market-card.tsx   # Card visual para markets Polymarket
  pages/
    polymarket-detail-page.tsx   # Detalhes + gráfico histórico

shared/
  schema.ts                  # Adicionar tabelas polymarket_*

.env
  ENABLE_POLYMARKET=true     # Feature flag
  POLYMARKET_SLUGS=slug1,slug2,slug3  # 3-5 slugs escolhidos
```

---

## 📊 Schema do Banco (NOVAS TABELAS)

```typescript
// shared/schema.ts - ADICIONAR (não substituir)

export const polymarketMarkets = pgTable('polymarket_markets', {
  slug: varchar('slug').primaryKey(),
  title: text('title').notNull(),
  outcomes: jsonb('outcomes').notNull(), // [{name, percent, raw}]
  volume: numeric('volume'),
  endsAt: timestamp('ends_at'),
  lastUpdate: timestamp('last_update').defaultNow(),
});

export const polymarketSnapshots = pgTable('polymarket_snapshots', {
  id: serial('id').primaryKey(),
  slug: varchar('slug').references(() => polymarketMarkets.slug),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  outcomes: jsonb('outcomes').notNull(), // [{name, percent, raw}]
});
```

---

## 🔌 Polymarket API - Endpoints

### Gamma API (dados públicos - read-only)
- **Base URL**: `https://gamma-api.polymarket.com`
- **GET /markets/slug/:slug** → Buscar market por slug
  - Response: `{ question, outcomes: [{name, probability}], volume, end_date_iso }`
- **Sem autenticação necessária** (público)

### CLOB API (book/prices)
- **Base URL**: `https://clob.polymarket.com`
- **GET /book?token_id=:id** → Best bid/ask
  - Response: `{ best_bid, best_ask }`
- **GET /prices-history?token_id=:id** → Histórico
  - Response: `[{t, price}]`

---

## ⚙️ Configuração (.env)

```bash
# Feature Flag (on/off)
ENABLE_POLYMARKET=true

# Slugs escolhidos (3-5 mercados)
POLYMARKET_SLUGS=presidential-election-2024,bitcoin-100k-2025,ai-jobs-impact

# URLs Polymarket (públicas)
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com

# Spread aplicado (2%)
POLYMARKET_SPREAD=0.02

# Frequência snapshot (segundos)
POLYMARKET_SNAPSHOT_INTERVAL=60
```

---

## 🔧 Implementação Técnica

### 1️⃣ Cliente Polymarket (`server/polymarket-client.ts`)

```typescript
import fetch from 'node-fetch';

export interface PolymarketOutcome {
  name: string;
  percent: number; // 0-100
  raw: number;     // 0-1
}

export interface PolymarketMarket {
  slug: string;
  title: string;
  outcomes: PolymarketOutcome[];
  volume?: number;
  endsAt?: string;
}

export async function fetchMarketBySlug(slug: string): Promise<PolymarketMarket> {
  const url = `${process.env.POLYMARKET_GAMMA_URL}/markets/slug/${encodeURIComponent(slug)}`;
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`Polymarket API error: ${response.status}`);
  }
  
  const data = await response.json();
  
  // Normalizar outcomes
  const outcomes = (data.outcomes || []).map(o => ({
    name: o.name || o.ticker,
    raw: Number(o.probability || o.price || 0),
  }));
  
  // Normalizar para soma = 1
  const sum = outcomes.reduce((acc, o) => acc + o.raw, 0) || 1;
  const normalized = outcomes.map(o => ({
    name: o.name,
    percent: Number(((o.raw / sum) * 100).toFixed(1)),
    raw: o.raw / sum,
  }));
  
  return {
    slug,
    title: data.question || data.title,
    outcomes: normalized,
    volume: data.volume,
    endsAt: data.end_date_iso,
  };
}

export function applySpread(price: number, side: 'BUY' | 'SELL'): number {
  const spread = Number(process.env.POLYMARKET_SPREAD || 0.02);
  const adjusted = side === 'BUY' 
    ? price * (1 - spread)
    : price * (1 + spread);
  return Math.min(0.99, Math.max(0.01, adjusted));
}
```

### 2️⃣ Cron Job (`server/polymarket-cron.ts`)

```typescript
import cron from 'node-cron';
import { db } from './db';
import { polymarketMarkets, polymarketSnapshots } from '@db/schema';
import { fetchMarketBySlug } from './polymarket-client';

export function startPolymarketSnapshots() {
  const slugs = (process.env.POLYMARKET_SLUGS || '').split(',').filter(Boolean);
  const interval = process.env.POLYMARKET_SNAPSHOT_INTERVAL || '60';
  
  // Executar a cada X segundos
  cron.schedule(`*/${interval} * * * * *`, async () => {
    const timestamp = new Date();
    
    for (const slug of slugs) {
      try {
        const market = await fetchMarketBySlug(slug);
        
        // Upsert market
        await db.insert(polymarketMarkets)
          .values({
            slug: market.slug,
            title: market.title,
            outcomes: market.outcomes,
            volume: market.volume?.toString(),
            endsAt: market.endsAt ? new Date(market.endsAt) : null,
          })
          .onConflictDoUpdate({
            target: polymarketMarkets.slug,
            set: {
              title: market.title,
              outcomes: market.outcomes,
              volume: market.volume?.toString(),
              lastUpdate: new Date(),
            },
          });
        
        // Insert snapshot
        await db.insert(polymarketSnapshots).values({
          slug: market.slug,
          timestamp,
          outcomes: market.outcomes,
        });
        
        console.log(`[Polymarket] Snapshot saved: ${slug}`);
      } catch (error) {
        console.error(`[Polymarket] Failed to fetch ${slug}:`, error);
      }
    }
  });
}
```

### 3️⃣ Rotas API (`server/routes.ts` - ADICIONAR)

```typescript
// GET /api/polymarket/markets - Lista markets Polymarket
app.get('/api/polymarket/markets', async (req, res) => {
  try {
    const markets = await db.query.polymarketMarkets.findMany({
      orderBy: (markets, { desc }) => [desc(markets.lastUpdate)],
    });
    res.json(markets);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar mercados Polymarket' });
  }
});

// GET /api/polymarket/history/:slug - Histórico para gráficos
app.get('/api/polymarket/history/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { range = '1M' } = req.query;
    
    // Calcular intervalo
    const intervals = { '1D': 1, '1W': 7, '1M': 30, 'ALL': 365 };
    const days = intervals[range as keyof typeof intervals] || 30;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    const snapshots = await db.query.polymarketSnapshots.findMany({
      where: (snapshots, { eq, gte, and }) => 
        and(
          eq(snapshots.slug, slug),
          gte(snapshots.timestamp, since)
        ),
      orderBy: (snapshots, { asc }) => [asc(snapshots.timestamp)],
    });
    
    res.json(snapshots);
  } catch (error) {
    res.status(500).json({ error: 'Falha ao buscar histórico' });
  }
});
```

### 4️⃣ Frontend - Card Diferenciado

```tsx
// client/src/components/polymarket-market-card.tsx
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

interface Props {
  market: {
    slug: string;
    title: string;
    outcomes: Array<{ name: string; percent: number }>;
  };
  onClick: () => void;
}

export function PolymarketMarketCard({ market, onClick }: Props) {
  return (
    <Card 
      className="p-4 cursor-pointer hover-elevate active-elevate-2 border-purple-500/30"
      onClick={onClick}
      data-testid={`polymarket-card-${market.slug}`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-base font-medium line-clamp-2">{market.title}</h3>
        <Badge variant="outline" className="ml-2 shrink-0">
          <TrendingUp className="w-3 h-3 mr-1" />
          Polymarket
        </Badge>
      </div>
      
      <div className="space-y-2">
        {market.outcomes.slice(0, 2).map((outcome) => (
          <div key={outcome.name} className="flex justify-between text-sm">
            <span className="text-muted-foreground">{outcome.name}</span>
            <span className="font-mono font-semibold text-primary">
              {outcome.percent.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
```

### 5️⃣ Homepage - Exibir Ambos

```tsx
// client/src/pages/home-page.tsx - MODIFICAR
import { PolymarketMarketCard } from '@/components/polymarket-market-card';

export default function HomePage() {
  const { data: ammMarkets } = useQuery({ queryKey: ['/api/markets'] });
  const { data: polyMarkets } = useQuery({ 
    queryKey: ['/api/polymarket/markets'],
    enabled: !!import.meta.env.VITE_ENABLE_POLYMARKET, // Feature flag
  });
  
  return (
    <div className="space-y-8">
      {/* Markets AMM (atuais) */}
      <section>
        <h2 className="text-2xl font-bold mb-4">Mercados Palpites.AI</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {ammMarkets?.map(market => (
            <MarketCard key={market.id} market={market} />
          ))}
        </div>
      </section>
      
      {/* Markets Polymarket (novos) */}
      {polyMarkets && polyMarkets.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            Mercados Polymarket
            <Badge variant="secondary">Beta</Badge>
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {polyMarkets.map(market => (
              <PolymarketMarketCard 
                key={market.slug} 
                market={market}
                onClick={() => navigate(`/polymarket/${market.slug}`)}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
```

---

## 🧪 Plano de Testes E2E

```typescript
// Teste 1: Homepage exibe ambos os tipos de markets
1. [New Context] Criar browser context
2. [Browser] Navegar para / (home)
3. [Verify]
   - Seção "Mercados Palpites.AI" visível (6 cards AMM)
   - Seção "Mercados Polymarket" visível (3-5 cards)
   - Badge "Beta" ou "Polymarket" nos cards Polymarket

// Teste 2: Market Polymarket exibe histórico correto
1. [Browser] Clicar no primeiro card Polymarket
2. [Verify] Redirect para /polymarket/:slug
3. [Verify] Gráfico de histórico carregado (dados de snapshots)
4. [Verify] Odds atualizadas (spread 2% aplicado)

// Teste 3: Fallback se API cair
1. [API] Simular erro 500 da Polymarket API
2. [Browser] Navegar para /polymarket/:slug
3. [Verify] Exibe últimos dados do cache (snapshots DB)
4. [Verify] Toast "Usando dados em cache - API temporariamente indisponível"
```

---

## 📦 Dependências Necessárias

```bash
# Já instalado no projeto
✓ node-fetch (fetch API)
✓ node-cron (jobs agendados)
✓ drizzle-orm (ORM)
✓ zod (validação)

# NÃO precisa instalar nada novo! 🎉
```

---

## 🚀 Ordem de Execução (quando user pedir "execute")

1. ✅ Adicionar tabelas `polymarket_markets` e `polymarket_snapshots` no schema
2. ✅ Criar `server/polymarket-client.ts`
3. ✅ Criar `server/polymarket-cron.ts`
4. ✅ Adicionar rotas `/api/polymarket/*` no `server/routes.ts`
5. ✅ Criar componente `PolymarketMarketCard.tsx`
6. ✅ Criar página `polymarket-detail-page.tsx`
7. ✅ Modificar `home-page.tsx` (adicionar seção Polymarket)
8. ✅ Adicionar variáveis no `.env`
9. ✅ Executar `npm run db:push --force` (sync schema)
10. ✅ Restart workflow
11. ✅ Testar E2E (navegação, gráficos, cache)
12. ✅ Atualizar `replit.md` (documentar arquitetura híbrida)

---

## 🎛️ Feature Flag - Como Funciona

```bash
# .env
ENABLE_POLYMARKET=true   # Liga integração
ENABLE_POLYMARKET=false  # Desliga (volta ao MVP puro)
```

Frontend:
```tsx
const enabled = import.meta.env.VITE_ENABLE_POLYMARKET === 'true';
if (enabled) {
  // Renderizar seção Polymarket
}
```

Backend (cron):
```ts
if (process.env.ENABLE_POLYMARKET === 'true') {
  startPolymarketSnapshots();
}
```

---

## ⚠️ Riscos Identificados

1. **Uptime Polymarket API**: Se cair, usar cache local (snapshots)
2. **Latência**: Snapshots de 60s podem não ser "real-time" suficiente
3. **Slugs brasileiros**: Pode não existir na Polymarket (testar antes)
4. **Rate limiting**: API pode ter limites (monitorar)
5. **Compliance**: Não executar hedge no MVP (apenas exibir odds)

---

## 🎯 Critérios de Sucesso

- [ ] Homepage exibe 6 markets AMM + 3-5 markets Polymarket
- [ ] Gráficos históricos funcionando (dados de snapshots)
- [ ] Spread 2% aplicado corretamente
- [ ] Feature flag liga/desliga sem erros
- [ ] Cache local funciona se API cair
- [ ] E2E tests passando
- [ ] Documentação atualizada

---

## 📝 Notas Finais

- **NÃO mexer** em markets AMM, auth, portfolio, AI assistant
- **NÃO executar hedge** (apenas exibir odds)
- **NÃO integrar BRL3 Polygon** (fora do escopo MVP piloto)
- **Manter** TypeScript (não migrar para JS)
- **Preservar** design guidelines e PT-BR

---

**Status:** ⏸️ **Pronto para Execução** (aguardando comando do usuário)

**Tempo estimado:** 2-3 semanas
**Complexidade:** Média
**Risco:** Baixo (arquitetura isolada, feature flag)
