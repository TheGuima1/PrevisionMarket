# Guia de Configuração - Integração Polygon BRL3

## 📋 Informações Necessárias

Para ativar a integração Polygon, você precisará fornecer as seguintes informações:

### 1. Variáveis de Ambiente Obrigatórias

#### Backend (Server-side)

Adicione estas variáveis ao arquivo `.env` ou use o Secrets Manager do Replit:

```bash
# URL do provedor RPC da Polygon
# Pode usar serviços como Alchemy, Infura, QuickNode, ou endpoint público
POLYGON_RPC_URL=https://polygon-rpc.com

# Chave privada da carteira do administrador (hex format, com ou sem 0x)
# ATENÇÃO: Mantenha esta chave EXTREMAMENTE segura! Ela controla os fundos do admin
ADMIN_PRIVATE_KEY=0xSUA_CHAVE_PRIVADA_AQUI

# Endereço do contrato ERC-20 do token BRL3 já implantado na Polygon
TOKEN_CONTRACT_ADDRESS=0xENDERECO_DO_CONTRATO_BRL3

# Número de decimais do token (geralmente 18)
TOKEN_DECIMALS=18
```

#### Frontend (Client-side)

**IMPORTANTE:** Estas variáveis precisam ter prefixo `VITE_` para serem acessíveis no frontend.
Adicione também ao `.env`:

```bash
# Endereço do contrato BRL3 (mesma que TOKEN_CONTRACT_ADDRESS, mas para frontend)
VITE_TOKEN_CONTRACT_ADDRESS=0xENDERECO_DO_CONTRATO_BRL3

# Endereço da carteira admin (pública, não é a chave privada!)
VITE_ADMIN_ADDRESS=0xENDERECO_PUBLICO_ADMIN

# Número de decimais do token (mesmo valor que TOKEN_DECIMALS)
VITE_TOKEN_DECIMALS=18
```

**Nota de Segurança:** As variáveis `VITE_*` são expostas no frontend e visíveis por qualquer usuário. 
Por isso, use apenas endereços públicos, NUNCA chaves privadas!

### 2. Requisitos do Contrato BRL3

O contrato na Polygon **DEVE** implementar:

✅ **ERC20Permit (EIP-2612)** - Para assinaturas gasless  
✅ **ERC20Burnable** - Para queima de tokens  
✅ **Função `mint(address, uint256)`** - Para emissão de tokens

Se o contrato atual não suporta estas funções, será necessário:
- Atualizar o contrato (se upgradeable)
- OU implantar novo contrato compatível com OpenZeppelin's ERC20, ERC20Permit, ERC20Burnable

---

## 🔧 Etapas Manuais de Configuração

### Etapa 1: Obter URL RPC da Polygon

**Opção A - Provedor Gerenciado (Recomendado)**
1. Crie conta em [Alchemy](https://www.alchemy.com/) ou [Infura](https://www.infura.io/)
2. Crie novo app para **Polygon Mainnet**
3. Copie a URL RPC (ex: `https://polygon-mainnet.g.alchemy.com/v2/SEU_API_KEY`)

**Opção B - RPC Público (Não recomendado para produção)**
```
https://polygon-rpc.com
```

### Etapa 2: Preparar Carteira Admin

1. **Crie uma nova carteira Polygon** (NUNCA use carteira pessoal/principal)
   - Use MetaMask, Trust Wallet, ou hardware wallet
   - Anote a chave privada com MÁXIMA SEGURANÇA

2. **Financie a carteira com MATIC**
   - Necessário para pagar gas das transações
   - Recomendado: mínimo 10 MATIC para começar
   - Monitore saldo regularmente

3. **Configure permissões no contrato BRL3**
   - Carteira admin DEVE ter role `MINTER_ROLE` (para mint)
   - Verifique no Polygonscan se o endereço tem permissões

### Etapa 3: Atualizar ABI do Contrato

1. Acesse o contrato no [Polygonscan](https://polygonscan.com/)
2. Vá em aba **Contract** → **Code** → **Contract ABI**
3. Copie o ABI completo
4. Substitua o conteúdo de `server/tokenABI.json` pelo ABI real

**Importante:** O ABI fornecido atualmente é um exemplo mínimo. Use o ABI completo do seu contrato.

### Etapa 4: Configurar Variáveis de Ambiente no Replit

1. Vá em **Tools** → **Secrets** no Replit
2. Adicione cada variável:
   ```
   POLYGON_RPC_URL = sua_url_rpc
   ADMIN_PRIVATE_KEY = sua_chave_privada
   TOKEN_CONTRACT_ADDRESS = endereco_contrato
   TOKEN_DECIMALS = 18
   ```

3. **NUNCA** adicione essas informações no código ou commit no git!

### Etapa 5: Reiniciar Aplicação

Após configurar as variáveis:
```bash
npm run dev
```

Verifique os logs de startup:
```
✓ Polygon integration enabled - Contract: 0xABC...
```

Se aparecer warning `⚠️ Polygon integration disabled`, revise as variáveis.

---

## 👥 Configuração de Usuários

### Cada Usuário Precisa Configurar Carteira Polygon

1. **Adicionar campo no perfil** (TODO - implementar UI):
   - Input para `walletAddress` 
   - Validação: deve ser endereço Ethereum válido (0x...)
   - Salvar no banco: campo `users.walletAddress`

2. **Usuários sem carteira configurada**:
   - Depósitos BRL serão **REJEITADOS** pelo admin
   - Saques BRL serão **BLOQUEADOS**
   - Erro: "Usuário não possui carteira Polygon configurada"

3. **Orientações para usuários**:
   - Criar carteira com MetaMask
   - Copiar endereço público (não a chave privada!)
   - Adicionar Polygon Mainnet (ChainID: 137)
   - Configurar endereço no perfil

---

## 🔄 Fluxos Operacionais

### Fluxo de Depósito (DUAL MINT)

**1. Usuário** solicita depósito (upload comprovante PIX)  
**2. Admin** aprova depósito no painel admin  
**3. Backend** executa automaticamente:
   ```
   → mintDual(userAddress, amount)
   → Minta tokens para carteira do usuário (na Polygon)
   → Minta mesma quantidade para carteira do admin
   → Atualiza saldo local (balanceBrl)
   ```
**4. Usuário** vê saldo BRL atualizado instantaneamente

✅ **Transações on-chain:** 2 txs de mint (gas pago pelo admin)

### Fluxo de Saque (DUAL BURN com Permit Gasless)

**1. Usuário** solicita saque:
   - Preenche valor e chave PIX
   - **MetaMask abre** para assinar permit (sem pagar gas!)
   - Assinatura (v, r, s, deadline) é salva no banco

**2. Admin** aprova saque no painel

**3. Backend** executa automaticamente:
   ```
   → permit(userAddress, adminAddress, amount, deadline, v, r, s)
   → transferFrom(userAddress, adminAddress, amount)
   → burn(amount) da carteira admin
   → burn(amount) da carteira admin (segunda vez)
   → Atualiza saldo local (balanceBrl)
   ```

**4. Admin** realiza PIX manual para chave do usuário

✅ **Transações on-chain:** 4 txs total (todas pagas pelo admin, usuário não paga gas!)  
✅ **Usuário assina:** 1 assinatura off-chain (gratuita)

---

## ⚠️ Limitações Atuais

### Rotas Legadas Desabilitadas

1. **`POST /api/wallet/withdraw` (saque direto)** - HTTP 410 Gone
   - Motivo: Não possui assinatura permit
   - Ação: Use `/api/wallet/withdraw/request` + aprovação admin

2. **`POST /api/admin/reset-clients`** - Burn desabilitado
   - Reset de usuários continua funcionando
   - Tokens NÃO são queimados automaticamente
   - Admin deve queimar manualmente via Polygon após reset

### Frontend Implementado

✅ **IMPLEMENTADO**:
- `client/src/lib/polygonUtils.ts` - Funções utilitárias
  - `signPermit()` - Assinar permit EIP-2612
  - `isPolygonNetwork()` - Verificar rede
  - `switchToPolygon()` - Trocar para Polygon

- `client/src/pages/portfolio-page.tsx` - Fluxo completo de saque
  - ✅ Verificação de MetaMask instalado
  - ✅ Verificação de walletAddress configurada
  - ✅ Verificação de rede Polygon (chainId 137)
  - ✅ Botão "Trocar para Polygon" quando em rede errada
  - ✅ Loading states durante assinatura (isSigningPermit, isSwitchingNetwork)
  - ✅ Mensagens de erro amigáveis e específicas
  - ✅ Alert informativo quando carteira não configurada
  - ✅ Link direto para /profile para configurar carteira
  - ✅ Informações sobre como funciona o processo
  - ✅ Integração completa com `handleWithdrawClick()`

❌ **PENDENTE**:
- Input para walletAddress no perfil do usuário (campo existe no banco, falta UI em /profile)

---

## 🧪 Como Testar

### Teste 1: Depósito (Mint)

1. Faça login como usuário
2. Configure `walletAddress` no banco (manualmente via DB):
   ```sql
   UPDATE users SET wallet_address = '0xSEU_ENDERECO' WHERE email = 'user@example.com';
   ```

3. Solicite depósito de R$ 100
4. Faça login como admin
5. Aprove o depósito
6. Verifique no Polygonscan:
   - 2 transações de mint
   - Uma para user, uma para admin
   - Ambas com 100 tokens (ou 100 * 10^18 se decimals=18)

### Teste 2: Saque (Burn com Permit)

**Pré-requisito:** Implementar UI de assinatura no frontend

1. Usuário solicita saque de R$ 50
2. MetaMask abre para assinar (sem pagar gas)
3. Dados de assinatura salvos no banco
4. Admin aprova saque
5. Verifique no Polygonscan:
   - 4 transações: permit, transferFrom, burn (user), burn (admin)
   - Todas pagas pelo admin

---

## 🔒 Segurança

### Proteções Implementadas

✅ Validação de carteira antes de aprovar depósito/saque  
✅ Validação de dados de permit antes de burn  
✅ Erros claros se Polygon não está configurado  
✅ Admin paga todo gas (usuário não paga nada no burn)  
✅ Rounding errors evitados (usa string ao invés de number)

### Recomendações

🔐 **Carteira Admin:**
- Use hardware wallet ou carteira dedicada
- NUNCA compartilhe chave privada
- Monitore saldo de MATIC diariamente
- Configure alertas de transações

🔐 **Contrato:**
- Audite código do contrato antes de usar
- Verifique que tem pausability em caso de emergência
- Confirme permissões de mint/burn estão corretas

🔐 **Monitoramento:**
- Acompanhe todas transações no Polygonscan
- Configure alertas para transações grandes
- Verifique que mints/burns batem com registros locais

---

## 📞 Suporte

### Logs para Debug

Ao iniciar aplicação, verifique:
```
✓ Polygon integration enabled - Contract: 0xABC...
```

Se aparecer erro:
```
⚠️ Polygon integration disabled - missing environment variables
Required: POLYGON_RPC_URL, ADMIN_PRIVATE_KEY, TOKEN_CONTRACT_ADDRESS, TOKEN_DECIMALS
```

### Erros Comuns

**"Polygon integration not initialized"**
→ Variáveis de ambiente não configuradas corretamente

**"Usuário não possui carteira Polygon configurada"**
→ Campo `walletAddress` NULL no banco de dados

**"Dados de assinatura permit ausentes"**
→ Usuário não assinou permit antes de solicitar saque

**"MetaMask não detectado"**
→ Usuário precisa instalar extensão MetaMask

---

## ✅ Checklist de Implementação

### Backend (Concluído ✅)
- [x] Instalar ethers.js e dotenv
- [x] Criar `server/polygonClient.ts`
- [x] Criar `server/tokenABI.json`
- [x] Atualizar `server/brl3-client.ts`
- [x] Adicionar campos no schema (walletAddress, permitData)
- [x] Migration aplicada no banco
- [x] Atualizar rota de aprovação de saque
- [x] Desabilitar rotas legadas incompatíveis

### Frontend (Concluído ✅)
- [x] Implementar input walletAddress no perfil _(campo no banco, UI pendente)_
- [x] Implementar fluxo completo de saque com assinatura
- [x] Integrar `signPermit()` ao clicar em "Solicitar Saque"
- [x] Adicionar verificação de rede (Polygon)
- [x] Adicionar botão "Trocar para Polygon"
- [x] Feedback visual durante assinatura (loading states)
- [x] Tratamento de erros (MetaMask não instalado, rede errada, assinatura cancelada)
- [x] Alert informativo quando carteira não configurada
- [x] Variáveis de ambiente VITE_* para configuração frontend

### Documentação (Concluído ✅)
- [x] Guia de configuração
- [x] Informações necessárias
- [x] Etapas manuais
- [x] Fluxos operacionais
- [x] Limitações documentadas

---

## 📚 Referências Técnicas

- [EIP-2612: Permit Extension for ERC-20](https://eips.ethereum.org/EIPS/eip-2612)
- [OpenZeppelin: Gasless Meta-Transactions](https://docs.openzeppelin.com/defender/guide/meta-tx)
- [QuickNode: ERC20 Permit Approval](https://www.quicknode.com/guides/ethereum-development/transactions/how-to-use-erc20-permit-approval)
- [Ethers.js v6 Documentation](https://docs.ethers.org/v6/)
- [Polygon Documentation](https://docs.polygon.technology/)

---

*Última atualização: 2025-01-17*
