# ✅ CHECKLIST MVP - PALPITES.AI
## Meta: Plataforma 100% Funcional até o Final do Dia

**Data:** 10 de Novembro de 2025  
**Deadline:** Hoje, final do dia  
**Status Geral:** 🟡 Em progresso (85% completo)

---

## 🎯 FUNCIONALIDADES CORE (OBRIGATÓRIAS)

### ✅ 1. AUTENTICAÇÃO & USUÁRIOS
- [x] Registro de usuário (email + senha)
- [x] Login funcional
- [x] Logout
- [x] Escolha de username único após primeiro login
- [x] Sessões persistentes (7 dias)
- [x] Proteção de rotas (requireAuth middleware)
- [x] Admin identificado (via isAdmin flag)

**Status:** ✅ **COMPLETO** - Tudo funcionando

---

### ✅ 2. MERCADOS (EXIBIÇÃO)
- [x] Homepage pública com 5 tabs (Trending, Política, Crypto, Tech, Sports)
- [x] 6 mercados seedados com liquidez R$100 cada
- [x] Cards de mercado com odds atualizadas
- [x] Página de detalhes do mercado
- [x] Cálculo correto de preços (AMM - CPMM)
- [x] Indicador "Ao Vivo" (bolinha verde pulsante)
- [x] Volume e participantes exibidos

**Status:** ✅ **COMPLETO** - Badge "Crypto" corrigido agora

---

### ✅ 3. TRADING (AMM)
- [x] Painel de trade (escolher SIM/NÃO)
- [x] Input de valor em BRL3
- [x] AMM Engine implementado (CPMM: x * y = k)
- [x] Spread de 2% aplicado corretamente
- [x] Validação de saldo antes de executar
- [x] Atualização de reservas após trade
- [x] Criação/atualização de posições
- [x] Feedback visual (toast de sucesso)

**Status:** ✅ **COMPLETO** - Matemática validada (100 BRL → 33.11 shares)

---

### 🟡 4. PORTFÓLIO
- [x] Métricas agregadas (Valor Total, Investido, P&L)
- [x] Lista de posições ativas
- [x] Cálculo correto de P&L por posição
- [x] Tab "Carteira" com saldo
- [x] Histórico de transações
- [ ] ⚠️ **PENDENTE:** Botão "Vender Posição" (fechar posição antecipadamente)

**Status:** 🟡 **95% COMPLETO** - Falta apenas funcionalidade de venda

---

### 🟡 5. DEPÓSITO & SAQUE (PIX MOCKADO)
- [x] Tela de depósito com input de valor
- [x] Mock: adiciona saldo instantaneamente
- [x] Registro de transação tipo "deposit_pix"
- [x] Tela de saque (withdraw)
- [x] Mock: reduz saldo
- [ ] ⚠️ **PENDENTE:** Integração PIX real (QR Code, webhook)

**Status:** 🟡 **MOCK COMPLETO** - Real fica para pós-MVP

---

### ✅ 6. ASSISTENTE DE IA (CACHORRO)
- [x] Widget flutuante (canto inferior direito)
- [x] Chat funcional com GPT-4
- [x] Histórico de conversa mantido
- [x] 4 ações rápidas (Explicar Odds, Como Funciona, etc.)
- [x] Respostas em PT-BR contextualizadas

**Status:** ✅ **COMPLETO** - IA respondendo corretamente

---

### 🟡 7. DISCUSSÕES (COMENTÁRIOS)
- [x] Seção de comentários por mercado
- [x] Criar novo comentário
- [x] Exibir comentários de outros usuários
- [x] Username e data exibidos
- [ ] ⚠️ **PENDENTE:** Upvote/Downvote funcional (hoje só mostra número fixo)

**Status:** 🟡 **80% COMPLETO** - Comentários funcionam, votação é placeholder

---

### ✅ 8. ADMIN PANEL
- [x] Rota protegida /admin (só admins)
- [x] Criar novo mercado
- [x] Seedar liquidez inicial (mínimo R$100)
- [x] Lista de mercados para resolver
- [x] Resolver mercado (YES/NO/CANCELLED)
- [x] Pagamento automático aos vencedores

**Status:** ✅ **COMPLETO** - Admin pode criar e resolver mercados

---

## 🐛 BUGS CONHECIDOS (CORRIGIR HOJE)

### 🔴 CRÍTICOS (Bloqueadores)
1. [ ] **Estimativa de shares imprecisa no painel de trade**
   - Problema: Mostra "~200 shares" mas usuário recebe 33.11
   - Solução: Criar endpoint `/api/orders/preview` (simula trade sem executar)
   - Impacto: Confunde usuário, gera desconfiança
   - Arquivo: `client/src/components/trade-panel.tsx` + `server/routes.ts`

### 🟡 MÉDIOS (Importantes)
2. [ ] **Mensagens de erro em inglês**
   - Problema: "Insufficient balance" aparece em inglês
   - Solução: Traduzir todos os erros no backend para PT-BR
   - Arquivo: `server/routes.ts`, `server/auth.ts`

3. [ ] **Loading state pouco claro no botão "Palpitar"**
   - Problema: Botão não mostra spinner ao processar
   - Solução: Adicionar `disabled={buyMutation.isPending}` + texto "Processando..."
   - Arquivo: `client/src/components/trade-panel.tsx`

### 🟢 BAIXOS (Melhorias)
4. [ ] **Placeholder "Mensagem a ser escrita" na homepage**
   - Problema: Texto genérico no hero
   - Solução: Escrever copy real
   - Arquivo: `client/src/pages/home-page.tsx`

5. [ ] **Favicon padrão do Vite**
   - Problema: Sem identidade visual na aba do navegador
   - Solução: Adicionar favicon.png personalizado
   - Arquivo: `client/public/favicon.png`

---

## 🚀 TESTES ESSENCIAIS (FAZER ANTES DE PUBLICAR)

### Jornada 1: Novo Usuário
- [ ] 1. Abrir homepage (sem login) → Ver mercados
- [ ] 2. Clicar "Entrar" → Criar conta nova
- [ ] 3. Escolher username → Modal funciona
- [ ] 4. Ir para /wallet/deposit → Depositar R$ 500 (mock)
- [ ] 5. Ver saldo atualizado no navbar (R$ 500,00 BRL3)

### Jornada 2: Primeira Aposta
- [ ] 6. Clicar num mercado (ex: "Lula 2026")
- [ ] 7. Escolher "SIM" no painel de trade
- [ ] 8. Digitar R$ 100 → Ver estimativa de shares
- [ ] 9. Clicar "Palpitar" → Ver toast de sucesso
- [ ] 10. Verificar saldo diminuiu (R$ 400,00)
- [ ] 11. Verificar odds mudaram (ex: 50% → 89.8%)

### Jornada 3: Portfólio
- [ ] 12. Ir para /portfolio
- [ ] 13. Ver posição criada com shares corretas
- [ ] 14. Ver P&L calculado
- [ ] 15. Ver histórico de transações (depósito + aposta)

### Jornada 4: Assistente de IA
- [ ] 16. Clicar no cachorro (canto inferior direito)
- [ ] 17. Digitar "Como funcionam as odds?"
- [ ] 18. Receber resposta em PT-BR

### Jornada 5: Admin
- [ ] 19. Logar como admin (admin@matrizpix.com / admin123)
- [ ] 20. Ir para /admin
- [ ] 21. Criar mercado novo → Seedar R$ 100
- [ ] 22. Mercado aparece na homepage
- [ ] 23. Resolver um mercado antigo → Ver resultado

---

## 📋 CHECKLIST TÉCNICO (INFRAESTRUTURA)

### Banco de Dados
- [x] PostgreSQL conectado (Neon)
- [x] Seed rodado (admin + demo + 6 mercados)
- [x] Tabelas criadas (users, markets, orders, positions, comments, transactions)
- [x] Migrations funcionando (drizzle-kit)

### Servidor
- [x] Express rodando na porta 5000
- [x] Vite servindo frontend
- [x] Sessões persistindo (connect-pg-simple)
- [x] CORS configurado
- [x] Health check endpoint (`GET /health`)

### Frontend
- [x] React + TypeScript compilando
- [x] TanStack Query configurado
- [x] Shadcn/UI componentes instalados
- [x] Tailwind CSS funcionando
- [x] Design guidelines seguidas

### Integrações
- [x] OpenAI (GPT-4) conectado
- [x] Replit AI Integrations funcionando
- [ ] ⚠️ PIX real (pendente pós-MVP)

---

## 🎨 DESIGN & UX (OPCIONAL HOJE)

### Melhorias de UX (Se Sobrar Tempo)
- [ ] Modal de confirmação após aposta ("Você recebeu X shares")
- [ ] Tutorial de onboarding para novos usuários
- [ ] Gráfico de histórico de preços (recharts)
- [ ] Animações de transição (framer-motion)
- [ ] Dark mode toggle funcional

### SEO & Meta Tags
- [ ] Title único por página
- [ ] Meta description em PT-BR
- [ ] Open Graph tags (compartilhamento social)

---

## ⏰ PLANO DE EXECUÇÃO (PRÓXIMAS 3 HORAS)

### FASE 1: Correções Críticas (1h)
1. ✅ Corrigir badge "Cripto" → "Crypto" (FEITO AGORA)
2. ⏳ Implementar `/api/orders/preview` (estimativa real de shares)
3. ⏳ Traduzir erros para PT-BR
4. ⏳ Melhorar loading state do botão "Palpitar"

### FASE 2: Testes Completos (1h)
5. ⏳ Executar todas as 5 jornadas de teste
6. ⏳ Corrigir bugs encontrados nos testes
7. ⏳ Validar cálculos de AMM com mais casos

### FASE 3: Polimento Final (1h)
8. ⏳ Trocar placeholders por copy real
9. ⏳ Adicionar favicon
10. ⏳ Testar em mobile (responsividade)
11. ⏳ Revisar mensagens de toast (PT-BR, claras)

---

## 📊 MÉTRICAS DE SUCESSO

### Mínimo Viável (OBRIGATÓRIO)
- ✅ Usuário consegue criar conta
- ✅ Usuário consegue depositar (mock)
- ✅ Usuário consegue apostar em mercado
- ✅ Odds mudam após aposta (AMM funciona)
- ✅ Portfólio mostra posições corretas
- ⚠️ **Estimativa de shares precisa** (PENDENTE)
- ✅ Admin cria e resolve mercados
- ✅ IA responde perguntas

### Desejável (BÔNUS)
- [ ] Zero erros no console do navegador
- [ ] Tempo de resposta < 500ms para trades
- [ ] Modal de confirmação pós-aposta
- [ ] Tutorial de onboarding

---

## 🚨 BLOQUEADORES ATUAIS

### 🔴 CRÍTICO #1: Estimativa de Shares Imprecisa
**Descrição:** Frontend calcula `shares = valor / preço` (linear), mas AMM real é não-linear (CPMM).  
**Exemplo:** Usuário digita R$ 100, vê "~200 shares", mas recebe apenas 33.11 shares.  
**Impacto:** Usuário se sente enganado, não entende por que recebeu menos.  
**Solução Técnica:**
- Criar endpoint `POST /api/orders/preview` que:
  - Recebe: `{marketId, type: "yes", usdcAmount: 100}`
  - Executa AMM sem salvar no banco (dry-run)
  - Retorna: `{estimatedShares: 33.11, avgPrice: 3.02, newYesOdds: 89.8%}`
- Frontend chama este endpoint ao digitar valor (debounce 500ms)
- Mostra shares reais: "Você receberá ~33.11 shares SIM"

**Prioridade:** 🔴 **MÁXIMA** - Fazer AGORA

---

### 🟡 MÉDIO #2: Mensagens de Erro em Inglês
**Descrição:** Backend retorna erros tipo "Insufficient balance" (inglês).  
**Impacto:** Usuários brasileiros não entendem.  
**Solução:** Criar objeto de traduções em `server/routes.ts`:
```typescript
const errorMessages = {
  INSUFFICIENT_BALANCE: "Saldo insuficiente. Deposite mais BRL3 via PIX.",
  EMAIL_EXISTS: "Este email já está cadastrado. Tente fazer login.",
  USERNAME_TAKEN: "O username já foi escolhido. Tente outro!",
  MARKET_CLOSED: "Este mercado já encerrou. Não é possível apostar.",
  INVALID_AMOUNT: "Digite um valor válido em reais (ex: 100.00).",
};
```

**Prioridade:** 🟡 **ALTA** - Fazer hoje

---

## ✅ STATUS FINAL ESPERADO (Final do Dia)

```
[ MVP PALPITES.AI - CHECKLIST FINAL ]

✅ Autenticação          → 100% funcional
✅ Mercados              → 100% funcional
✅ Trading (AMM)         → 100% funcional (com estimativa correta)
✅ Portfólio             → 95% funcional (falta venda de posição)
✅ Depósito/Saque (Mock) → 100% funcional
✅ Assistente IA         → 100% funcional
✅ Comentários           → 80% funcional (sem votação real)
✅ Admin Panel           → 100% funcional
✅ Todos os testes       → Passando
✅ Erros traduzidos      → PT-BR completo
✅ Design polido         → Copy real, favicon, responsivo

RESULTADO: 🟢 PLATAFORMA PRONTA PARA USO
```

---

## 🎯 PRÓXIMOS PASSOS (PÓS-MVP)

### Semana 1 Pós-MVP
1. Integração PIX real (Mercado Pago/Asaas)
2. Funcionalidade de venda de posição
3. Upvote/Downvote nos comentários
4. Gráfico de histórico de preços
5. Sistema de notificações

### Semana 2 Pós-MVP
6. Wallet USDC on-chain (blockchain)
7. Deploy em produção (domínio próprio)
8. Monitoramento (Sentry, analytics)
9. Testes automatizados (Playwright)
10. Marketing inicial

---

**Última atualização:** 10/11/2025 16:33  
**Responsável:** Você  
**Prazo Final:** HOJE, 23:59
