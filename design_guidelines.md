# Palpites.AI Design Guidelines - Identidade Visual 3BIT

## Design Approach
**3BIT Visual Identity**: Identidade visual moderna com laranja institucional como cor primária, dark mode em tom vinho/roxo, e design conversacional e acessível. O sistema equilibra profissionalismo financeiro com simplicidade brasileira, evitando jargões técnicos e priorizando clareza.

## Core Design Principles
1. **Radical Simplicity**: Uma mensagem clara por seção, sem cramped layouts
2. **Whitespace Generoso**: Espaçamento respirável, nunca corporate ou apertado
3. **Conversacional**: Zero jargão técnico - "Simples assim" em vez de "Processo otimizado"
4. **Confiança através da Calma**: Experiência espaçosa e sem pressa

---

## 🌈 Paleta de Cores 3BIT

### Cor Primária (Laranja/Cobre Institucional)
```css
--primary: 18 75% 48%              /* #D96029 - Laranja institucional */
--primary-foreground: 18 75% 98%   /* Texto sobre primária */
```
**Uso**: Botões principais, CTAs, links importantes, destaques

### Modo Claro (Light Mode)
```css
--background: 0 0% 98%             /* #FAFAFA - Fundo geral */
--foreground: 0 0% 12%             /* #1F1F1F - Texto principal */
--card: 0 0% 96%                   /* #F5F5F5 - Cards */
--border: 0 0% 88%                 /* #E0E0E0 - Bordas */
--muted: 0 2% 89%                  /* #E3E3E3 - Texto secundário */
```

### Modo Escuro (Dark Mode) - Tom Vinho/Roxo
```css
--background: 330 45% 8%           /* #140A0F - Fundo escuro vinho */
--foreground: 330 5% 92%           /* #EBE9EA - Texto claro */
--card: 330 5% 10%                 /* #1A1518 - Cards escuros */
--border: 330 5% 18%               /* #2E2729 - Bordas */
--sidebar: 330 5% 12%              /* #1F181C - Sidebar */
```

### Cores de Suporte
```css
--destructive: 0 72% 42%           /* Vermelho ações destrutivas */
--chart-1: 18 75% 48%              /* Laranja - gráficos */
--chart-2: 330 45% 38%             /* Roxo - gráficos */
--chart-3: 280 30% 42%             /* Violeta - gráficos */
--chart-4: 200 55% 45%             /* Azul - gráficos */
--chart-5: 150 50% 40%             /* Verde - gráficos */
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
- **Estilo**: Bordas sutis, **sem sombras pesadas**
- **Padding**: `p-8`
- **Gap entre cards**: `gap-8`
- **Background**: `bg-card` (levemente elevado do fundo)

### Botões
**Primário**:
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

### Inputs/Forms
```css
Inputs:  border-2 rounded-lg p-4
Focus:   ring-2 ring-primary
Labels:  Acima do input, font-medium
```

---

## ✨ Efeitos Especiais

### Sistema de Elevação (Hover/Active)
```css
/* Elevação no hover - sutil */
.hover-elevate:hover {
  background overlay: rgba(217,96,41, 0.04) em light mode
  background overlay: rgba(255,255,255, 0.04) em dark mode
}

/* Elevação no click - mais pronunciada */
.active-elevate-2:active {
  background overlay: rgba(217,96,41, 0.12) em light mode
  background overlay: rgba(255,255,255, 0.09) em dark mode
}
```

### Glassmorphism (Cards Premium)
```css
backdrop-filter: blur(12px)
background: rgba(255, 255, 255, 0.1) em dark mode
background: rgba(0, 0, 0, 0.05) em light mode
border: 1px solid rgba(255, 255, 255, 0.2)
```

### Gradientes (Hero Sections)
```css
/* Gradiente laranja/roxo para backgrounds */
background: linear-gradient(135deg, 
  hsl(18, 75%, 48%) 0%,    /* Laranja */
  hsl(330, 45%, 38%) 100%  /* Roxo vinho */
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
background: linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6))
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

## Component Library

### Navigation
- **Top Navigation Bar**: Sticky, full-width, altura `h-16`
  - Logo esquerda, navegação principal centro
  - User menu + saldo wallet direita
  - Barra de busca com autocomplete de mercados
  - Toggle AI assistant (ícone cachorro) acessível de qualquer página

### Market Cards
- **Compact Card** (grid view):
  - Título do mercado, badge de categoria, odds atuais proeminentes
  - Mini indicador de volume e contagem de participantes
  - Botões de ação rápida YES/NO
  - Hover state mostra mais detalhes
  
- **Expanded Card** (detail view):
  - Descrição completa do mercado e critérios de resolução
  - Preview do order book (top 5 bids/asks)
  - Toggle de odds em três formatos (Decimal/Americano/Porcentagem)
  - Gráfico mostrando probabilidade ao longo do tempo
  - Métricas de volume, liquidez e atividade

### Trading Interface
- **Order Entry Panel**:
  - Botões grandes YES/NO toggle (estilo pill)
  - Input de valor com display de saldo
  - Payout calculado mostrado proeminentemente
  - Seletor de tipo de ordem (Market/Limit)
  - Botão confirmar com odds finais claras
  
- **Position Display**:
  - Tabela mostrando posições ativas
  - Valor atual, P&L com mudança percentual
  - Ações rápidas de vender/fechar

### AI Assistant (Cachorro Mascot)
- **Floating Widget**: Canto inferior direito, expansível
- **Expanded View**: 
  - Interface de chat com avatar amigável do cachorro
  - Botões de ação rápida: "Explicar Odds", "Sentimento do Mercado", "Recomendar Mercados", "Como Funciona"
  - Respostas contextuais baseadas na página atual
  - Formatação estilo Markdown para explicações

### Discussion Pages
- **Per-Market Discussion**:
  - Comentários em thread estilo Reddit
  - Avatares de usuário com username e badges de reputação
  - Sistema de upvote/downvote
  - Filtrar por Top/Novo/Controverso
  - Editor de rich text para posts (negrito, itálico, links)

---

## Key Page Layouts

### Homepage/Dashboard
- Hero section: Grande headline "Aposte no Futuro do Brasil" com explicação da plataforma
- Categorias de mercados como tabs/pills horizontais abaixo do hero
- Grid de mercados em destaque (3 colunas desktop, mercados trending)
- Preview do leaderboard na sidebar
- Card de introdução do AI assistant

### Market Detail Page
- Layout duas colunas: Info do mercado esquerda (60%), Trading panel direita (40%)
- Gráfico de probabilidade full-width acima do fold
- Seção de discussão abaixo do gráfico (estilo Reddit)
- Sidebar de mercados relacionados

### Portfolio Page
- Cards de resumo: Valor Total, P&L Hoje, Taxa de Acerto
- Tabela de posições ativas com filtros
- Timeline de histórico de transações
- Gráfico de performance ao longo do tempo

---

## 🎯 Princípios de Design 3BIT

1. **Radical Simplicity**: Uma mensagem clara por seção
2. **Whitespace Generoso**: Nunca cramped ou corporate
3. **Conversacional**: Zero jargão técnico
4. **Confiança através da Calma**: Experiência espaçosa, sem pressa

---

## Accessibility

- Alto contraste para dados financeiros (odds, preços, P&L)
- Labels ARIA em todas as ações de trading
- Atalhos de teclado para trading rápido (documentado no help)
- Confirmações de ordem friendly para screen readers
- Estados de foco consistentes em elementos interativos
