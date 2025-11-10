# 🎯 PLANO DE AÇÃO MVP - PALPITES.AI
## Sistema de Prediction Markets com BRL3 (Fase Teste - Sem Dinheiro Real)

**Data de Criação:** 10 de Novembro de 2025  
**Objetivo:** MVP funcional para testes internos, sem movimentação de dinheiro real  
**Duração Estimada:** Fase 1-3 em 7 dias | Fase 4-5 em 30 dias

---

## 📊 ESTADO ATUAL DO SISTEMA

### ✅ O que já temos funcionando:
- AMM proprietário (CPMM: x * y = k) 
- Spread de 2% aplicado em todas as transações
- Token BRL3 (1 BRL3 = R$ 1,00 fixo, sem valorização)
- 6 mercados seedados com R$ 100 de liquidez cada
- Sistema de autenticação completo
- Portfólio com cálculo de P&L
- Admin panel (criar/resolver mercados)
- Assistente de IA (GPT-4)
- Depósito/Saque mockado (simulado)

### ⚠️ Gaps identificados (baseado nos arquivos):
1. Falta proteção contra volatilidade extrema
2. Sem limite de exposição por mercado
3. Sem sistema de travas automáticas
4. Falta transparência sobre lastro do BRL3
5. Documentação de regras BRL3 incompleta
6. Sem dashboard de métricas de risco

---

## 🎯 DEFINIÇÃO DO MVP (FASE TESTE)

### Escopo do MVP:
**O QUE É:**
- Plataforma funcional de prediction markets
- Uso exclusivo de BRL3 (moeda interna)
- Depósitos/saques **100% mockados** (simulados)
- Usuários de teste com saldo inicial fictício
- Mercados criados manualmente pelo admin
- Resolução manual de mercados
- Spread fixo de 2% em todas as operações

**O QUE NÃO É (FICA PARA DEPOIS):**
- ❌ Integração PIX real
- ❌ Movimentação de dinheiro real
- ❌ KYC/Compliance regulatório
- ❌ Copiar odds da Polymarket (usamos AMM próprio)
- ❌ Sistema de hedge externo
- ❌ App mobile nativo
- ❌ Tokenização blockchain do BRL3

---

## 📋 FASES DO PLANO DE AÇÃO

---

## 🔵 FASE 1: ESTABILIZAÇÃO DO MVP (DIA 1-2)
**Objetivo:** Garantir que o sistema atual esteja 100% funcional e documentado

### 1.1 Correções Críticas
- [ ] **Estimativa precisa de shares** (endpoint `/api/orders/preview`)
  - Problema: Frontend mostra ~200 shares, backend executa 33.11
  - Solução: API que simula trade sem executar
  - Tempo: 1h
  - Arquivo: `server/routes.ts` + `client/src/components/trade-panel.tsx`

- [ ] **Tradução completa para PT-BR**
  - Todos os erros do backend em português
  - Mensagens de toast claras e amigáveis
  - Tempo: 30min
  - Arquivo: `server/routes.ts`, `server/auth.ts`

- [ ] **Loading states visuais**
  - Spinner em todos os botões de ação
  - Skeleton loaders onde necessário
  - Tempo: 20min

### 1.2 Documentação de Regras BRL3
- [ ] **Criar arquivo `REGRAS_BRL3.md`**
  - 1 BRL3 = 1 Real Brasileiro (fixo, sem flutuação)
  - Não rende juros, não valoriza
  - Exclusivo da plataforma (não negociável externamente)
  - No MVP: totalmente simulado (sem lastro real)
  - Futuro: lastreado em títulos públicos

- [ ] **Adicionar seção "Como Funciona" na UI**
  - Explicar BRL3 em linguagem simples
  - Modal acessível no menu
  - Tempo: 40min

### 1.3 Testes de Jornada Completa
- [ ] Jornada 1: Registro → Username → Depósito mock → Aposta → Portfólio
- [ ] Jornada 2: Admin cria mercado → Seeda liquidez → Usuário aposta
- [ ] Jornada 3: Admin resolve mercado → Vencedores recebem pagamento
- [ ] Jornada 4: Assistente IA responde perguntas sobre sistema
- [ ] Jornada 5: Saque mockado (reduz saldo)

**Entrega Fase 1:** Sistema estável, testado, documentado (2 dias)

---

## 🟢 FASE 2: PROTEÇÕES E SEGURANÇA (DIA 3-4)
**Objetivo:** Implementar travas automáticas baseadas nos documentos anexados

### 2.1 Proteção Contra Volatilidade
- [ ] **Sistema de pausa automática de mercado**
  ```typescript
  // Lógica: Se preço mudar >5% em <5 minutos → pausar mercado
  interface VolatilityCheck {
    marketId: string;
    priceChange: number; // porcentagem
    timeWindow: number; // minutos
    threshold: number; // ex: 5%
  }
  ```
  - Pausar apostas automaticamente
  - Recalcular odds
  - Só liberar após estabilização (2min sem mudança >2%)
  - Notificar admin via log
  - Tempo: 2h
  - Arquivo: Novo `server/volatility-guard.ts`

### 2.2 Limite de Exposição por Mercado
- [ ] **Trava de volume máximo**
  - Definir limite de BRL3 por mercado (ex: R$ 10.000 no MVP)
  - Bloquear novas apostas se atingir limite
  - Exibir alerta na UI: "Mercado atingiu limite de volume"
  - Tempo: 1h
  - Arquivo: `server/routes.ts` (middleware de validação)

### 2.3 Limites por Usuário
- [ ] **Trava de aposta máxima por usuário**
  - Limite por aposta: R$ 1.000 BRL3
  - Limite diário: R$ 5.000 BRL3
  - Previne apostas absurdas no teste
  - Tempo: 1h

### 2.4 Sistema de Logs Detalhados
- [ ] **Criar tabela `audit_logs`**
  ```sql
  CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_id UUID,
    action TEXT, -- 'trade', 'deposit', 'withdraw', 'market_pause'
    market_id UUID,
    details JSONB,
    ip_address TEXT,
    timestamp TIMESTAMP DEFAULT now()
  );
  ```
  - Gravar todas as operações críticas
  - Permitir auditoria futura
  - Tempo: 1h

**Entrega Fase 2:** Sistema protegido contra abusos e volatilidade (2 dias)

---

## 🟡 FASE 3: TRANSPARÊNCIA E UX (DIA 5-6)
**Objetivo:** Deixar claro que é MVP de teste, sem dinheiro real

### 3.1 Dashboard de Métricas (Admin)
- [ ] **Painel de risco em tempo real**
  - Total BRL3 em circulação
  - Exposição por mercado (quanto sistema "deve" se mercados resolverem)
  - Volume total negociado
  - Número de trades por dia
  - Usuários ativos
  - Gráfico de distribuição de apostas (YES vs NO por mercado)
  - Tempo: 3h
  - Arquivo: `client/src/pages/admin-dashboard.tsx`

### 3.2 Aviso de MVP Teste (UI)
- [ ] **Banner no topo da homepage**
  ```
  🧪 ATENÇÃO: Esta é uma versão de TESTE. Nenhum dinheiro real está envolvido.
  O saldo BRL3 é fictício e serve apenas para testar a plataforma.
  ```
  - Cor amarela, sempre visível
  - Link para "Saiba Mais" (modal com explicação)
  - Tempo: 30min

### 3.3 Página "Sobre o Sistema"
- [ ] **Criar `/about`**
  - Explicar que é MVP de testes
  - Como funciona o AMM (CPMM)
  - O que é BRL3 (moeda interna de teste)
  - Spread de 2% (por que existe)
  - Roadmap futuro (PIX real, blockchain, etc)
  - Tempo: 1h

### 3.4 Melhorias de UX
- [ ] **Modal de confirmação pós-aposta**
  - "✅ Você recebeu 33.11 shares SIM por R$ 100,00 BRL3"
  - Botão "Ver Portfólio" / "Continuar Apostando"
  - Tempo: 40min

- [ ] **Tutorial de primeiro uso**
  - Tooltips guiados após registro
  - "1️⃣ Receba BRL3 fictício → 2️⃣ Escolha mercado → 3️⃣ Aposte → 4️⃣ Veja P&L"
  - Usar biblioteca `react-joyride`
  - Tempo: 2h

**Entrega Fase 3:** Sistema transparente, UX polida, usuários sabem que é teste (2 dias)

---

## 🔴 FASE 4: PREPARAÇÃO PARA ESCALA (DIA 7-14)
**Objetivo:** Infraestrutura para sair do MVP e começar testes com dinheiro real (futuro)

### 4.1 Sistema de Convites (Beta Fechado)
- [ ] **Código de convite para registro**
  - Gerar códigos únicos
  - Rastrear quem convidou quem
  - Limite de 50 usuários no beta
  - Tempo: 2h

### 4.2 Backup e Redundância
- [ ] **Backup automático do banco**
  - Snapshot diário do PostgreSQL
  - Armazenar em cloud (AWS S3, Google Cloud Storage)
  - Script de restore testado
  - Tempo: 3h

### 4.3 Monitoramento de Erros
- [ ] **Integrar Sentry**
  - Capturar erros de frontend e backend
  - Alertas em tempo real
  - Dashboard de health
  - Tempo: 1h

### 4.4 Testes Automatizados (E2E)
- [ ] **Playwright para fluxos críticos**
  - Teste: Registro → Depósito → Aposta → Portfólio
  - Teste: Admin cria mercado → Resolve → Pagamento
  - Teste: Estimativa de shares correta
  - Tempo: 4h

**Entrega Fase 4:** Sistema robusto, monitorado, pronto para beta fechado (7 dias)

---

## 🟣 FASE 5: TRANSIÇÃO PARA DINHEIRO REAL (DIA 15-30)
**Objetivo:** Preparar integração PIX e compliance (APENAS SE APROVADO)

### 5.1 Análise Regulatória
- [ ] **Consultar advogado especializado**
  - Classificação da plataforma (jogo? bolsa? prediction market?)
  - Requisitos da CVM, Banco Central
  - Necessidade de licenças
  - Tempo: Externo

### 5.2 Integração PIX (Produção)
- [ ] **Escolher gateway de pagamento**
  - Opções: Mercado Pago, Asaas, PagSeguro, Woovi
  - Contratar plano
  - Implementar webhook de confirmação
  - Tempo: 5h

- [ ] **Fluxo real de depósito**
  - Gerar QR Code PIX
  - Aguardar confirmação (webhook)
  - Adicionar BRL3 equivalente ao saldo
  - Tempo: 3h

- [ ] **Fluxo real de saque**
  - Usuário informa chave PIX
  - Sistema valida CPF/CNPJ
  - Executa transferência automática
  - Tempo: 3h

### 5.3 KYC Mínimo
- [ ] **Validação de CPF**
  - Integração com Serasa ou similar
  - Bloquear multi-contas
  - Limite de saque sem KYC completo
  - Tempo: 4h

### 5.4 Lastro Real do BRL3
- [ ] **Conta bancária dedicada**
  - Abrir conta PJ para a plataforma
  - Depositar 100% do valor em circulação
  - Prova de reservas (dashboard público)
  - Tempo: Externo + 2h (dashboard)

**Entrega Fase 5:** Sistema pronto para operar com dinheiro real (15 dias)

---

## ⚙️ IMPLEMENTAÇÕES TÉCNICAS ESPECÍFICAS

### 1. Sistema de Pausa Automática (Volatilidade Guard)

**Arquivo:** `server/volatility-guard.ts`

```typescript
import { Pool } from 'pg';

interface PriceSnapshot {
  marketId: string;
  yesPrice: number;
  noPrice: number;
  timestamp: Date;
}

class VolatilityGuard {
  private snapshots: Map<string, PriceSnapshot[]> = new Map();
  private readonly THRESHOLD = 0.05; // 5%
  private readonly TIME_WINDOW = 5 * 60 * 1000; // 5 minutos

  checkVolatility(marketId: string, currentYesPrice: number): boolean {
    const history = this.snapshots.get(marketId) || [];
    const now = new Date();
    
    // Filtrar snapshots dos últimos 5 minutos
    const recentSnapshots = history.filter(
      s => (now.getTime() - s.timestamp.getTime()) < this.TIME_WINDOW
    );

    if (recentSnapshots.length === 0) {
      this.addSnapshot(marketId, currentYesPrice, 1 - currentYesPrice);
      return false; // Sem histórico, não pausar
    }

    const oldestPrice = recentSnapshots[0].yesPrice;
    const priceChange = Math.abs((currentYesPrice - oldestPrice) / oldestPrice);

    if (priceChange > this.THRESHOLD) {
      console.warn(`[VOLATILITY] Market ${marketId} mudou ${(priceChange*100).toFixed(2)}% em 5min`);
      return true; // PAUSAR MERCADO
    }

    this.addSnapshot(marketId, currentYesPrice, 1 - currentYesPrice);
    return false;
  }

  private addSnapshot(marketId: string, yesPrice: number, noPrice: number) {
    const history = this.snapshots.get(marketId) || [];
    history.push({
      marketId,
      yesPrice,
      noPrice,
      timestamp: new Date()
    });
    this.snapshots.set(marketId, history);
  }
}

export const volatilityGuard = new VolatilityGuard();
```

**Integração em `server/routes.ts`:**

```typescript
import { volatilityGuard } from './volatility-guard';

// Antes de executar trade
const currentYesPrice = getYesPriceFromReserves(market.yesReserve, market.noReserve);
const shouldPause = volatilityGuard.checkVolatility(marketId, currentYesPrice);

if (shouldPause) {
  await storage.updateMarket(marketId, { status: 'paused' });
  return res.status(503).json({
    error: 'Mercado temporariamente pausado devido a alta volatilidade. Tente novamente em alguns minutos.'
  });
}
```

---

### 2. Limite de Exposição por Mercado

**Adicionar coluna `max_exposure` na tabela `markets`:**

```sql
ALTER TABLE markets ADD COLUMN max_exposure NUMERIC DEFAULT 10000.00;
```

**Validação em `server/routes.ts`:**

```typescript
// Antes de executar trade
const totalExposure = parseFloat(market.totalVolume);
const maxExposure = parseFloat(market.maxExposure || '10000');

if (totalExposure + parseFloat(usdcAmount) > maxExposure) {
  return res.status(400).json({
    error: `Mercado atingiu limite de volume (R$ ${formatBRL3(maxExposure)}). Não é possível aceitar mais apostas no momento.`
  });
}
```

---

### 3. Dashboard de Métricas (Admin)

**Arquivo:** `client/src/pages/admin-dashboard.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Metrics {
  totalBRL3InCirculation: number;
  totalVolume: number;
  activeUsers: number;
  marketsActive: number;
  marketsPaused: number;
  exposureByMarket: {
    marketId: string;
    title: string;
    potentialPayout: number; // Quanto sistema deve se todos ganharem
  }[];
}

export default function AdminDashboard() {
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['/api/admin/metrics']
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard de Risco</h1>
      
      <div className="grid grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">BRL3 em Circulação</div>
          <div className="text-2xl font-bold">{formatBRL3(metrics?.totalBRL3InCirculation || 0)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Volume Total</div>
          <div className="text-2xl font-bold">{formatBRL3(metrics?.totalVolume || 0)}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Usuários Ativos</div>
          <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
        </Card>
        
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Mercados Ativos</div>
          <div className="text-2xl font-bold">
            {metrics?.marketsActive || 0}
            {(metrics?.marketsPaused || 0) > 0 && (
              <Badge variant="destructive" className="ml-2">
                {metrics?.marketsPaused} pausados
              </Badge>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-xl font-semibold mb-4">Exposição por Mercado</h2>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left p-2">Mercado</th>
              <th className="text-right p-2">Pagamento Potencial</th>
            </tr>
          </thead>
          <tbody>
            {metrics?.exposureByMarket.map(exp => (
              <tr key={exp.marketId} className="border-b">
                <td className="p-2">{exp.title}</td>
                <td className="text-right p-2 font-mono">{formatBRL3(exp.potentialPayout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
```

**Backend endpoint em `server/routes.ts`:**

```typescript
app.get('/api/admin/metrics', requireAdmin, async (req, res) => {
  const metrics = await storage.getAdminMetrics();
  res.json(metrics);
});
```

---

## 📊 CRONOGRAMA VISUAL

```
SEMANA 1 (MVP TESTE - SEM DINHEIRO REAL)
├─ Dia 1-2: Fase 1 - Estabilização ✅
│   ├─ Correções críticas
│   ├─ Documentação BRL3
│   └─ Testes de jornada
│
├─ Dia 3-4: Fase 2 - Proteções 🛡️
│   ├─ Volatility guard
│   ├─ Limites de exposição
│   └─ Audit logs
│
├─ Dia 5-6: Fase 3 - Transparência 📢
│   ├─ Dashboard admin
│   ├─ Avisos de teste
│   └─ UX melhorada
│
└─ Dia 7: Review e Testes Finais ✅

SEMANA 2 (PREPARAÇÃO PARA ESCALA)
├─ Dia 8-10: Fase 4 - Infraestrutura 🏗️
│   ├─ Sistema de convites
│   ├─ Backups
│   └─ Monitoramento
│
└─ Dia 11-14: Beta Fechado com Usuários Reais 👥
    └─ 50 usuários de teste

SEMANA 3-4 (TRANSIÇÃO - SE APROVADO)
└─ Dia 15-30: Fase 5 - Dinheiro Real 💰
    ├─ Análise legal
    ├─ Integração PIX
    ├─ KYC
    └─ Lastro real BRL3
```

---

## ✅ CHECKLIST DE VALIDAÇÃO ANTES DE CADA FASE

### Antes de Fase 1 → Fase 2:
- [ ] Todos os testes de jornada passando
- [ ] Zero erros no console do navegador
- [ ] Documentação BRL3 revisada
- [ ] Estimativa de shares precisa

### Antes de Fase 2 → Fase 3:
- [ ] Volatility guard testado (simular mudança brusca de preço)
- [ ] Limites de exposição funcionando
- [ ] Logs de auditoria gravando todas operações

### Antes de Fase 3 → Fase 4:
- [ ] Dashboard admin mostrando métricas corretas
- [ ] Banner de teste visível
- [ ] Tutorial de onboarding funcionando

### Antes de Fase 4 → Fase 5:
- [ ] Sentry capturando erros
- [ ] Backups automáticos rodando
- [ ] Testes E2E passando
- [ ] 50 usuários de beta testaram com sucesso

### Antes de Go-Live com Dinheiro Real:
- [ ] Aprovação legal/regulatória
- [ ] PIX testado em sandbox
- [ ] KYC validado com CPFs reais de teste
- [ ] Lastro de 100% do BRL3 em conta bancária
- [ ] Seguro ou garantia legal contratada
- [ ] Termo de uso assinado por todos usuários

---

## 🚨 RISCOS E MITIGAÇÕES

| Risco | Probabilidade | Impacto | Mitigação |
|-------|--------------|---------|-----------|
| **Usuários confundirem teste com dinheiro real** | Alta | Crítico | Banner permanente, avisos em TODAS as telas |
| **Bug no AMM causando perdas** | Média | Alto | Testes automatizados, limites de exposição |
| **Volatilidade extrema** | Média | Médio | Volatility guard, pausa automática |
| **Problema legal/regulatório** | Alta | Crítico | Consultar advogado ANTES de ir para dinheiro real |
| **Fraude/multi-contas** | Média | Médio | KYC, validação de CPF, limite por usuário |
| **Falta de liquidez** | Baixa | Médio | Admin seed mínimo de R$ 100 por mercado |

---

## 💡 RECOMENDAÇÕES BASEADAS NOS ARQUIVOS

### ✅ Usar do arquivo 1 (Prompt Polymarket):
1. ✅ **Spread fixo de 2%** - JÁ IMPLEMENTADO
2. ✅ **Token BRL3 sem valorização** - JÁ IMPLEMENTADO
3. ✅ **Proteção contra volatilidade** - IMPLEMENTAR FASE 2
4. ✅ **Limite de exposição** - IMPLEMENTAR FASE 2
5. ✅ **Documentação clara de regras BRL3** - IMPLEMENTAR FASE 1
6. ✅ **Sistema de logs detalhados** - IMPLEMENTAR FASE 2

### ❌ NÃO usar do arquivo 1:
1. ❌ **Copiar odds da Polymarket** - Nosso AMM próprio é melhor (mais controle)
2. ❌ **Hedge na Polymarket** - Desnecessário no MVP teste
3. ❌ **Tokenização blockchain** - Complexo demais para MVP

### ✅ Usar do arquivo 2 (Código):
1. ✅ **Estrutura de tabelas SQL** - Já temos equivalente no Drizzle
2. ✅ **Sistema de resolução** - JÁ IMPLEMENTADO
3. ✅ **Registro de trades** - JÁ IMPLEMENTADO

### ❌ NÃO usar do arquivo 2:
1. ❌ **Reescrever em arquitetura diferente** - Sistema atual funciona bem
2. ❌ **Google Sheets como banco** - PostgreSQL é muito melhor

---

## 🎯 DECISÕES ARQUITETURAIS CHAVE

### 1. AMM Próprio vs Copiar Polymarket
**DECISÃO:** Manter AMM próprio (CPMM)  
**JUSTIFICATIVA:**
- Mais controle sobre preços
- Não depende de API externa
- Funciona offline
- Já está implementado e testado

### 2. BRL3: Token Interno vs Stablecoin Blockchain
**DECISÃO:** Token interno (banco de dados)  
**JUSTIFICATIVA:**
- Mais simples para MVP
- Sem custos de gas fees
- Controle total
- Pode evoluir para blockchain depois

### 3. Spread: Fixo vs Dinâmico
**DECISÃO:** Fixo 2% no MVP  
**JUSTIFICATIVA:**
- Previsível para usuários
- Fácil de calcular
- Pode ajustar depois baseado em dados reais

### 4. Liquidez: Seedada vs Order Book
**DECISÃO:** Seedada (AMM)  
**JUSTIFICATIVA:**
- Garante liquidez desde o início
- Não precisa esperar compradores/vendedores
- Preços sempre disponíveis

---

## 📈 MÉTRICAS DE SUCESSO DO MVP

### Fase 1-3 (MVP Teste):
- [ ] 50 usuários de teste registrados
- [ ] 200+ apostas executadas
- [ ] 6+ mercados ativos simultaneamente
- [ ] Zero bugs críticos reportados
- [ ] Tempo médio de resposta < 500ms
- [ ] 100% das jornadas críticas funcionando

### Fase 4 (Beta Fechado):
- [ ] 90% dos usuários entendem que é teste
- [ ] 0 reclamações sobre "perdi dinheiro real"
- [ ] Taxa de conclusão de aposta: >80%
- [ ] NPS (Net Promoter Score): >50

### Fase 5 (Preparação Real):
- [ ] Aprovação legal obtida
- [ ] Integração PIX testada com sucesso
- [ ] 100% de lastro em conta bancária
- [ ] Zero fraudes detectadas no beta

---

## 🔄 PRÓXIMOS PASSOS IMEDIATOS (HOJE)

### Prioridade 1 (Fazer AGORA - 2h):
1. ✅ Corrigir badge "Crypto" - FEITO
2. ⏳ Implementar `/api/orders/preview` (estimativa real)
3. ⏳ Traduzir erros para PT-BR
4. ⏳ Criar arquivo `REGRAS_BRL3.md`

### Prioridade 2 (Amanhã - 4h):
5. ⏳ Implementar Volatility Guard
6. ⏳ Adicionar limites de exposição
7. ⏳ Criar audit_logs table

### Prioridade 3 (Esta Semana - 8h):
8. ⏳ Dashboard de métricas admin
9. ⏳ Banner de aviso de teste
10. ⏳ Tutorial de onboarding

---

## 📞 PONTOS DE DECISÃO CRÍTICOS

**ANTES DE PROSSEGUIR, VOCÊ PRECISA DECIDIR:**

1. **Quando sair do teste para dinheiro real?**
   - Opção A: Nunca (ficar só teste/simulação)
   - Opção B: Após 30 dias de beta fechado
   - Opção C: Após aprovação legal

2. **Quanto investir inicialmente como lastro?**
   - Sugestão: R$ 10.000 para beta com 50 usuários
   - Cada usuário recebe R$ 200 BRL3 inicial

3. **Modelo de negócio:**
   - Spread de 2% é suficiente para cobrir custos?
   - Previsão: 1.000 apostas/mês × R$ 100 média × 2% = R$ 2.000/mês
   - Isso cobre servidor, legal, marketing?

---

## ✅ CONCLUSÃO

**PLANO RECOMENDADO:**

### Curto Prazo (7 dias):
✅ Executar Fases 1-3  
✅ MVP estável, protegido, transparente  
✅ 50 usuários de teste  
✅ **SEM DINHEIRO REAL**

### Médio Prazo (30 dias):
✅ Executar Fase 4  
✅ Beta fechado  
✅ Coletar feedback  
✅ Validar viabilidade econômica

### Longo Prazo (60-90 dias):
❓ **DECISÃO:** Ir para dinheiro real?  
Se SIM → Executar Fase 5  
Se NÃO → Manter como simulação/educacional

---

**Última atualização:** 10/11/2025 16:45  
**Próxima revisão:** Após completar Fase 1  
**Responsável:** Time Palpites.AI
