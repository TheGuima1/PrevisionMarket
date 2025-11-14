# Palpites.AI Design Guidelines - Purple Tech Premium

## Design Approach
**Purple Tech Premium / Modern Fintech**: Design moderno e profissional com **fundos brancos claros** (#FAFAFF), **roxo tech vibrante** (#7A4CFF primary), e **cores de ação** (roxo #7A4CFF para SIM, vermelho #EF4444 para NÃO). Visual que transmite inovação, criatividade tech e profissionalismo fintech premium. Gradientes roxos sutis para criar profundidade sem perder clareza.

## Core Design Principles
1. **Premium Moderno**: Visual clean e profissional inspirado em fintechs de sucesso
2. **Fundos Claros**: Branco com gradientes roxos sutis para profundidade
3. **Roxo Tech Vibrante**: Cor primária roxa (#7A4CFF) que transmite inovação e criatividade
4. **Contraste Suave**: Textos escuros em fundos claros para legibilidade máxima
5. **Profissionalismo Brasileiro**: Moderno e tech com credibilidade institucional

---

## 🌈 Paleta - Purple Tech Premium

### Cor Primária (Roxo Tech)
```css
--primary-purple: 260 100% 65%       /* #7A4CFF - Roxo tech vibrante */
--primary-purple-light: 260 60% 85% /* #C4B3FF - Roxo claro */
```
**Uso**: Botões principais, CTAs, headings, links importantes, estados ativos

### Backgrounds (Fundos Claros com Gradientes)
```css
--bg-white: 260 100% 99%            /* #FAFAFF - Branco levemente roxeado */
--bg-gradient-start: 260 100% 99%   /* #FAFAFF */
--bg-gradient-end: 260 100% 97%     /* #F3EDFF */
```
**Uso**: Background principal da página, sections, hero areas

### Superfícies (Cards e Componentes)
```css
--card-white: 0 0% 100%             /* #FFFFFF - Branco puro para cards */
--glass-purple: 260 100% 97%        /* #F3EDFF - Fundo glass com toque roxo */
```
**Uso**: Cards, panels, componentes elevados

### Bordas e Separadores
```css
--border-soft: 260 20% 90%          /* #E8E2F0 - Borda suave roxeada */
--border-medium: 260 20% 82%        /* #D8CFEB - Borda média */
```
**Uso**: Bordas de cards, separadores, dividers

### Textos
```css
--text-dark: 220 40% 15%            /* #1A2942 - Texto principal escuro */
--text-medium: 220 20% 45%          /* #6B7A8F - Texto secundário */
--text-light: 220 15% 65%           /* #9BA8B8 - Texto terciário */
```
**Uso**: Hierarquia de texto (dark > medium > light)

### Cores de Ação (YES/NO)
```css
--action-yes: 260 100% 65%          /* #7A4CFF - Roxo tech (mesmo do primary) */
--action-no: 0 85% 60%              /* #EF4444 - Vermelho vibrante */
```
**Uso**: Botões SIM (roxo) e NÃO (vermelho) em market cards e trading panel

### Cores Semânticas
```css
--success: 142 71% 45%              /* #22C55E - Verde sucesso */
--warning: 38 92% 50%               /* #F59E0B - Amarelo aviso */
--error: 0 85% 60%                  /* #EF4444 - Vermelho erro */
--info: 199 89% 48%                 /* #0EA5E9 - Azul informação */
```

### Dark Mode (Opcional - Para Toggle Futuro)
```css
--background-dark: 260 30% 10%      /* #1A0F2E - Fundo escuro roxeado */
--card-dark: 260 25% 15%            /* #2A1F3D - Cards escuros */
--text-dark-mode: 260 100% 95%      /* #F3EDFF - Texto claro */
```
**Nota**: Light mode é o padrão. Dark mode pode ser adicionado futuramente.

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

**Cores de Texto**:
- Texto principal: `text-[var(--text-dark)]` (#1A2942)
- Texto secundário: `text-[var(--text-medium)]` (#6B7A8F)
- Texto terciário: `text-[var(--text-light)]` (#9BA8B8)
- Links e CTAs: `text-primary` (#7A4CFF)

---

## 📐 Layout e Espaçamento - Modern Premium

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
--radius: 0.75rem   /* 12px - Arredondamento suave moderno */

Cards: rounded-xl (12px)
Buttons: rounded-lg (8px)
Inputs: rounded-lg (8px)
Badges: rounded-md (6px)
Avatars: rounded-full
```

---

## 🎴 Componentes Visuais - Blue Tech Premium

### Cards (Estilo Branco Premium)
**Padrão principal**:
```tsx
<Card className="bg-white border-[var(--border-soft)] shadow-card">
  <div className="p-5 md:p-6">
    {/* Conteúdo */}
  </div>
</Card>
```

**Características**:
- Fundo: **Branco puro** (#FFFFFF)
- Borda: **Cinza azulada suave** (#E0E7F0), 1px sólida
- Sombra: **Sombra suave** (0 1px 3px rgba(0,0,0,0.08))
- Padding: `p-5` ou `p-6`
- Radius: `rounded-xl` (12px)
- Hover: **Sombra elevada** ou **borda azul sutil**

**Variações**:
```tsx
/* Card de destaque - borda azul */
<Card className="border-[var(--primary-blue)]/20">

/* Card interativo - hover com sombra */
<Card className="hover:shadow-md transition-shadow">

/* Card com background glass */
<Card className="bg-[var(--glass-blue)]">
```

### Backgrounds Gradientes
```tsx
/* Hero section com gradiente azul */
<section className="bg-gradient-to-br from-[var(--bg-gradient-start)] to-[var(--bg-gradient-end)]">

/* Background com glass effect */
<div className="bg-[var(--glass-blue)] backdrop-blur-sm">
```

### Botões (Hierarquia Clara)
**Primário** (Azul Tech):
```tsx
<Button variant="default" className="bg-[var(--primary-blue)] text-white">
  Apostar Agora
</Button>
```

**Botão SIM** (Azul):
```tsx
<Button variant="actionYes">
  SIM
</Button>
```

**Botão NÃO** (Vermelho):
```tsx
<Button variant="actionNo">
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
- Sistema hover-elevate automático (não sobrescrever!)
- Usar apenas variants do Button (actionYes, actionNo, outline, ghost, default)
- NUNCA adicionar classes de hover/padding manualmente
- Altura padrão: variants definem automaticamente

### Badges (Indicadores Clean)
```tsx
/* Badge de categoria */
<Badge className="bg-purple-50 text-primary border-primary/20">
  Política
</Badge>

/* Badge de status */
<Badge className="bg-green-50 text-green-700 border-green-200">
  Ao Vivo
</Badge>

/* Badge outline */
<Badge variant="outline">
  Polymarket
</Badge>
```

### Navbar (Glass Effect Premium)
```tsx
<nav className="sticky top-0 z-50 bg-[var(--glass-white)] backdrop-blur-md border-b border-[var(--border-soft)]">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <Logo />
    <NavLinks />
    <UserMenu />
  </div>
</nav>
```

**Características**:
- Background: Glass white com blur
- Borda inferior: Suave
- Sticky: `sticky top-0 z-50`
- Logo com gradiente roxo: `text-gradient-purple`

---

## 📊 Gráficos - Fintech Premium

### Configuração Recharts
```tsx
<LineChart>
  <CartesianGrid 
    strokeDasharray="3 3" 
    stroke="hsl(var(--border-soft))" 
    opacity={0.3}
  />
  <Line 
    type="monotone" 
    stroke="hsl(var(--primary))"
    strokeWidth={2.5}
    dot={{ fill: "hsl(var(--primary))", r: 4 }}
  />
</LineChart>
```

---

## ✨ Efeitos Especiais - Sutil e Profissional

### Sistema de Elevação (Hover/Active)
**IMPORTANTE**: Usar sistema hover-elevate do projeto (não sobrescrever!)

```tsx
/* Componentes já têm hover-elevate built-in */
<Button>  {/* ✅ Já tem hover-elevate */}
<Badge>   {/* ✅ Já tem hover-elevate */}

/* Para outros elementos, pode adicionar */
<Card className="hover-elevate cursor-pointer">
```

**NUNCA fazer**:
```tsx
<Button className="hover:bg-blue-600">  {/* ❌ Quebra sistema */}
<Button className="px-4 py-2">         {/* ❌ Quebra altura padrão */}
```

### Transições (Rápidas e Suaves)
```css
transition-all duration-150  /* Padrão rápido */
transition-colors duration-200  /* Mudanças de cor */
transition-shadow duration-150  /* Hover sombras */
```

### Sombras (Sutis e Profissionais)
```css
shadow-card: 0 1px 3px rgba(0,0,0,0.08)  /* Cards padrão */
shadow-md: 0 4px 6px rgba(0,0,0,0.1)     /* Hover elevado */
shadow-lg: 0 10px 15px rgba(0,0,0,0.1)   /* Modals */
```

---

## 🖼️ Imagens e Ícones

**Ícones**: Lucide React
- Tamanho padrão: `h-5 w-5` (20px)
- Grandes: `h-6 w-6` (24px)
- Pequenos: `h-4 w-4` (16px)
- Cor: `text-[var(--text-medium)]` ou `text-primary`

**Avatars**:
```tsx
<Avatar className="h-10 w-10">
  <AvatarImage src={url} />
  <AvatarFallback className="bg-purple-50 text-primary">
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
```

---

## 🎯 Padrões de Uso de Cores

### ✅ SEMPRE USE (Cores Semânticas via CSS Variables):
```tsx
/* Backgrounds principais */
<div className="bg-background">                 {/* Fundo página */}
<Card className="bg-white">                      {/* Cards brancos */}
<div className="bg-glass-purple">                {/* Glass effect */}

/* Textos com hierarquia */
<h1 className="text-foreground">                 {/* Texto principal */}
<p className="text-muted-foreground">            {/* Texto secundário */}
<span className="text-muted-foreground/70">      {/* Texto terciário */}

/* Links e CTAs */
<a className="text-primary">                     {/* Links */}
<Button>                                         {/* CTAs (primary por padrão) */}

/* Bordas */
<Card className="border">                        {/* Bordas suaves */}
```

### ❌ NUNCA FAZER:
```tsx
/* NÃO sobrescrever Button variants */
<Button className="px-4 py-2">                   ❌
<Button className="hover:bg-blue-600">           ❌
<Button className="bg-blue-500 text-white">      ❌

/* NÃO aninhar interactive elements */
<Link><Button>...</Button></Link>                ❌
<a><button>...</button></a>                      ❌

/* USE ISSO */
<Button onClick={() => setLocation(...)}>        ✅
<Link>Texto do Link</Link>                       ✅
```

---

## 📄 Key Page Layouts

### Homepage/Landing
**Estrutura**:
1. **Navbar**: Glass white com blur, sticky
2. **Hero section**: Gradiente azul suave, headline grande
3. **Market grid**: 3 colunas desktop, gap-6
4. **Footer**: Minimalista

**Background da Página**:
```tsx
<div className="min-h-screen bg-background">
```

### Market Cards (Grid View)
```tsx
<Card className="bg-white border shadow-card hover:shadow-md transition-shadow">
  <div className="p-6 space-y-4">
    <Badge className="bg-purple-50 text-primary">
      Política
    </Badge>
    <h3 className="font-semibold text-foreground">
      Título do Mercado
    </h3>
    <div className="grid grid-cols-2 gap-2">
      <Button variant="actionYes" size="sm">SIM</Button>
      <Button variant="actionNo" size="sm">NÃO</Button>
    </div>
  </div>
</Card>
```

---

## Accessibility

- Alto contraste: WCAG AA mínimo (4.5:1 para texto)
- Labels ARIA em todas interações
- Estados de foco visíveis: `ring-2 ring-primary`
- Semântica HTML correta: Sem aninhamento de `<a><button>`
- Screen reader friendly: `sr-only` para contexto
- Cores não são único indicador (usar ícones também)

---

## Design Checklist

✅ Fundos brancos claros com gradientes roxos sutis
✅ Textos escuros com hierarquia clara (dark > medium > light)
✅ Roxo tech vibrante como cor primária (#7A4CFF)
✅ Botões SIM roxo e NÃO vermelho (variants corretos)
✅ Cards brancos com bordas suaves e sombras roxas sutis
✅ Navbar glass white com backdrop-blur
✅ Sistema hover-elevate preservado (sem overrides!)
✅ Sem aninhamento de interactive elements
✅ Espaçamento consistente (gap-6, gap-8)
✅ Tipografia Inter/Manrope
✅ Border radius suave (rounded-xl para cards)
✅ Transições rápidas (150-200ms)
✅ Ícones Lucide com cores semânticas
✅ Zero cores hardcoded (usar CSS variables)
✅ Semântica HTML correta

---

**Este design transmite:**
- 💼 Profissionalismo e confiança fintech
- 🚀 Modernidade tech, criatividade e inovação
- 🎯 Clareza e facilidade de uso
- 🇧🇷 Acessibilidade brasileira com identidade premium
- ⚡ Credibilidade institucional com toque de criatividade
