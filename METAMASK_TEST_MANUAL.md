# Procedimento de Teste Manual - MetaMask Integration

## Pré-requisitos
- Extensão MetaMask instalada no navegador (Chrome, Firefox, Brave)
- Conta admin configurada no sistema
- Senha admin (`ADMIN_PASSWORD` secret) disponível
- Rede Polygon Mainnet configurada no MetaMask
- Tokens BRL3 disponíveis na carteira admin (opcional para teste de burn)

## Limitações Técnicas de Teste Automatizado
**Por que não há teste E2E automatizado para MetaMask?**
- Playwright não pode interagir com extensões de navegador
- MetaMask roda em contexto isolado que testes automatizados não acessam
- Popups de aprovação do MetaMask não são detectáveis pelo Playwright
- **Solução**: Teste manual é a única forma confiável de validar a integração completa

## 🧪 Teste 1: Detecção de Iframe (Estado: iframe-blocked)

### Objetivo
Validar que o sistema detecta automaticamente quando está rodando em iframe do Replit e mostra mensagem apropriada.

### Passos
1. Acesse a aplicação através do iframe do Replit (visualização padrão)
2. Faça login com senha admin
3. Navegue para `/admin`
4. Clique na aba **"Blockchain (MetaMask)"**

### Resultado Esperado
✅ Alerta amarelo aparece com ícone de alerta:
```
MetaMask não funciona em iframe
Para usar o MetaMask, você precisa abrir esta página em uma nova aba do navegador.
[Botão: Abrir em Nova Aba]
```
✅ Campos de mint/burn estão desabilitados
✅ Botão "Conectar MetaMask" não aparece (bloqueado por iframe)

---

## 🧪 Teste 2: Detecção de MetaMask Não Instalado (Estado: not-installed)

### Objetivo
Validar detecção quando MetaMask não está instalado.

### Passos
1. Use navegador SEM extensão MetaMask instalada (ou desabilite temporariamente)
2. Abra aplicação em nova aba (fora do iframe)
3. Faça login como admin
4. Navegue para `/admin` → aba "Blockchain (MetaMask)"

### Resultado Esperado
✅ Alerta vermelho aparece:
```
MetaMask não está instalado
Instale a extensão MetaMask no seu navegador e recarregue esta página.
[Botão: Instalar MetaMask]
```
✅ Campos de mint/burn desabilitados

---

## 🧪 Teste 3: MetaMask Bloqueado (Estado: locked)

### Objetivo
Validar detecção quando MetaMask está instalado mas bloqueado.

### Passos
1. Instale MetaMask e faça logout/lock da carteira
2. Abra aplicação em nova aba
3. Faça login como admin
4. Navegue para `/admin` → aba "Blockchain (MetaMask)"

### Resultado Esperado
✅ Alerta amarelo:
```
MetaMask está bloqueado
Abra a extensão MetaMask e desbloqueie sua carteira.
```
✅ Campos desabilitados até desbloquear

---

## 🧪 Teste 4: Conexão Manual (Estado: needs-approval → ready)

### Objetivo
Validar fluxo de conexão manual do MetaMask.

### Passos
1. MetaMask instalado e desbloqueado, mas não conectado
2. Abra aplicação em nova aba
3. Login como admin → `/admin` → aba "Blockchain (MetaMask)"
4. **Clique no botão "Conectar MetaMask"**
5. Aprove no popup do MetaMask

### Resultado Esperado
✅ Popup do MetaMask abre solicitando permissão
✅ Após aprovação, status muda para "ready"
✅ Card verde mostra:
```
Conectado: 0x1234...5678
Saldo BRL3: 100.0 BRL3
```
✅ Campos de mint/burn ficam habilitados

---

## 🧪 Teste 5: Rede Incorreta (Estado: wrong-network)

### Objetivo
Validar detecção e troca de rede.

### Passos
1. MetaMask conectado mas em outra rede (Ethereum Mainnet, Goerli, etc)
2. Conecte MetaMask à aplicação
3. Observe o alerta de rede incorreta
4. **Clique em "Trocar para Polygon"**

### Resultado Esperado
✅ Alerta amarelo:
```
Rede incorreta
Você está conectado, mas precisa mudar para a rede Polygon Mainnet.
[Botão: Trocar para Polygon]
```
✅ Ao clicar no botão, popup MetaMask solicita troca de rede
✅ Após trocar, status muda para "ready"
✅ Toast: "Conectado à Polygon - Rede correta!"

---

## 🧪 Teste 6: Mint Manual (Aba Blockchain)

### Objetivo
Validar mint manual de tokens fora do fluxo de depósito.

### Passos
1. MetaMask conectado e na rede Polygon
2. Aba "Blockchain (MetaMask)"
3. Na seção **"Mintar Tokens"**:
   - Digite quantidade: `100.00`
   - Clique em **"Mintar via MetaMask"**
4. Aprove transação no popup MetaMask

### Resultado Esperado
✅ Toast: "Aguardando confirmação - Confirme a transação no MetaMask..."
✅ Popup MetaMask abre mostrando:
   - To: `[BRL3_CONTRACT_ADDRESS]`
   - Function: `mint`
   - Amount: 100000000000000000000 (100 BRL3 com 18 decimais)
✅ Após confirmar:
   - Toast: "Transação enviada - Hash: 0x1234..."
   - Aguarda 1 bloco de confirmação
   - Toast: "Mint realizado com sucesso! ✅ - 100 BRL3 mintados no bloco #XXXXX"
✅ Saldo BRL3 atualiza automaticamente
✅ Link para Polygonscan aparece na seção "Última Transação"

### Possíveis Erros
❌ "Você não tem permissão para mintar tokens (precisa de MINTER_ROLE)"
   → Admin wallet não tem MINTER_ROLE no contrato BRL3
   → Verificar permissões no contrato com owner

---

## 🧪 Teste 7: Burn Manual (Aba Blockchain)

### Objetivo
Validar burn manual de tokens.

### Passos
1. Certifique-se de ter saldo BRL3 (execute Teste 6 primeiro)
2. Na seção **"Queimar Tokens"**:
   - Digite quantidade: `50.00`
   - Clique em **"Queimar via MetaMask"**
3. Aprove no MetaMask

### Resultado Esperado
✅ Popup MetaMask mostra burn de 50 BRL3
✅ Toast: "Burn realizado com sucesso! ✅ - 50 BRL3 queimados no bloco #XXXXX"
✅ Saldo BRL3 diminui em 50

### Possíveis Erros
❌ "Saldo insuficiente de BRL3 para queimar"
   → Tentou queimar mais tokens do que possui

---

## 🧪 Teste 8: Aprovação de Depósito (Workflow Completo)

### Objetivo
Validar workflow completo: usuário deposita → admin aprova → tokens mintados → saldo creditado.

### Pré-requisitos
- Pelo menos 1 depósito pendente no sistema
- Admin conectado ao MetaMask na rede Polygon

### Passos
1. Aba **"Depósitos"** do admin
2. Identifique um depósito pendente (ex: usuário "joao", R$ 100,00)
3. **Clique em "APROVAR → Mint via MetaMask"**
4. Aprove transação no MetaMask popup
5. Aguarde confirmação blockchain

### Resultado Esperado
✅ Toast: "🔄 Iniciando mint... - Aguarde a janela do MetaMask abrir"
✅ Popup MetaMask abre mostrando mint de 100 BRL3 para admin wallet
✅ Após confirmar e aguardar 1 bloco:
   - Toast: "Depósito aprovado! ✅ - 100 BRL3 mintados e creditados ao usuário. TX: 0x1234..."
   - Status do depósito muda para "approved"
   - Saldo do usuário "joao" aumenta em R$ 100,00 (no banco de dados)
   - Saldo BRL3 do admin aumenta em 100 tokens (na blockchain)
   - Registro criado na tabela `transactions` com txHash

### Arquitetura Híbrida (Importante!)
- **Admin MetaMask wallet**: Recebe tokens BRL3 físicos na blockchain
- **Usuário app balance**: Recebe crédito virtual no banco de dados
- Admin **não transfere** BRL3 para usuário - isso é intencional!
- Usuário opera apenas com saldo virtual, sem carteira cripto

---

## 🧪 Teste 9: Aprovação de Saque (Workflow Completo)

### Objetivo
Validar workflow: usuário solicita saque → admin aprova → tokens queimados → saldo deduzido.

### Pré-requisitos
- Pelo menos 1 saque pendente
- Admin com saldo BRL3 suficiente para queimar

### Passos
1. Aba **"Saques"** do admin
2. Identifique saque pendente (ex: usuário "maria", R$ 50,00, PIX: 11987654321)
3. **Clique em "APROVAR → Burn via MetaMask"**
4. Aprove burn no MetaMask
5. Aguarde confirmação

### Resultado Esperado
✅ Toast: "🔄 Iniciando burn... - Aguarde a janela do MetaMask abrir"
✅ Popup MetaMask mostra burn de 50 BRL3 do admin wallet
✅ Após confirmar:
   - Toast: "Saque aprovado! ✅ - 50 BRL3 queimados e deduzidos do usuário. TX: 0x1234..."
   - Status do saque muda para "approved"
   - Saldo do usuário "maria" diminui em R$ 50,00 (banco de dados)
   - Saldo BRL3 do admin diminui em 50 tokens (blockchain)
   - Admin deve processar PIX manualmente via banco (fora do sistema)

---

## 🧪 Teste 10: Event Listeners (Mudanças de Conta/Rede)

### Objetivo
Validar que o sistema detecta mudanças no MetaMask em tempo real.

### Teste 10.1: Mudança de Conta
1. Conectado ao MetaMask com conta A
2. Abra extensão MetaMask
3. Troque para conta B
4. **Resultado**: UI atualiza automaticamente mostrando nova conta
5. Saldo BRL3 atualiza para saldo da conta B

### Teste 10.2: Mudança de Rede
1. Conectado na Polygon
2. Troque para Ethereum Mainnet via MetaMask
3. **Resultado**: 
   - Toast: "Rede incorreta - Por favor, conecte à rede Polygon Mainnet"
   - Status muda para "wrong-network"
   - Alerta amarelo aparece com botão "Trocar para Polygon"
4. Volte para Polygon
5. **Resultado**:
   - Toast: "Conectado à Polygon - Rede correta!"
   - Status muda para "ready"

### Teste 10.3: Disconnect
1. Conectado ao MetaMask
2. Vá em MetaMask → Connected Sites → Desconecte o site
3. **Resultado**:
   - Toast: "MetaMask desconectado - Sua carteira foi desconectada"
   - Status volta para "needs-approval"
   - Botão "Conectar MetaMask" reaparece

---

## 🧪 Teste 11: Tratamento de Erros

### Teste 11.1: Transação Cancelada
1. Inicie mint ou burn
2. **Cancele** no popup MetaMask (clique "Reject")
3. **Resultado**: Toast: "Você cancelou a transação no MetaMask"

### Teste 11.2: Solicitação Pendente
1. Inicie mint
2. **Não aprove nem rejeite** o popup
3. Tente iniciar outro mint
4. **Resultado**: Toast: "Já existe uma solicitação pendente no MetaMask. Aprove ou rejeite a solicitação atual."

### Teste 11.3: Saldo Insuficiente (Burn)
1. Tente queimar mais BRL3 do que possui
2. **Resultado**: Toast: "Saldo insuficiente de BRL3 tokens para queimar"

### Teste 11.4: Permissão Negada (Mint sem MINTER_ROLE)
1. Tente mintar com wallet que não tem MINTER_ROLE
2. **Resultado**: Toast: "Você não tem permissão para mintar tokens (precisa de MINTER_ROLE)"

---

## ✅ Checklist de Validação Completa

- [ ] Iframe detection funciona
- [ ] Not-installed detection funciona  
- [ ] Locked detection funciona
- [ ] Botão "Conectar MetaMask" abre popup de conexão
- [ ] Wrong-network detection e botão de troca funcionam
- [ ] Mint manual funciona com atualização de saldo
- [ ] Burn manual funciona com dedução de saldo
- [ ] Aprovação de depósito: mint → backend confirma → saldo creditado
- [ ] Aprovação de saque: burn → backend confirma → saldo deduzido
- [ ] Event listeners detectam mudança de conta
- [ ] Event listeners detectam mudança de rede
- [ ] Event listeners detectam disconnect
- [ ] Erros são tratados com mensagens específicas
- [ ] Links para Polygonscan funcionam
- [ ] UI atualiza em tempo real após transações

---

## 📝 Notas de Arquitetura

### Por que Admin Wallet Recebe os Tokens?
O sistema usa modelo **híbrido**:
- **Blockchain (Polygon)**: Admin wallet detém tokens BRL3 físicos como garantia
- **Database (PostgreSQL)**: Usuários têm saldo virtual em BRL
- Usuários **não têm carteiras cripto** - operam apenas com saldo interno
- Admin **não transfere** tokens para usuários na blockchain
- Depósito: PIX → Admin minta BRL3 para si → Usuário ganha saldo DB
- Saque: Usuário perde saldo DB → Admin queima BRL3 → Admin envia PIX

### Segurança
- Rotas `/api/deposits/:id/confirm-mint` e `/api/withdrawals/:id/confirm-burn` protegidas com `requireAuth` + `requireAdmin`
- Apenas admin pode aprovar depósitos/saques
- Transações blockchain são imutáveis e rastreáveis via txHash
- Balance validation no backend previne saque > saldo

### Performance
- MetaMask transactions aguardam apenas 1 bloco de confirmação (≈2 segundos na Polygon)
- Event listeners não fazem polling - usam eventos nativos do MetaMask
- Balance refresh automático após transações bem-sucedidas
