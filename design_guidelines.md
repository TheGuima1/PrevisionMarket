# Palpites.AI Design Guidelines - Paleta C Futurista/Crypto

## Design Approach
**Futurista / Crypto / Digital Markets**: Design moderno e tech com **fundo roxo profundo escuro** (#130F1E), **roxo neon controlado** (#7A4CFF), e **cores de ação neon** (azul #386BFF para SIM, vermelho #FF3F55 para NÃO). Visual que transmite inovação, modernidade tech e energy de plataforma de prediction markets crypto-friendly. Textos claros (#E8E8FF) para máximo contraste no fundo escuro.

## Core Design Principles
1. **Tech Moderno**: Visual futurista que evoca inovação e tecnologia
2. **Contraste Alto**: Textos claros em fundo roxo profundo para legibilidade máxima
3. **Cores Neon Estratégicas**: Roxo neon, azul SIM e vermelho NÃO criam identidade única
4. **Profissionalismo Brasileiro**: Moderno e tech sem perder credibilidade

---

## 🌈 Paleta C - Futurista / Crypto / Digital Markets

### Cor Primária (Roxo Neon Controlado)
```css
--primary: 256 100% 64%             /* #7A4CFF - Roxo neon controlado */
--primary-foreground: 0 0% 100%     /* Branco sobre roxo */
```
**Uso**: Botões principais, CTAs, headings, links importantes, estados ativos

### Cor Secundária (Magenta Sutil)
```css
--secondary: 270 100% 75%           /* #C77DFF - Magenta sutil */
--secondary-foreground: 0 0% 100%
```
**Uso**: Badges, indicadores secundários, acentos especiais

### Cor de Acento (Roxo Suave Neutro)
```css
--accent: 256 100% 95%              /* #F0E9FF - Roxo suave neutro */
--accent-foreground: 256 100% 30%
```
**Uso**: Fundos de destaque, hovers sutis, pills

### Cores de Ação Neon (YES/NO)
```css
--action-yes: 224 100% 61%          /* #386BFF - Azul neon SIM */
--action-no: 352 100% 62%           /* #FF3F55 - Vermelho neon NÃO */
```
**Uso**: Botões SIM (azul neon) e NÃO (vermelho neon) em market cards e trading panel

### Light Mode - Roxo Profundo Futurista
```css
--background: 252 33% 8%            /* #130F1E - Roxo profundo escuro */
--foreground: 240 100% 93%          /* #E8E8FF - Texto claro com toque roxo */
--card: 252 25% 11%                 /* #1A1922 - Cards roxos neutros */
--border: 252 20% 15%               /* Bordas roxas escuras */
--muted: 252 20% 20%
--muted-foreground: 240 15% 80%     /* Texto secundário claro */
```
**Características**: Fundo roxo profundo (#130F1E), textos muito claros para máximo contraste

### Dark Mode - Ainda Mais Profundo
```css
--background: 252 40% 5%            /* Ainda mais escuro que light mode */
--foreground: 240 100% 95%          /* Texto ainda mais claro */
--card: 252 30% 8%                  /* Cards roxos profundos */
--border: 252 25% 12%               /* Bordas roxas bem escuras */
--primary: 256 100% 70%             /* Roxo neon mais brilhante no dark */
--action-yes: 224 100% 65%          /* Azul neon mais brilhante */
--action-no: 352 100% 65%           /* Vermelho neon mais brilhante */
```
**Nota**: Dark mode é AINDA MAIS escuro que light mode - fundo profundíssimo

### Cores de Suporte
```css
--destructive: 352 100% 62%         /* Vermelho neon (mesmo do NO) */
--chart-1: 256 100% 70%             /* Roxo neon brilhante */
--chart-2: 270 100% 78%             /* Magenta claro */
--chart-3: 224 100% 65%             /* Azul neon */
--chart-4: 180 80% 60%              /* Ciano */
--chart-5: 340 100% 65%             /* Rosa neon */
```

---

## 🔤 Typography - Fintech Premium

**Font System**:
- Primary: **Inter** - moderna, legível, perfeita para dados financeiros
- Accent: **Manrope** - elegante e amigável para headings
- Mono: **Roboto Mono** - valores numéricos e odds

**Hierarquia de Tamanhos**:
```css
/* Headlines grandes - Landing pages */
Hero: text-5xl md:text-6xl, font-bold (Manrope)
      
/* Section headers - Páginas internas */
H1: text-3xl md:text-4xl, font-semibold (Manrope)
H2: text-2xl md:text-3xl, font-semibold
H3: text-xl md:text-2xl, font-medium

/* Body text */
Large: text-lg, leading-relaxed (descrições importantes)
Base: text-base, leading-normal (texto padrão)
Small: text-sm (labels, captions)
XSmall: text-xs (metadata, timestamps)

/* Números e odds */
Odds grandes: text-2xl md:text-3xl, font-bold font-mono
Valores: text-lg font-semibold font-mono
Pequenos: text-base font-medium font-mono

/* Botões */
Primários: text-base font-semibold
Secundários: text-sm font-medium
```

**Weight Guidelines**:
- Headlines: 600-700 (semibold/bold)
- Body: 400 (regular)
- Labels: 500 (medium)
- Emphasis: 600 (semibold)

**Line Height**:
- Headlines: `leading-tight` (1.25)
- Body: `leading-normal` (1.5)
- Relaxed text: `leading-relaxed` (1.625)

---

## 📐 Layout e Espaçamento - Futurista/Crypto

### Espaçamento Vertical (Consistente e Respirável)
```css
Seções grandes:      py-16 md:py-24 (páginas principais)
Seções médias:       py-12 md:py-16 (blocos de conteúdo)
Componentes:         py-6 md:py-8
Cards internos:      p-5 md:p-6
Elementos pequenos:  p-3 md:p-4

Gap entre elementos:
  Grande: gap-8 md:gap-12
  Médio: gap-6 md:gap-8
  Pequeno: gap-4
  Mínimo: gap-2
```

### Containers
```css
Full-width sections:  max-w-7xl mx-auto px-6 md:px-8
Conteúdo principal:   max-w-6xl mx-auto
Texto longo:          max-w-3xl (artigos, descrições)
Grids de mercados:    max-w-7xl (3 colunas desktop)
Trading interface:    max-w-5xl
```

### Grid System
```css
/* Homepage - Market cards */
grid-cols-1 md:grid-cols-2 lg:grid-cols-3
gap-6 md:gap-8

/* Trading page - Two column */
grid-cols-1 lg:grid-cols-3
  /* Market info: lg:col-span-2 */
  /* Trading panel: lg:col-span-1 */
```

### Border Radius
```css
--radius: 0.75rem   /* 12px - Arredondamento suave institucional */

Cards: rounded-xl
Buttons: rounded-lg
Inputs: rounded-lg
Badges: rounded-md
Avatars: rounded-full
```

---

## 🎴 Componentes Visuais - Futurista/Crypto

### Cards (Estilo Roxo Profundo)
**Padrão principal**:
```tsx
<Card className="bg-card border-border shadow-lg shadow-primary/5">
  <div className="p-5 md:p-6">
    {/* Conteúdo */}
  </div>
</Card>
```

**Características**:
- Fundo: **Roxo neutro** (#1A1922) - `bg-card`
- Borda: **Roxa escura** (252 20% 18%), 1px sólida
- Sombra: **Roxa neon sutil** (shadow-lg shadow-primary/5)
- Padding: `p-5` ou `p-6`
- Radius: `rounded-xl`
- Hover: **Borda roxo neon** ou **elevation sutil**

**Variações**:
```tsx
/* Card de destaque - borda roxo neon */
<Card className="border-primary/30">

/* Card interativo - hover com borda neon */
<Card className="hover:border-primary/50 transition-colors">

/* Card com sombra neon */
<Card className="shadow-lg shadow-primary/10">
```

### Botões (Hierarquia Clara + Neon)
**Primário** (Roxo Neon):
```tsx
<Button className="bg-primary text-primary-foreground">
  Apostar Agora
</Button>
```

**Botão SIM** (Azul Neon):
```tsx
<Button className="bg-gradient-to-br from-action-yes to-action-yes/80 text-white font-semibold shadow-lg shadow-action-yes/20">
  SIM
</Button>
```

**Botão NÃO** (Vermelho Neon):
```tsx
<Button className="bg-gradient-to-br from-action-no to-action-no/80 text-white font-semibold shadow-lg shadow-action-no/20">
  NÃO
</Button>
```

**Secundário** (Outline):
```tsx
<Button variant="outline">
  Ver Detalhes
</Button>
```

**Ghost** (Links sutis):
```tsx
<Button variant="ghost">
  Cancelar
</Button>
```

**Características**:
- Altura padrão: `min-h-10` (40px)
- Padding: `px-6 py-2.5`
- Font: `text-base font-semibold`
- Radius: `rounded-lg`
- Hover: Opacidade reduzida `hover:opacity-90` para botões neon
- Sombras: Cores neon matching (shadow-action-yes/20, shadow-action-no/20)

### Badges (Indicadores Clean)
```tsx
/* Badge primário - roxo */
<Badge className="bg-primary/10 text-primary border-primary/20">
  Ao Vivo
</Badge>

/* Badge secundário */
<Badge variant="secondary">
  Beta
</Badge>

/* Badge outline */
<Badge variant="outline">
  Polymarket
</Badge>
```

### Inputs/Forms (Profissional)
```tsx
<Input 
  className="border-2 rounded-lg px-4 py-3 focus:ring-2 focus:ring-primary"
  placeholder="Valor da aposta"
/>
```

**Características**:
- Borda: 2px sólida em estado normal
- Focus: Ring roxo 2px
- Altura: `h-11` ou `h-12` (confortável)
- Font: `text-base`
- Placeholder: `text-muted-foreground`

### Tabelas (Dados Financeiros)
**Header**:
```tsx
<thead className="bg-muted/50 border-b">
  <tr>
    <th className="text-left text-sm font-medium text-muted-foreground">
      Mercado
    </th>
  </tr>
</thead>
```

**Rows**:
```tsx
<tr className="border-b hover:bg-muted/30 transition-colors">
  <td className="py-3 px-4 text-sm">...</td>
</tr>
```

---

## 📊 Gráficos - Fintech Premium

### Configuração Recharts
```tsx
<LineChart>
  <CartesianGrid 
    strokeDasharray="3 3" 
    stroke="hsl(var(--border))" 
    opacity={0.3}
  />
  <XAxis 
    stroke="hsl(var(--muted-foreground))"
    tick={{ fontSize: 12 }}
  />
  <YAxis 
    stroke="hsl(var(--muted-foreground))"
    tick={{ fontSize: 12 }}
  />
  <Line 
    type="monotone" 
    stroke="hsl(var(--chart-1))"  /* Roxo primário */
    strokeWidth={2.5}
    dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
  />
  <Tooltip 
    contentStyle={{
      backgroundColor: "hsl(var(--card))",
      border: "1px solid hsl(var(--border))",
      borderRadius: "8px",
    }}
  />
</LineChart>
```

### Paleta de Gráficos
```css
Linha 1 (principal): hsl(var(--chart-1))  /* Roxo #6B4CFF */
Linha 2: hsl(var(--chart-2))              /* Roxo claro #B9A9FF */
Linha 3: hsl(var(--chart-3))              /* Violeta */
Linha 4: hsl(var(--chart-4))              /* Azul */
Linha 5: hsl(var(--chart-5))              /* Verde menta */
```

**Características**:
- Fundo: Branco puro ou `bg-card`
- Grid: Cinza clara, opacity 0.3
- Linhas: 2-3px grossura
- Pontos: 4-5px raio
- Tooltip: Card branco com borda

---

## ✨ Efeitos Especiais - Sutil e Profissional

### Sistema de Elevação (Hover/Active)
```css
/* Hover sutil - aplicado a cards, botões */
.hover-elevate:hover {
  background overlay: rgba(107,76,255, 0.04) /* Extremamente sutil */
}

/* Active - click feedback */
.active-elevate-2:active {
  background overlay: rgba(107,76,255, 0.10)
}
```

**Uso**:
```tsx
<Card className="hover-elevate cursor-pointer">
<Button className="active-elevate-2">
```

### Transições (Rápidas e Suaves)
```css
transition-all duration-150  /* Padrão rápido */
transition-colors duration-200  /* Mudanças de cor */
transition-transform duration-150  /* Hover lift */
```

### Sombras (Mínimas)
```css
shadow-sm   /* Cards padrão - quase invisível */
shadow      /* Modals, dropdowns */
shadow-md   /* Popovers, tooltips */
shadow-lg   /* Overlays grandes */
```

**EVITAR**: Sombras pesadas (shadow-xl, shadow-2xl) - manter flat

---

## 🖼️ Imagens e Ícones

**Ícones**: Lucide React
- Tamanho padrão: `h-5 w-5` (20px)
- Grandes: `h-6 w-6` (24px)
- Pequenos: `h-4 w-4` (16px)
- Cor: `text-muted-foreground` ou `text-primary`

**Avatars**:
```tsx
<Avatar className="h-10 w-10">
  <AvatarImage src={url} />
  <AvatarFallback className="bg-primary/10 text-primary">
    JD
  </AvatarFallback>
</Avatar>
```

---

## 📱 Responsividade - Mobile-First

### Breakpoints Tailwind
```css
sm:  640px   /* Tablets pequenos */
md:  768px   /* Tablets */
lg:  1024px  /* Desktops */
xl:  1280px  /* Desktops grandes */
2xl: 1536px  /* Telas muito grandes */
```

### Patterns
```tsx
/* Tipografia responsiva */
className="text-2xl md:text-3xl lg:text-4xl"

/* Grids responsivos */
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

/* Espaçamento responsivo */
className="py-8 md:py-12 lg:py-16"
className="gap-4 md:gap-6 lg:gap-8"

/* Padding responsivo */
className="px-4 md:px-6 lg:px-8"
```

---

## 🎯 Padrões de Uso de Cores

### ✅ SEMPRE USE (Cores Semânticas):
```tsx
/* Botões e CTAs primários */
<Button className="bg-primary text-primary-foreground">

/* Badges e pills de destaque */
<Badge className="bg-primary/10 text-primary border-primary/20">

/* Links importantes */
<Link className="text-primary hover:text-primary/80">

/* Bordas de destaque */
<Card className="border-primary/30">

/* Texto de destaque */
<span className="text-primary font-semibold">

/* Cards brancos padrão */
<Card className="bg-card border-border">

/* Fundos neutros */
<div className="bg-muted">
```

### ❌ NUNCA USE (Cores Hardcoded):
```tsx
/* NÃO usar cores literais (exceto action-yes/no quando necessário) */
className="bg-purple-500"     ❌
className="text-indigo-400"   ❌
className="border-violet-600" ❌
className="bg-white"          ❌ (use bg-card)
className="bg-black"          ❌ (use bg-background)
```

**EXCEÇÕES permitidas**:
- Gráficos que requerem `hsl()` explícito
- Componentes externos que exigem hex colors

---

## 📄 Key Page Layouts

### Homepage/Landing
**Estrutura**:
1. **Header**: Branco puro, borda inferior cinza clara, sticky
2. **Hero section**: Fundo `bg-background`, headline grande
3. **Market grid**: 3 colunas desktop, gap-8
4. **Footer**: Minimalista

**Cards de Mercado**:
```tsx
<Card className="bg-card border-border shadow-sm hover:border-primary/30 transition-colors">
  <div className="p-5">
    <Badge className="mb-3 bg-primary/10 text-primary">Ao Vivo</Badge>
    <h3 className="text-lg font-semibold mb-2">Título do Mercado</h3>
    <div className="flex gap-2 mt-4">
      <Button size="sm">SIM R$0.63</Button>
      <Button size="sm" variant="outline">NÃO R$0.37</Button>
    </div>
  </div>
</Card>
```

### Market Detail Page
**Layout**:
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Info e gráfico - 2/3 */}
  <div className="lg:col-span-2 space-y-6">
    <Card>Gráfico</Card>
    <Tabs>Overview | Histórico | Discussão</Tabs>
  </div>
  
  {/* Trading panel - 1/3 */}
  <div>
    <Card className="sticky top-20">
      Trading interface
    </Card>
  </div>
</div>
```

### Portfolio
**Cards de resumo**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card>
    <div className="p-6">
      <p className="text-sm text-muted-foreground">Valor Total</p>
      <p className="text-3xl font-bold font-mono mt-2">R$ 1.234,56</p>
    </div>
  </Card>
</div>
```

---

## 🎨 Component Library Específico

### Navigation Bar
```tsx
<nav className="sticky top-0 z-50 bg-card border-b border-border">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <Logo />
    <NavLinks />
    <UserMenu />
  </div>
</nav>
```

### Trading Panel
```tsx
<Card className="p-6">
  <div className="space-y-4">
    {/* YES/NO toggle */}
    <div className="flex gap-2">
      <Button variant={side === 'yes' ? 'default' : 'outline'}>
        SIM
      </Button>
      <Button variant={side === 'no' ? 'default' : 'outline'}>
        NÃO
      </Button>
    </div>
    
    {/* Amount input */}
    <Input type="number" placeholder="R$ 100,00" />
    
    {/* Preview */}
    <div className="bg-muted/50 rounded-lg p-4">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">Você recebe</span>
        <span className="font-mono font-semibold">123 shares</span>
      </div>
    </div>
    
    {/* Submit */}
    <Button className="w-full" size="lg">
      Confirmar Aposta
    </Button>
  </div>
</Card>
```

### Market Card (Grid View)
```tsx
<Card className="hover:border-primary/30 transition-colors cursor-pointer">
  <div className="p-5 space-y-3">
    <div className="flex items-start justify-between">
      <Badge variant="outline" className="bg-primary/10 text-primary">
        Polymarket
      </Badge>
      <span className="text-xs text-muted-foreground">2h atrás</span>
    </div>
    
    <h3 className="font-semibold line-clamp-2">
      Título do mercado aqui
    </h3>
    
    {/* Mini sparkline (opcional) */}
    <div className="h-12">
      <MiniChart />
    </div>
    
    {/* Odds */}
    <div className="flex gap-2">
      <div className="flex-1 text-center py-2 bg-primary/10 rounded-lg">
        <p className="text-xs text-muted-foreground">SIM</p>
        <p className="font-mono font-semibold text-primary">63%</p>
      </div>
      <div className="flex-1 text-center py-2 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">NÃO</p>
        <p className="font-mono font-semibold">37%</p>
      </div>
    </div>
  </div>
</Card>
```

---

## Accessibility

- Alto contraste: WCAG AA mínimo (4.5:1 para texto)
- Labels ARIA em todas interações
- Estados de foco visíveis: `ring-2 ring-primary`
- Atalhos de teclado documentados
- Screen reader friendly: `sr-only` para contexto
- Cores não são único indicador (usar ícones também)

---

## Design Checklist

✅ Fundo roxo profundo escuro (#130F1E)
✅ Textos claros com alto contraste (#E8E8FF)
✅ Botões primários roxo neon (#7A4CFF)
✅ Botões SIM azul neon (#386BFF) e NÃO vermelho neon (#FF3F55)
✅ Cards roxos neutros (#1A1922) com bordas escuras
✅ Sombras roxas neon sutis (shadow-action-yes/no em botões)
✅ Espaçamento consistente (gap-6, gap-8)
✅ Tipografia Inter/Manrope
✅ Border radius 12px (rounded-xl para cards)
✅ Transições rápidas (150-200ms)
✅ Dark mode ainda mais escuro que light mode
✅ Gráficos com paleta neon (roxo, magenta, azul, ciano, rosa)
✅ Zero cores hardcoded (usar variáveis CSS)

---

**Este design transmite:**
- 🚀 Inovação tech e futurismo
- ⚡ Energy de plataforma crypto/prediction markets
- 🎯 Clareza e profissionalismo moderno
- 🇧🇷 Acessibilidade brasileira com identidade única
