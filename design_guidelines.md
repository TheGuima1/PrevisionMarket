# Palpites.AI Design Guidelines - Purple Dark Tech

## Design Approach
**Purple Dark Tech / Masculine Deep**: Design profissional com **fundos roxos muito escuros** (#0F0C34 → #1B134D), **glassmorphism** com transparência e blur, **gradientes roxos vibrantes** (#6D4BFF → #9A6AFF), e **contrastes fortes**. Visual moderno e imersivo que transmite **tech premium**, **profundidade** e **expertise financeira**, ideal para predicters sérios. Inspirado em plataformas fintech de alto nível.

## Core Design Principles
1. **Dark First**: Fundo roxo escuro profundo como base (#0F0C34)
2. **Glassmorphism**: Cards translúcidos com backdrop-blur e bordas luminosas
3. **Gradientes Vibrantes**: Roxo (#6D4BFF → #9A6AFF) para CTAs e elementos de destaque
4. **Alto Contraste**: Texto branco (#FFFFFF) sobre fundos escuros
5. **Efeitos Premium**: Sombras coloridas, glows sutis, transições suaves
6. **Target Masculino**: Design que apela para traders profissionais

---

## 🌈 Paleta - Purple Dark Tech

### Fundos Principais (Dark Purple Base)
```css
--bg-dark-primary: #0F0C34      /* Fundo principal escuro */
--bg-dark-secondary: #1B134D    /* Gradiente bottom */
--bg-dark-tertiary: #1E1248     /* Cards e containers */
```
**Uso**: Background principal (gradiente), sections, hero areas  
**Tom**: Roxo muito escuro, quase preto, profundo e profissional

### Glassmorphism (Cards Translúcidos)
```css
--glass-dark: rgba(30, 18, 72, 0.4)     /* #1E1248 com 40% opacidade */
--glass-border: rgba(155, 127, 255, 0.2) /* Borda luminosa */
--glass-glow: rgba(109, 75, 255, 0.15)   /* Sombra colorida */
```
**Uso**: Cards, panels, navbar, modals  
**Efeito**: `backdrop-filter: blur(10px)` + border luminosa

### Roxo Primário (Gradientes e CTAs)
```css
--primary-purple-1: #6D4BFF     /* Gradiente start */
--primary-purple-2: #9A6AFF     /* Gradiente end */
--primary-purple-3: #8A47FF     /* Secundário */
```
**Uso**: Botões gradientes, CTAs, elementos de destaque, hover states  
**Tom**: Roxo vibrante e saturado para visual premium

### Textos (High Contrast)
```css
--text-white: #FFFFFF           /* Títulos e texto principal */
--text-purple-light: #B9ABFF    /* Texto secundário */
--text-purple-muted: #8A7AAF    /* Texto terciário */
```
**Uso**: Hierarquia de texto (white > light > muted)  
**Contraste**: WCAG AA compliant

### Cores de Ação (YES/NO - Gradientes)
```css
--action-yes: linear-gradient(135deg, #6D4BFF 0%, #9A6AFF 100%)
--action-no: linear-gradient(135deg, #E8334F 0%, #FF4D6D 100%)
```
**Uso**: Botões SIM (roxo gradiente) e NÃO (vermelho gradiente)  
**Tom**: Gradientes vibrantes com alto impacto visual

### Cores de Acento (Opcionais)
```css
--accent-cyan: #50E3C2          /* Verde-azulado tech */
--accent-pink: #FF4D97           /* Rosa vibrante */
```
**Uso**: Destaques especiais, ícones, badges

### Cores Semânticas
```css
--success: #00C48C              /* Verde tech */
--warning: #FFB547              /* Laranja aviso */
--error: #E8334F                /* Vermelho erro */
--info: #4DA6FF                 /* Azul informação */
```

---

## 🔤 Typography - Fintech Premium Dark

**Font System**:
- Primary: **Inter** (600 para títulos, 400 para body)
- Accent: **Poppins** ou **Manrope** para headlines grandes
- Mono: **Roboto Mono** para valores numéricos

**Hierarquia de Tamanhos**:
```css
/* Headlines grandes - Landing pages */
Hero: text-4xl md:text-6xl, font-bold, text-white

/* Section headers */
H1: text-3xl md:text-4xl, font-semibold, text-white
H2: text-2xl md:text-3xl, font-semibold, text-white
H3: text-xl md:text-2xl, font-medium, text-purple-light

/* Body text */
Large: text-lg, text-purple-light
Base: text-base, text-purple-light
Small: text-sm, text-purple-muted

/* Números e odds */
Odds grandes: text-3xl md:text-4xl, font-bold, font-mono, text-white
```

**Cores de Texto**:
- Títulos principais: `text-white` (#FFFFFF)
- Texto secundário: `text-purple-light` (#B9ABFF)
- Texto terciário: `text-purple-muted` (#8A7AAF)

---

## 📐 Layout e Espaçamento

### Espaçamento Vertical
```css
Seções grandes:      py-16 md:py-24
Seções médias:       py-12 md:py-16
Cards internos:      p-6 md:p-8
Elementos pequenos:  p-4

Gap entre elementos:
  Grande: gap-8 md:gap-12
  Médio: gap-6 md:gap-8
  Pequeno: gap-4
```

### Border Radius (Moderno e Suave)
```css
Cards: rounded-2xl (16px)
Buttons: rounded-xl (12px)
Inputs: rounded-lg (8px)
Badges: rounded-lg (8px)
Icons: rounded-full (círculos perfeitos)
```

---

## 🎴 Componentes Visuais - Purple Dark Tech

### Navbar (Glassmorphism)
```tsx
<nav className="fixed top-0 w-full z-50 bg-[#1E1248]/60 backdrop-blur-md border-b border-white/10">
  <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
    <Logo className="text-white" />
    <div className="flex items-center gap-4">
      <Button variant="ghost" className="text-purple-light">Login</Button>
      <Button className="bg-gradient-to-r from-[#6D4BFF] to-[#9A6AFF]">
        Criar Conta
      </Button>
    </div>
  </div>
</nav>
```

**Características**:
- Background: Semi-transparente (#1E1248 60% opacity)
- Blur: `backdrop-filter: blur(10px)`
- Borda: Sutil branca/roxa com baixa opacidade
- Sticky/Fixed: `fixed top-0 z-50`

### Cards (Glassmorphism)
```tsx
<div className="bg-[#1E1248]/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 shadow-[0_8px_32px_rgba(109,75,255,0.15)]">
  {/* Conteúdo */}
</div>
```

**Características**:
- Fundo: Translúcido (#1E1248 40% opacity)
- Blur: `backdrop-filter: blur(16px)`
- Borda: Branca/roxa luminosa (white/10 ou purple/20)
- Sombra: Colorida com glow roxo
- Radius: `rounded-2xl` (16px)

### Botões (Gradientes Vibrantes)

**Primário (Gradiente Roxo)**:
```tsx
<button className="bg-gradient-to-r from-[#6D4BFF] to-[#9A6AFF] text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
  Depositar via PIX
</button>
```

**Botão SIM**:
```tsx
<button className="bg-gradient-to-r from-[#6D4BFF] to-[#9A6AFF] text-white w-full py-3 rounded-xl font-semibold">
  SIM
</button>
```

**Botão NÃO**:
```tsx
<button className="bg-gradient-to-r from-[#E8334F] to-[#FF4D6D] text-white w-full py-3 rounded-xl font-semibold">
  NÃO
</button>
```

**Secundário (Outline)**:
```tsx
<button className="border-2 border-purple-500/30 text-purple-light bg-transparent px-6 py-3 rounded-xl hover:bg-purple-500/10">
  Ver Detalhes
</button>
```

**Estados**:
- Hover: Aumentar sombra (`hover:shadow-xl`) e leve escurecimento
- Transições: `transition-all duration-200`

### Ícones em Círculos (Gradiente + Glow)
```tsx
<div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#6D4BFF] to-[#9A6AFF] flex items-center justify-center shadow-lg shadow-purple-500/50">
  <Icon className="w-8 h-8 text-white" />
</div>
```

**Características**:
- Tamanho: 40-64px de diâmetro
- Background: Gradiente roxo
- Sombra: Glow colorido (`shadow-purple-500/50`)
- Ícone: Branco centralizado

### Market Cards (Com Gráfico)
```tsx
<div className="bg-[#1E1248]/40 backdrop-blur-lg border border-white/10 rounded-2xl p-6 hover:border-purple-500/30 transition-all">
  {/* Badge categoria */}
  <span className="bg-purple-900/50 text-purple-200 px-3 py-1 rounded-lg text-xs font-semibold">
    Política
  </span>
  
  {/* Título */}
  <h3 className="text-xl font-bold text-white mt-4">
    Título do Mercado
  </h3>
  
  {/* Gráfico placeholder */}
  <div className="h-24 bg-gradient-to-r from-purple-600/20 to-purple-400/20 rounded-lg mt-4">
    {/* Mini line chart */}
  </div>
  
  {/* Odds */}
  <div className="grid grid-cols-2 gap-4 mt-4">
    <button className="bg-gradient-to-r from-[#6D4BFF] to-[#9A6AFF] text-white py-3 rounded-xl">
      SIM 65%
    </button>
    <button className="bg-gradient-to-r from-[#E8334F] to-[#FF4D6D] text-white py-3 rounded-xl">
      NÃO 35%
    </button>
  </div>
</div>
```

---

## ✨ Efeitos Especiais - Tech Premium

### Background Gradiente (Body)
```css
body {
  background: linear-gradient(180deg, #0F0C34 0%, #1B134D 100%);
  min-height: 100vh;
}
```

### Glassmorphism Effect
```css
.glass-card {
  background: rgba(30, 18, 72, 0.4);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(109, 75, 255, 0.15);
}
```

### Glow Effects
```css
.glow-purple {
  box-shadow: 0 0 20px rgba(109, 75, 255, 0.5);
}

.glow-text {
  text-shadow: 0 0 20px rgba(155, 127, 255, 0.5);
}
```

### Transições
```css
transition-all duration-200  /* Padrão */
transition-shadow duration-300  /* Glow effects */
```

---

## 📱 Responsividade

### Patterns Mobile-First
```tsx
/* Hero text */
className="text-3xl md:text-5xl lg:text-6xl"

/* Grids */
className="grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

/* Cards em lista mobile */
className="flex flex-col md:flex-row gap-4"
```

---

## 🎯 Key Page Layouts

### Homepage/Landing
**Estrutura**:
1. **Navbar**: Glassmorphism fixo no topo
2. **Hero**: Gradiente dark, headline branca grande, CTA gradiente roxo
3. **Feature Icons**: 4 círculos com ícones em gradiente (Instantâneo, Seguro, 1:1, Transparência)
4. **Market Grid**: Cards glassmorphism com gráficos
5. **Como Funciona**: Steps com círculos numerados gradientes
6. **Footer**: Minimalista escuro

**Background**:
```tsx
<div className="min-h-screen bg-gradient-to-b from-[#0F0C34] to-[#1B134D]">
```

### Autenticação (Login/Cadastro)
**Layout**:
- Formulário em card glassmorphism centralizado
- Inputs com fundo #241A5C, borda roxa, texto branco
- Lado direito com bullets e ícones coloridos
- Background gradiente escuro

---

## Accessibility

- **Contraste**: WCAG AA mínimo (texto branco em fundo escuro = >10:1)
- **Focus States**: `ring-2 ring-purple-500`
- **Labels ARIA**: Em todos os interactive elements
- **Keyboard Navigation**: Tab order lógico

---

## Design Checklist

✅ Fundo gradiente roxo escuro (#0F0C34 → #1B134D)
✅ Cards com glassmorphism (translúcidos + blur)
✅ Bordas luminosas (white/10 ou purple/20)
✅ Botões com gradientes vibrantes (roxo e vermelho)
✅ Texto branco/roxo claro para alto contraste
✅ Ícones em círculos com gradiente + glow
✅ Navbar glass com backdrop-blur
✅ Sombras coloridas (glow roxo)
✅ Transições suaves (200-300ms)
✅ Border radius moderno (16px cards, 12px buttons)
✅ Tipografia Inter/Poppins
✅ Responsivo mobile-first
✅ WCAG AA contrast ratio

---

**Este design transmite:**
- 💎 Premium tech de alto nível
- 🌌 Profundidade e imersão
- ⚡ Modernidade e inovação
- 🎯 Seriedade financeira
- 🇧🇷 Plataforma profissional brasileira
