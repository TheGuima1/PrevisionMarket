# Como Ativar Integração Polymarket

## ⚠️ Importante: Variáveis de Ambiente

O Replit **NÃO** usa o arquivo `.env` diretamente. Você precisa adicionar as variáveis de ambiente via **Secrets/Environment Variables** na UI do Replit.

## 🔧 Passo a Passo

### 1. Adicionar Variáveis de Ambiente

Na sidebar do Replit, clique em **"Secrets"** (ou **"Environment Variables"**) e adicione:

```
ENABLE_POLYMARKET=true
POLYMARKET_GAMMA_URL=https://gamma-api.polymarket.com
POLYMARKET_CLOB_URL=https://clob.polymarket.com
POLYMARKET_SLUGS=fed-rate-hike-in-2025,us-recession-in-2025,fed-emergency-rate-cut-in-2025
POLYMARKET_SPREAD=0.02
POLYMARKET_SNAPSHOT_INTERVAL=60
```

### 2. Configurar Slugs

Escolha **3-5 slugs** da Polymarket (máximo 10) e adicione separados por vírgula em `POLYMARKET_SLUGS`.

**Como encontrar slugs na Polymarket:**
- Acesse https://polymarket.com
- Escolha um mercado
- O slug aparece na URL: `polymarket.com/event/SEU-SLUG-AQUI`

**Exemplos de slugs válidos (testados e ativos):**
- `fed-rate-hike-in-2025` - Taxa de juros Fed em 2025
- `us-recession-in-2025` - Recessão nos EUA em 2025
- `fed-emergency-rate-cut-in-2025` - Corte emergencial Fed 2025
- `tether-insolvent-in-2025` - Insolvência Tether 2025
- `will-any-presidential-candidate-win-outright-in-the-first-round-of-the-brazil-election` - Eleição Brasil 2026

**⚠️ IMPORTANTE**: 
- Use apenas slugs de mercados **ativos e não fechados** (active=true, closed=false)
- Consulte https://polymarket.com para ver mercados atuais
- Para verificar se um slug é válido: `curl "https://gamma-api.polymarket.com/markets?slug=SEU-SLUG"`

### 3. Restart Workflow

Após adicionar as variáveis:
1. Clique no botão **"Stop"** no workflow `Start application`
2. Clique em **"Run"** para restart
3. Verifique os logs para confirmar:
   ```
   [Polymarket Snapshot] Starting cron job (interval: 60000ms)
   [Polymarket Snapshot] Monitoring 3 markets: fed-rate-hike-in-2025, us-recession-in-2025, fed-emergency-rate-cut-in-2025
   [Polymarket Snapshot] ✓ fed-rate-hike-in-2025 - Will the Fed hike rates in 2025?
   [Polymarket Snapshot] ✓ us-recession-in-2025 - Will the US enter recession in 2025?
   ```

### 4. Verificar Funcionamento

Após ~1 minuto, acesse:
- Homepage: Deve exibir seção "Mercados Polymarket" com 3-5 cards
- API: `GET /api/polymarket/markets` deve retornar array com mercados

## 📊 Estrutura

### Backend
- `server/polymarket-client.ts`: Cliente API Polymarket
- `server/polymarket-cron.ts`: Snapshot job (60s)
- `server/routes.ts`: Rotas `/api/polymarket/*`

### Frontend
- `client/src/components/polymarket-market-card.tsx`: Card visual
- `client/src/pages/polymarket-detail-page.tsx`: Detalhes + gráfico
- `client/src/pages/home-page.tsx`: Seção Polymarket (Beta)

### Database
- `polymarket_markets`: Markets espelhados
- `polymarket_snapshots`: Snapshots históricos (60s)

## 🎯 Feature Flag

Para **desativar** a integração:
```
ENABLE_POLYMARKET=false
```

Ou simplesmente remova a variável dos Secrets.

## 🔎 Como Encontrar Slugs Válidos

### Método 1: Via curl (Recomendado)
```bash
# Listar mercados ativos
curl "https://gamma-api.polymarket.com/markets?active=true&closed=false&limit=10"

# Testar um slug específico
curl "https://gamma-api.polymarket.com/markets?slug=fed-rate-hike-in-2025"
```

Se o comando retornar um array `[]` vazio, o slug é inválido ou o mercado está fechado.

### Método 2: Via Polymarket.com
1. Acesse https://polymarket.com
2. Escolha um mercado **ativo** (verde, não resolvido)
3. Copie o slug da URL: `polymarket.com/event/SEU-SLUG-AQUI`
4. Teste com curl antes de adicionar aos Secrets

### Validação Rápida
Sempre teste seus slugs ANTES de adicionar aos Secrets:
```bash
# Se retornar dados = válido ✅
# Se retornar [] = inválido ❌
curl "https://gamma-api.polymarket.com/markets?slug=SEU-SLUG"
```

## 🔍 Troubleshooting

**Problema**: Seção Polymarket não aparece na homepage
- **Solução**: Verifique que `ENABLE_POLYMARKET=true` está nos Secrets
- **Solução**: Restart o workflow

**Problema**: API retorna array vazio
- **Solução**: Aguarde ~60s para primeiro snapshot
- **Solução**: Verifique logs: `[Polymarket Snapshot] ✓ slug-name`

**Problema**: Erro "failed to fetch market"
- **Solução**: Verifique que os slugs estão corretos (sem espaços, separados por vírgula)
- **Solução**: Slugs devem existir na Polymarket

## 📝 Notas

- **Spread**: 2% aplicado sobre preço Polymarket (configurável via `POLYMARKET_SPREAD`)
- **Snapshots**: Frequência configurável via `POLYMARKET_SNAPSHOT_INTERVAL` (segundos)
- **Cache local**: Sistema de fallback se API cair (usa último snapshot do DB)
- **MVP**: Apenas visualização - apostas não disponíveis no piloto Beta
