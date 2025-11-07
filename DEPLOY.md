# MatrizPIX - Guia de Deploy (Replit)

## 🚀 Deploy para Produção (Replit)

Este guia explica como fazer deploy do MatrizPIX no Replit Deploy.

---

## ✅ Pré-requisitos

Antes de fazer deploy, certifique-se que:

1. **Database existe**: PostgreSQL configurado no Replit
2. **Secrets configurados**: `DATABASE_URL`, `SESSION_SECRET`
3. **Código commitado**: Todas mudanças estão no Git

---

## 📦 Como Funciona

### Estrutura de Build

```
npm run build
├── vite build           → Gera client/dist (frontend estático)
└── esbuild server/      → Gera dist/index.js (backend)
```

### Estrutura Final (após build)

```
dist/
├── public/              ← Frontend (HTML, JS, CSS)
│   ├── index.html
│   └── assets/
└── index.js             ← Backend (Express + API routes)
```

### Como o Server Funciona em Produção

**server/index.ts** detecta automaticamente o ambiente:

```typescript
if (app.get("env") === "development") {
  // DEV: Usa Vite dev server (HMR)
  await setupVite(app, server);
} else {
  // PROD: Serve arquivos estáticos de dist/public
  serveStatic(app);
}
```

**server/vite.ts - serveStatic()** serve o frontend:

```typescript
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");
  
  // Serve arquivos estáticos
  app.use(express.static(distPath));
  
  // SPA fallback: qualquer rota não-API retorna index.html
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
```

---

## 🎯 Configuração de Deploy no Replit

### 1. Secrets (Environment Variables)

Configure os seguintes secrets no Replit:

```bash
NODE_ENV=production
DATABASE_URL=<sua_connection_string_postgresql>
SESSION_SECRET=<string_aleatoria_segura>
AI_INTEGRATIONS_OPENAI_BASE_URL=<replit_ai_url>
AI_INTEGRATIONS_OPENAI_API_KEY=<replit_ai_key>
```

### 2. Scripts de Deploy

Os scripts já estão configurados no `package.json`:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist",
    "start": "NODE_ENV=production node dist/index.js"
  }
}
```

### 3. Comandos de Deploy

No painel de deploy do Replit, configure:

**Build Command:**
```bash
npm ci && npm run build
```

**Run Command:**
```bash
npm run start
```

**Port:** `5000` (automático via `process.env.PORT`)

---

## 🌱 Auto-Seed em Produção

O sistema **automaticamente** faz seed do banco se estiver vazio:

```typescript
// server/routes.ts - registerRoutes()
async function autoSeedIfEmpty() {
  const userCount = await db.select({ count: sql`count(*)` }).from(users);
  
  if (count === 0) {
    console.log("🌱 Database is empty, running auto-seed...");
    const { seed } = await import("./seed");
    await seed();
    console.log("✅ Auto-seed completed successfully!");
  }
}
```

**Resultado:** No primeiro boot em produção, cria automaticamente:
- 2 usuários: `admin` / `demo`
- 8 mercados com volume realista (R$ 127,50 a R$ 984,00)
- Trades seed para simular atividade

---

## ✅ Checklist de Deploy

Antes de publicar, valide:

- [ ] `npm run build` executa sem erros
- [ ] `dist/public/index.html` existe
- [ ] `dist/index.js` existe
- [ ] Secrets configurados no Replit
- [ ] Database PostgreSQL ativo
- [ ] Código commitado no Git

---

## 🧪 Testes de Produção

Após deploy, valide:

### 1. Health Check

```bash
curl https://seu-app.replit.app/health
```

**Resposta esperada:**
```json
{
  "ok": true,
  "time": "2025-11-07T01:30:00.000Z",
  "dbConnected": true,
  "users": 2
}
```

### 2. API Funcional

```bash
curl https://seu-app.replit.app/api/markets
```

**Deve retornar:** Array com 8 mercados

### 3. Frontend Funcionando

Abra no navegador: `https://seu-app.replit.app`

**Deve mostrar:**
- ✅ 8 market cards na homepage
- ✅ Volumes em BRL (R$ 127,50, R$ 675,00, etc.)
- ✅ Sem mensagem "Nenhum mercado encontrado"
- ✅ Console sem erros 404/CORS

---

## 🐛 Troubleshooting

### Problema: "Nenhum mercado encontrado"

**Causas possíveis:**

1. **API não responde**
   - Verifique: `curl https://seu-app.replit.app/api/markets`
   - Se 404: Build falhou, `dist/index.js` não existe
   - Se 500: Erro no server, check logs

2. **Database vazio**
   - Verifique: `curl https://seu-app.replit.app/health`
   - Se `users: 0`: Auto-seed não rodou
   - Solução: Force restart do deploy

3. **Frontend não carrega API**
   - Verifique console do browser por erros CORS
   - Frontend usa `import.meta.env.VITE_API_URL || '/api'`
   - Em produção, usa `/api` relativo (correto)

### Problema: Build falha

**Erro comum:**
```
Could not find the build directory: dist/public
```

**Solução:**
```bash
# Limpe e rebuilde
rm -rf dist/
npm run build
```

### Problema: Server crash no boot

**Check logs:**
```bash
# Replit logs
```

**Erros comuns:**
- `DATABASE_URL` missing → Configure secret
- `Cannot find module` → Build incompleto

---

## 📊 Monitoramento

### Logs em Produção

Replit mostra logs automaticamente. Procure por:

```
✓ Database already has 2 users, skipping seed
serving on port 5000
```

### Métricas

Via `/health` endpoint:
- Conexão DB: `dbConnected: true`
- Usuários cadastrados: `users: 2`
- Timestamp: `time: "..."`

---

## 🔒 Segurança

### Secrets Obrigatórios

```bash
SESSION_SECRET=<generate_with: openssl rand -hex 32>
DATABASE_URL=<postgresql_connection_string>
```

### Nunca Commite

❌ Não commite no Git:
- `DATABASE_URL`
- `SESSION_SECRET`
- API keys pessoais

✅ Use Replit Secrets para todas credenciais

---

## 📝 Notas Importantes

1. **Port 5000 é obrigatório** - Outras portas são bloqueadas pelo Replit
2. **Seed automático** - Só roda se DB estiver vazio (idempotente)
3. **SPA routing** - Todas rotas não-API retornam `index.html` (wouter)
4. **CORS não necessário** - Frontend e backend no mesmo domínio
5. **Build antes de deploy** - `npm run build` SEMPRE antes de publicar

---

## 🎉 Deploy Bem-Sucedido

Quando tudo funcionar:

✅ Homepage mostra 8 mercados
✅ Volumes em BRL corretos
✅ `/health` retorna `ok: true`
✅ Console sem erros
✅ Login/registro funcionam
✅ Trading funciona

**Próximos passos:** Compartilhe o link `https://seu-app.replit.app` 🚀
