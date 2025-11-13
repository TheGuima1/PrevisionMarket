# Palpites.AI Design Guidelines - Identidade Visual 3BIT

## Design Approach
**3BIT Visual Identity**: Identidade visual moderna com **verde-turquesa** (#14B8A6) como cor primária, dark mode em **tom roxo/vinho escuro** (#2E1B2C), e design conversacional e acessível. O sistema equilibra profissionalismo financeiro com simplicidade brasileira, evitando jargões técnicos e priorizando clareza.

## Core Design Principles
1. **Radical Simplicity**: Uma mensagem clara por seção, sem cramped layouts
2. **Whitespace Generoso**: Espaçamento respirável, nunca corporate ou apertado
3. **Conversacional**: Zero jargão técnico - "Simples assim" em vez de "Processo otimizado"
4. **Confiança através da Calma**: Experiência espaçosa e sem pressa

---

## 🌈 Paleta de Cores 3BIT

### Cor Primária (Verde-Turquesa/Ciano)
```css
--primary: 173 80% 40%             /* #14B8A6 - Verde-turquesa */
--primary-foreground: 0 0% 100%    /* Branco sobre primária */
```
**Uso**: Botões principais, CTAs, links importantes, destaques, ícones

### Modo Claro (Light Mode) - Fundo Limpo e Claro
```css
--background: 0 0% 99%             /* #FCFCFC - Fundo quase branco */
--foreground: 0 0% 10%             /* #1A1A1A - Texto escuro */
--card: 0 0% 97%                   /* #F7F7F7 - Cards */
--border: 0 0% 90%                 /* #E5E5E5 - Bordas */
--muted: 0 0% 95%                  /* Texto secundário */
```

### Modo Escuro (Dark Mode) - Tom Roxo/Vinho Escuro (Referência 3BIT)
```css
--background: 320 35% 14%          /* #2E1B2C - Roxo/vinho escuro */
--foreground: 0 0% 95%             /* #F2F2F2 - Texto claro */
--card: 310 30% 22%                /* #4A2847 - Cards roxos */
--border: 310 25% 22%              /* Bordas roxas */
--sidebar: 315 32% 18%             /* Sidebar roxa */
```

### Cores de Suporte
```css
--destructive: 0 72% 50%           /* Vermelho ações destrutivas */
--chart-1: 173 80% 40%             /* Verde-turquesa - gráficos */
--chart-2: 320 35% 50%             /* Roxo/vinho - gráficos */
--chart-3: 280 40% 55%             /* Violeta - gráficos */
--chart-4: 200 60% 50%             /* Azul - gráficos */
--chart-5: 150 55% 45%             /* Verde - gráficos */
```

---

## 🔤 Typography

**Font System**:
- Primary: **Inter** (Google Fonts) - clean, modern, excelente para dados
- Accent: **Outfit** (Google Fonts) - amigável, conversacional para headings

**Hierarquia de Tamanhos**:
- Hero Headlines: `text-5xl md:text-6xl lg:text-7xl`, `font-bold` (Outfit)
- Section Headers: `text-3xl md:text-4xl lg:text-5xl`, `font-semibold`
- Subheadings: `text-xl md:text-2xl`, `font-medium`
- Body Text: `text-base md:text-lg`, `leading-relaxed`
- Captions/Labels: `text-sm`, `font-medium`
- Buttons: `text-base md:text-lg`, `font-semibold`

**Tom Conversacional**:
- ❌ NÃO use: "Tokenização de BRL", "Processo otimizado", "Sistema blockchain"
- ✅ USE: "Transforme seu Real em Real Digital", "Simples assim", "Seguro e transparente"

---

## 📐 Layout e Espaçamento

### Espaçamento Vertical (Generoso e Respirável)
```css
Seções:           py-16 md:py-24 lg:py-32
Componentes:      gap-8 até gap-16
Blocos de texto:  space-y-6 até space-y-12
```

### Containers
```css
Full-width sections:  max-w-7xl px-6 md:px-8
Texto longo:          max-w-3xl (melhor legibilidade)
Grids multi-coluna:   max-w-6xl
```

### Border Radius
```css
--radius: 0.5rem   /* 8px - Cantos arredondados sutis */
```

---

## 🎴 Componentes Visuais

### Cards
- **Estilo**: Bordas sutis com `border-primary/30` para destaque, **sem sombras pesadas**
- **Padding**: `p-8` ou `p-6`
- **Gap entre cards**: `gap-8`
- **Background**: `bg-card` (levemente elevado do fundo)
- **Dark mode**: Cards roxos (#4A2847) sobre fundo roxo escuro (#2E1B2C)

### Botões
**Primário** (Verde-turquesa):
```css
bg-primary text-primary-foreground
rounded-lg px-6 py-3
hover: efeito de elevação sutil (hover-elevate)
```

**Secundário**:
```css
bg-secondary text-secondary-foreground
outline variant com border
```

### Badges
- Usar `bg-primary/10 text-primary border-primary/30` para badges de destaque
- Evitar cores hardcoded como `purple-500` ou `indigo-600`

### Inputs/Forms
```css
Inputs:  border-2 rounded-lg p-4
Focus:   ring-2 ring-primary (verde-turquesa)
Labels:  Acima do input, font-medium
```

---

## ✨ Efeitos Especiais

### Sistema de Elevação (Hover/Active)
```css
/* Elevação no hover - sutil */
.hover-elevate:hover {
  background overlay: rgba(20,184,166, 0.04) em light mode
  background overlay: rgba(20,184,166, 0.08) em dark mode
}

/* Elevação no click - mais pronunciada */
.active-elevate-2:active {
  background overlay: rgba(20,184,166, 0.12) em light mode
  background overlay: rgba(20,184,166, 0.15) em dark mode
}
```

### Glassmorphism (Cards Premium)
```css
backdrop-filter: blur(12px)
background: rgba(20, 184, 166, 0.1) em dark mode
background: rgba(0, 0, 0, 0.05) em light mode
border: 1px solid rgba(20, 184, 166, 0.2)
```

### Gradientes (Hero Sections)
```css
/* Gradiente verde-turquesa/roxo para backgrounds */
background: linear-gradient(135deg, 
  hsl(173, 80%, 40%) 0%,    /* Verde-turquesa */
  hsl(320, 35%, 50%) 100%   /* Roxo/vinho */
);
```

---

## 🖼️ Imagens e Ícones

**Ícones**: Lucide React (linha fina, minimalista)

**Estilo de Imagens**:
- Fotografia moderna + overlays digitais sutis
- **NÃO**: Stock photos corporativas
- **SIM**: Interface limpa, tecnologia moderna, pessoas reais usando mobile banking

**Hero Background**:
```css
/* Overlay escuro sobre imagem para legibilidade */
background: linear-gradient(rgba(46, 27, 44, 0.7), rgba(46, 27, 44, 0.9))
```

---

## 🎬 Animações (Mínimas e Propositais)

```css
/* Fade-in ao scroll - sutil */
transition: opacity 0.6s ease-out

/* Hover em cards - lift sutil */
transition: transform 0.2s ease
hover: -translate-y-1

/* EVITAR: Animações distrativas, movimentos excessivos */
```

---

## 📱 Responsividade

### Breakpoints Tailwind
```css
sm:  640px
md:  768px
lg:  1024px
xl:  1280px
2xl: 1536px
```

### Pattern Mobile-First
```css
className="text-base md:text-lg lg:text-xl"
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
className="py-8 md:py-16 lg:py-24"
```

---

## 🎯 Padrão de Cores em Componentes

### ✅ SEMPRE USE (Cores Semânticas):
```tsx
// Botões principais
<Button className="bg-primary text-primary-foreground">

// Badges de destaque
<Badge className="bg-primary/10 text-primary border-primary/30">

// Links e ícones importantes
<Link className="text-primary hover:text-primary/80">

// Bordas de cards especiais
<Card className="border-primary/30">

// Texto de destaque
<span className="text-primary">
```

### ❌ NUNCA USE (Cores Hardcoded):
```tsx
// NÃO usar cores literais do Tailwind
className="bg-purple-500"    ❌
className="text-indigo-400"  ❌
className="border-violet-600" ❌

// EXCEÇÕES (permitido em casos específicos):
// - Gráficos com paleta fixa (usar hsl() das variáveis CSS)
// - Componentes externos que exigem hex colors
```

---

## Component Library

### Navigation
- **Top Navigation Bar**: Sticky, full-width, altura `h-16`
  - Logo esquerda (verde-turquesa), navegação principal centro
  - User menu + saldo wallet direita
  - Barra de busca com autocomplete de mercados
  - Toggle AI assistant (ícone cachorro) acessível de qualquer página

### Market Cards
- **Compact Card** (grid view):
  - Título do mercado, badge verde-turquesa, odds atuais proeminentes
  - Bordas `border-primary/30` para destaque sutil
  - Mini indicador de volume e contagem de participantes
  - Botões de ação rápida YES/NO
  - Hover state com `hover-elevate`
  
- **Expanded Card** (detail view):
  - Descrição completa do mercado e critérios de resolução
  - Preview do order book (top 5 bids/asks)
  - Toggle de odds em três formatos (Decimal/Americano/Porcentagem)
  - Gráfico mostrando probabilidade ao longo do tempo (cores do chart)
  - Métricas de volume, liquidez e atividade

### Trading Interface
- **Order Entry Panel**:
  - Botões grandes YES/NO toggle (estilo pill)
  - Input de valor com display de saldo
  - Payout calculado mostrado proeminentemente
  - Seletor de tipo de ordem (Market/Limit)
  - Botão confirmar verde-turquesa com odds finais claras
  
- **Position Display**:
  - Tabela mostrando posições ativas
  - Valor atual, P&L com mudança percentual
  - Ações rápidas de vender/fechar

### AI Assistant (Cachorro Mascot)
- **Floating Widget**: Canto inferior direito, expansível, cor primária verde-turquesa
- **Expanded View**: 
  - Interface de chat com avatar amigável do cachorro
  - Botões de ação rápida verde-turquesa
  - Respostas contextuais baseadas na página atual
  - Formatação estilo Markdown para explicações

---

## Key Page Layouts

### Homepage/Dashboard
- Hero section: Grande headline com explicação da plataforma
- Fundo dark mode: Roxo escuro (#2E1B2C) com gradiente sutil
- Cards de mercados com bordas verde-turquesa
- Categorias de mercados como tabs/pills horizontais
- Grid de mercados em destaque (3 colunas desktop)
- Preview do leaderboard na sidebar
- Card de introdução do AI assistant

### Market Detail Page
- Layout duas colunas: Info do mercado esquerda (60%), Trading panel direita (40%)
- Gráfico de probabilidade full-width com cores da paleta (chart-1 a chart-5)
- Seção de discussão abaixo do gráfico
- Sidebar de mercados relacionados

### Portfolio Page
- Cards de resumo: Valor Total, P&L Hoje, Taxa de Acerto
- Tabela de posições ativas com filtros
- Timeline de histórico de transações
- Gráfico de performance ao longo do tempo (cores do chart)

---

## Accessibility

- Alto contraste para dados financeiros (odds, preços, P&L)
- Labels ARIA em todas as ações de trading
- Atalhos de teclado para trading rápido (documentado no help)
- Confirmações de ordem friendly para screen readers
- Estados de foco verde-turquesa consistentes em elementos interativos
- Dark mode roxo/vinho com contraste adequado para legibilidade
