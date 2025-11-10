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
POLYMARKET_SLUGS=presidential-election-2024,bitcoin-100k-2025,trump-election-winner-2024
POLYMARKET_SPREAD=0.02
POLYMARKET_SNAPSHOT_INTERVAL=60
```

### 2. Configurar Slugs

Escolha **3-5 slugs** da Polymarket (máximo 10) e adicione separados por vírgula em `POLYMARKET_SLUGS`.

**Como encontrar slugs na Polymarket:**
- Acesse https://polymarket.com
- Escolha um mercado
- O slug aparece na URL: `polymarket.com/event/SEU-SLUG-AQUI`

**Exemplos de slugs:**
- `presidential-election-2024`
- `bitcoin-100k-2025`
- `trump-election-winner-2024`
- `eth-5000-2025`
- `ai-discovers-cure`

### 3. Restart Workflow

Após adicionar as variáveis:
1. Clique no botão **"Stop"** no workflow `Start application`
2. Clique em **"Run"** para restart
3. Verifique os logs para confirmar:
   ```
   [Polymarket Snapshot] Starting cron job (interval: 60000ms)
   [Polymarket Snapshot] Monitoring 3 markets: presidential-election-2024, bitcoin-100k-2025, trump-election-winner-2024
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
