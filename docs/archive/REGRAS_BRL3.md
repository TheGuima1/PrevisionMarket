# 💰 REGRAS DO TOKEN BRL3
## Moeda Interna da Plataforma Palpites.AI

**Última atualização:** 10 de Novembro de 2025  
**Versão:** 1.0 (MVP - Fase Teste)

---

## 📌 O QUE É O BRL3?

BRL3 é a **moeda interna exclusiva** da plataforma Palpites.AI, usada para apostar em mercados de previsão.

### Características Principais:

✅ **1 BRL3 = 1 Real Brasileiro** (sempre, sem exceção)  
✅ **Sem valorização** - BRL3 não rende juros nem aumenta de valor  
✅ **Sem flutuação** - O preço é fixo em R$ 1,00  
✅ **Exclusivo da plataforma** - Não pode ser negociado fora do Palpites.AI  
✅ **Conversível em reais** - Pode ser trocado por reais via PIX (processo interno)

---

## 🧪 FASE ATUAL: MVP DE TESTE

### ⚠️ IMPORTANTE - LEIA COM ATENÇÃO:

**Durante a fase de teste (MVP), o BRL3 é TOTALMENTE SIMULADO:**

- ❌ **Não há dinheiro real envolvido**
- ❌ **Depósitos são fictícios** (não gera PIX real)
- ❌ **Saques são simulados** (não transfere dinheiro real)
- ❌ **Saldo inicial é fictício** (apenas para testar a plataforma)

**Objetivo:** Testar a plataforma, encontrar bugs, validar a experiência do usuário.

**Quando haverá dinheiro real?**  
Apenas após:
1. Aprovação legal/regulatória
2. Integração PIX real
3. Implementação de KYC (validação de CPF)
4. Lastro 100% em conta bancária

---

## 📜 REGRAS TÉCNICAS DO BRL3

### 1. Paridade Fixa com Real

```
1 BRL3 = R$ 1,00 (sempre)
```

- **Não importa** quanto tempo você guarda BRL3
- **Não importa** quantas pessoas usam a plataforma
- **Não importa** se Bitcoin subir ou cair
- **1 BRL3 sempre valerá exatamente 1 real brasileiro**

### 2. Não Rende Juros

BRL3 guardado na carteira **não aumenta** com o tempo.

**Comparação:**
- Poupança: R$ 100 → R$ 100,50 após 1 mês (rende 0,5%)
- BRL3: R$ 100 → R$ 100 após 1 mês (rende 0%)

**Por que?**  
BRL3 é moeda de troca, não investimento. Ganhos vêm de **acertar previsões**, não de guardar dinheiro parado.

### 3. Não É Negociável Externamente

Você **não pode**:
- ❌ Vender BRL3 para outra pessoa fora da plataforma
- ❌ Trocar BRL3 por Bitcoin, Ethereum, etc.
- ❌ Usar BRL3 em outras plataformas
- ❌ Transferir BRL3 para carteira blockchain

Você **pode** (apenas dentro do Palpites.AI):
- ✅ Apostar BRL3 em mercados
- ✅ Resgatar BRL3 para reais via PIX (dentro da plataforma)
- ✅ Ver saldo BRL3 no portfólio

### 4. Lastro e Reservas

**No MVP (fase teste):**
- Não há lastro real (é simulado)

**Quando for dinheiro real (futuro):**
- Para cada 1 BRL3 em circulação, haverá R$ 1,00 em conta bancária
- Lastro mantido em **títulos públicos brasileiros** (Tesouro Selic)
- Dashboard público com prova de reservas
- Auditoria trimestral

---

## 💸 COMO FUNCIONA NA PRÁTICA

### Depósito (MVP - Simulado)

1. Você clica em "Depositar PIX"
2. Digita o valor (ex: R$ 100)
3. **Sistema simula** confirmação instantânea
4. Seu saldo aumenta em 100 BRL3

**No futuro (dinheiro real):**
1. Sistema gera QR Code PIX
2. Você paga com app do banco
3. Aguarda confirmação (10-30 segundos)
4. BRL3 creditado automaticamente

### Aposta

1. Escolhe um mercado (ex: "Lula 2026?")
2. Escolhe YES ou NO
3. Digita valor em BRL3 (ex: 100 BRL3)
4. Sistema aplica **spread de 2%**:
   - Você paga: 100 BRL3
   - AMM recebe: 98 BRL3 (2 BRL3 = taxa da plataforma)
5. Você recebe "shares" (quotas) do mercado

### Ganho

Se você acertar a previsão:
- Cada share vale 1 BRL3
- Exemplo: Se comprou 33.11 shares → recebe 33.11 BRL3
- Lucro = BRL3 recebido - BRL3 investido

### Saque (MVP - Simulado)

1. Vai em "Portfólio" → "Carteira"
2. Clica "Sacar"
3. Digita valor
4. **Sistema simula** saque instantâneo
5. Saldo diminui

**No futuro (dinheiro real):**
1. Informa chave PIX (CPF, email, celular)
2. Sistema valida CPF (KYC mínimo)
3. Transferência automática via PIX
4. Dinheiro na conta em segundos

---

## 🔐 SEGURANÇA DO BRL3

### Proteções Implementadas:

1. **Limite de aposta por transação:** R$ 1.000 BRL3
2. **Limite diário por usuário:** R$ 5.000 BRL3
3. **Limite de exposição por mercado:** R$ 10.000 BRL3
4. **Pausa automática em volatilidade:** Mercado pausado se preço mudar >5% em <5min
5. **Logs de auditoria:** Todas operações registradas com IP e timestamp

### O Que Acontece Se...

**...a plataforma falir?**
- (Futuro) Com lastro 100%, todos podem sacar BRL3 para reais
- (MVP teste) Não há dinheiro real envolvido

**...houver um bug que crie BRL3 do nada?**
- Sistema monitora emissão total
- Auditoria diária automática
- Qualquer anomalia dispara alerta

**...alguém hackear minha conta?**
- Use senha forte
- (Futuro) Autenticação em 2 fatores (2FA)
- Limite de saque diário reduz risco

---

## 📊 TRANSPARÊNCIA

### Informações Públicas (Dashboard):

- ✅ Total de BRL3 em circulação
- ✅ Volume total negociado
- ✅ Número de usuários ativos
- ✅ Mercados ativos vs resolvidos

### Informações Privadas (Só Admin):

- 🔒 Exposição por mercado (quanto sistema "deve" se todos ganharem)
- 🔒 Fluxo de caixa (entradas vs saídas)
- 🔒 Métricas de risco

---

## ❓ PERGUNTAS FREQUENTES

### 1. BRL3 é uma criptomoeda?

**Não.** BRL3 é um token interno da plataforma, armazenado em banco de dados PostgreSQL (não em blockchain).

**Diferenças:**
- Criptomoeda: Bitcoin, Ethereum → Descentralizada, flutuante, blockchain
- BRL3: Token interno → Centralizado, fixo R$ 1,00, banco de dados

### 2. Por que não usar direto em reais?

**Razões técnicas:**
- Facilita contabilidade interna
- Permite fracionamento (ex: 0.01 BRL3)
- Separa saldo "apostável" de dinheiro no banco

**No futuro:** BRL3 pode migrar para blockchain (ERC-20 ou similar) mantendo paridade 1:1 com real.

### 3. Posso comprar BRL3 de outra pessoa?

**Não.** BRL3 só pode ser adquirido via:
- Depósito PIX na plataforma (converte R$ → BRL3)
- Ganho em apostas (recebe BRL3 de vencedores)

### 4. BRL3 expira?

**Não.** Seu saldo BRL3 fica disponível indefinidamente (enquanto a plataforma existir).

### 5. Existe taxa para sacar BRL3?

**MVP:** Não (simulado)  
**Futuro:** Taxa de saque via PIX: R$ 2,00 fixo (independente do valor)

### 6. Qual a diferença entre BRL3 e shares?

- **BRL3:** Moeda para comprar
- **Shares:** Quotas de um mercado

**Exemplo:**
- Você tem 100 BRL3
- Compra shares do mercado "Lula 2026 YES" por 100 BRL3
- Recebe 33.11 shares
- Se Lula ganhar, suas 33.11 shares viram 33.11 BRL3
- Lucro: -66.89 BRL3 (perdeu porque pagou 100, recebeu 33.11)

### 7. BRL3 paga dividendos?

**Não.** BRL3 não gera renda passiva. Ganhos vêm apenas de apostas vencedoras.

---

## 🚀 ROADMAP DO BRL3

### Fase 1: MVP Teste (Atual)
- ✅ BRL3 simulado em banco de dados
- ✅ Depósito/saque mockado
- ✅ Spread de 2% implementado

### Fase 2: Beta Fechado (Próximos 30 dias)
- ⏳ 50 usuários de teste
- ⏳ Saldo inicial fictício de R$ 200 BRL3 por usuário
- ⏳ Validar cálculos e UX

### Fase 3: Dinheiro Real (60-90 dias)
- ⏳ Integração PIX real
- ⏳ KYC (validação de CPF)
- ⏳ Lastro 100% em títulos públicos
- ⏳ Aprovação legal/regulatória

### Fase 4: Escala (6-12 meses)
- ⏳ Migração para blockchain (ERC-20 ou L2)
- ⏳ Prova de reservas on-chain
- ⏳ Auditoria pública automática
- ⏳ Possibilidade de stake/yield (estudar regulação)

---

## 📞 SUPORTE

**Dúvidas sobre BRL3?**
- Chat com Assistente de IA (cachorro no canto da tela)
- Email: suporte@palpites.ai (quando ativo)
- FAQ: [link quando disponível]

**Reportar bug:**
- Descreva o problema detalhadamente
- Inclua prints se possível
- Informe horário e valor envolvido

---

## ⚖️ TERMOS LEGAIS (RESUMO)

Durante a fase de teste (MVP):
1. BRL3 é fictício, sem valor monetário real
2. Plataforma não se responsabiliza por "perdas" (pois não há dinheiro real)
3. Sistema pode ser reiniciado a qualquer momento (saldos zerados)
4. Dados podem ser usados para melhorias (anonimizados)

Quando houver dinheiro real:
1. Usuário deve ter 18+ anos
2. Proibido uso para lavagem de dinheiro
3. Plataforma pode solicitar KYC a qualquer momento
4. Saque limitado a R$ 10.000/dia (regulação anti-fraude)
5. Termos de uso completos devem ser aceitos

---

## 📌 RESUMO EM 3 PONTOS

1. **BRL3 = R$ 1,00** (sempre, sem exceção)
2. **Não rende, não flutua** (não é investimento)
3. **Só funciona aqui** (não negocie fora da plataforma)

**Durante MVP:** Tudo é simulado, sem dinheiro real  
**Futuro:** Dinheiro real com lastro 100% e PIX

---

**Aceito e entendo as regras do BRL3.**  
_[Checkbox para usuário aceitar no primeiro uso]_

---

**Documento mantido por:** Time Palpites.AI  
**Próxima revisão:** Antes de iniciar operação com dinheiro real
