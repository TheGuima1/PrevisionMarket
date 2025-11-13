# Palpites.AI Design Guidelines - Fintech Clean Institucional

## Design Approach
**Fintech Clean Premium**: Design institucional e profissional inspirado em Kalshi e plataformas financeiras reguladas. Focado em **credibilidade**, **clareza** e **modernidade** através de paleta roxo-lavanda elegante, cards brancos puros, e UI extremamente organizada. Zero poluição visual, máxima legibilidade.

## Core Design Principles
1. **Credibilidade Institucional**: Visual que transmite confiança de produto regulado
2. **Clareza Extrema**: Uma mensagem por seção, hierarquia visual impecável
3. **Minimalismo Funcional**: Apenas elementos necessários, zero distrações
4. **Profissionalismo Brasileiro**: Moderno e acessível sem ser informal

---

## 🌈 Paleta de Cores - Fintech Clean Roxo-Lavanda

### Cor Primária (Roxo Institucional)
```css
--primary: 250 100% 65%             /* #6B4CFF - Roxo primário elegante */
--primary-foreground: 0 0% 100%     /* Branco sobre roxo */
```
**Uso**: Botões principais, CTAs, links importantes, estados ativos

### Cor Secundária (Roxo Claro)
```css
--secondary: 250 100% 83%           /* #B9A9FF - Roxo claro suave */
--secondary-foreground: 250 100% 30%
```
**Uso**: Badges, indicadores secundários, fundos sutis

### Cor de Acento (Lavanda)
```css
--accent: 250 100% 95%              /* #E9E4FF - Lavanda suave */
--accent-foreground: 250 100% 40%
```
**Uso**: Fundos de destaque, hovers sutis, pills

### Modo Claro (Light Mode) - Padrão Profissional
```css
--background: 240 14% 96%           /* #F5F5F7 - Cinza suave institucional */
--foreground: 240 2% 23%            /* #3A3A3C - Cinza escuro legível */
--card: 0 0% 100%                   /* #FFFFFF - Cards brancos puros */
--border: 225 14% 90%               /* #E3E4E8 - Bordas cinza muito claras */
--muted: 225 14% 96%                /* Fundos neutros */
--muted-foreground: 240 4% 46%      /* Texto secundário */
```

### Modo Escuro (Dark Mode) - Sutil e Profissional
```css
--background: 240 6% 10%            /* #17171A - Cinza escuro muito sutil */
--foreground: 0 0% 95%              /* #F2F2F2 - Texto claro */
--card: 240 5% 14%                  /* #212125 - Cards cinza escuro sutil */
--border: 240 4% 20%                /* Bordas escuras discretas */
--primary: 250 100% 70%             /* Roxo mais claro para contraste */
```
**Nota**: Dark mode é sutil, não dramático. Cinza escuro elegante, não preto puro.

### Cores de Suporte
```css
--destructive: 0 84% 60%            /* Vermelho ações destrutivas */
--chart-1: 250 100% 65%             /* Roxo - gráficos */
--chart-2: 250 100% 83%             /* Roxo claro - gráficos */
--chart-3: 280 100% 75%             /* Violeta - gráficos */
--chart-4: 210 100% 65%             /* Azul - gráficos */
--chart-5: 160 84% 58%              /* Verde menta - gráficos */
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

## 📐 Layout e Espaçamento - Institucional Clean

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

## 🎴 Componentes Visuais - Fintech Clean

### Cards (Estilo Institucional)
**Padrão principal**:
```tsx
<Card className="bg-card border-border shadow-sm">
  <div className="p-5 md:p-6">
    {/* Conteúdo */}
  </div>
</Card>
```

**Características**:
- Fundo: **Branco puro** (#FFFFFF) em light mode
- Borda: **Cinza clara** (#E3E4E8), 1px sólida
- Sombra: **Extremamente sutil** (shadow-sm)
- Padding: `p-5` ou `p-6`
- Radius: `rounded-xl`
- Hover: **Não elevam** (manter flat profissional)

**Variações**:
```tsx
/* Card de destaque - com borda roxo */
<Card className="border-primary/20">

/* Card interativo - hover sutil */
<Card className="hover:border-primary/30 transition-colors">

/* Card com sombra leve */
<Card className="shadow-md">
```

### Botões (Hierarquia Clara)
**Primário** (Roxo):
```tsx
<Button className="bg-primary text-primary-foreground">
  Apostar Agora
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
- Hover: Elevação sutil via `hover-elevate`

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
/* NÃO usar cores literais */
className="bg-purple-500"     ❌
className="text-indigo-400"   ❌
className="border-violet-600" ❌
className="bg-white"          ❌ (use bg-card)
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

✅ Cards brancos puros com bordas cinza claras
✅ Sombras extremamente sutis (shadow-sm padrão)
✅ Botões primários roxo (#6B4CFF)
✅ Espaçamento consistente (gap-6, gap-8)
✅ Tipografia Inter/Manrope
✅ Border radius 12px (rounded-xl para cards)
✅ Transições rápidas (150-200ms)
✅ Dark mode sutil, não dramático
✅ Gráficos com paleta roxo-lavanda
✅ Zero cores hardcoded (usar variáveis CSS)

---

**Este design transmite:**
- 🏛️ Credibilidade institucional
- 💎 Modernidade premium
- 📊 Profissionalismo financeiro
- 🇧🇷 Acessibilidade brasileira
