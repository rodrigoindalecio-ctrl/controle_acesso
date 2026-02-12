# 🎨 DESIGN SYSTEM — Sistema Premium de Eventos

**Elegância, Serenidade, Confiança** — Uma identidade visual que celebra momentos especiais.

---

## 📋 ÍNDICE

1. [Visão Geral](#visão-geral)
2. [Paleta de Cores](#paleta-de-cores)
3. [Tipografia](#tipografia)
4. [Espaçamento & Grid](#espaçamento--grid)
5. [Componentes Base](#componentes-base)
6. [Padrões de Layout](#padrões-de-layout)
7. [Diretrizes de Uso](#diretrizes-de-uso)

---

## 🎯 VISÃO GERAL

### Princípios

- **Elegância Sutil**: Sem exagero, sem corporatismo
- **Serenidade Visual**: Reduzir ansiedade, aumentar conforto
- **Inclusividade**: Legível em mobile/tablet por horas
- **Emoção Contida**: Refletir a importância do momento
- **Premium Acessível**: Luxo sem inacessibilidade

### Tom de Voz Visual

- Casamento: _Tranquilidade, confiança, sofisticação_
- Debutante: _Leveza, celebração, sofisticação jovem_
- Staff: _Eficiência, clareza, suporte_

---

## 🎨 PALETA DE CORES

### Cores Primárias (Já implementadas, aprimoradas)

```css
--color-primary-dark:   #b8845a  /* Dourado quente escuro */
--color-primary:        #d4a574  /* Dourado quente suave (PRINCIPAL) */
--color-primary-light:  #e8c5a3  /* Dourado suave, backgrounds */
--color-primary-pale:   #f4ebe3  /* Muito claro, hover states */
```

**Uso**: Títulos, destaques, borders de destaque, botões primários.

### Cores Neutras (Sistema estabelecido)

```css
--color-dark:           #2d2d2d  /* Texto principal, headers */
--color-text:           #4a4a4a  /* Corpo de texto */
--color-text-muted:     #a0a0a0  /* Labels, helper text */
--color-border:         #e0d5cc  /* Borders suaves */
--color-bg-light:       #f5f0eb  /* Background secundário */
--color-bg-lighter:     #faf7f2  /* Background principal */
--color-white:          #ffffff  /* Cards, modals puros */
```

**Uso**: Estrutura, legibilidade, backgrounds confortáveis.

### Cores de Status (Dessaturadas, sofisticadas)

```css
--color-success:        #6ba583  /* Verde suave (checkmarks) */
--color-success-light:  #e8f5e9  /* Fundo sucesso */
--color-success-dark:   #4a7c5e  /* Hover/active */

--color-warning:        #d9b57a  /* Dourado quente (avisos) */
--color-warning-light:  #fef4e6  /* Fundo aviso */

--color-danger:         #c97e7e  /* Rosa queimado (erros) */
--color-danger-light:   #ffebee  /* Fundo erro */
--color-danger-dark:    #a64444  /* Hover/active */

--color-info:           #8ab4d8  /* Azul suave (informações) */
--color-info-light:     #e3f2fd  /* Fundo info */
```

**Uso**: Feedback, notificações, estados visuais.

### Mapeamento de Uso

| Elemento | Cor | Notas |
|----------|-----|-------|
| Título, Header | `--color-dark` | Peso 700 |
| Texto corpo | `--color-text` | Peso 400-500 |
| Label, helper | `--color-text-muted` | Peso 400 |
| Botão primário | `--color-primary` | Com hover escuro |
| Border card | `--color-border` | Sutil, 1px |
| Check-in sucesso | `--color-success` | Verde suave |
| Undo erro | `--color-danger` | Rosa queimado |
| Aviso/limite tempo | `--color-warning` | Dourado claro |
| Background padrão | `--color-bg-lighter` | Gradient leve |
| Card/Modal | `--color-white` | Shadow suave |

---

## ✍️ TIPOGRAFIA

### Famílias

```css
--font-primary:  -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif
--font-serif:    'Playfair Display', 'Libre Baskerville', 'Georgia', serif
```

**Rationale**:
- `font-primary`: Legível em telas, boa renderização mobile
- `font-serif`: Elegância em títulos, Premium feel

### Hierarquia

| Elemento | Tamanho | Peso | Família | Uso |
|----------|---------|------|---------|-----|
| **H1** | 2.5rem (40px) | 700 | Serif | Título de página |
| **H2** | 2rem (32px) | 700 | Serif | Seção principal |
| **H3** | 1.5rem (24px) | 700 | Serif | Subtítulo |
| **H4** | 1.25rem (20px) | 600 | Sans | Subtítulo menor |
| **Body Large** | 1rem (16px) | 500 | Sans | Texto principal |
| **Body Normal** | 0.95rem (15px) | 400 | Sans | Corpo padrão |
| **Small** | 0.875rem (14px) | 400 | Sans | Helper text, labels |
| **Tiny** | 0.75rem (12px) | 500 | Sans | Metadata, timestamps |

### Line-height

- Títulos (H1-H4): `1.2` (compacto, elegante)
- Corpo (Body): `1.6` (confortável para leitura)
- Small/Tiny: `1.4` (legível mesmo pequeno)

### Letter-spacing

- Títulos: `-0.5px` (tighter, premium)
- Labels/Small: `0.3px` (clarity)
- Resto: `normal`

---

## 📐 ESPAÇAMENTO & GRID

### Escala de Espaçamento

```css
--spacing-xs:   0.25rem (4px)
--spacing-sm:   0.5rem (8px)
--spacing-md:   1rem (16px)
--spacing-lg:   1.5rem (24px)
--spacing-xl:   2rem (32px)
--spacing-2xl:  3rem (48px)
```

**Uso**: Montar composições em múltiplos de 8px para harmonia.

### Grid Layout

```css
Container padding:    var(--spacing-xl) em desktop
                      var(--spacing-lg) em tablet
                      var(--spacing-md) em mobile

Card padding:         var(--spacing-lg)
Modal padding:        var(--spacing-xl)
Button padding:       var(--spacing-md) var(--spacing-lg)
Input padding:        var(--spacing-md)
```

### Gaps (Flexbox/Grid)

```css
Horizontal gap:       var(--spacing-md)
Vertical gap:         var(--spacing-lg)
Dense grid:           var(--spacing-sm)
Loose grid:           var(--spacing-2xl)
```

---

## 🧩 COMPONENTES BASE

### Shadows (Profundidade)

```css
--shadow-sm:   0 2px 4px rgba(0, 0, 0, 0.04)      /* Hover subtle */
--shadow-md:   0 2px 8px rgba(0, 0, 0, 0.08)      /* Card padrão */
--shadow-lg:   0 8px 16px rgba(0, 0, 0, 0.12)     /* Elevated */
--shadow-xl:   0 12px 24px rgba(0, 0, 0, 0.15)    /* Modal, dropdown */
```

**Uso**: Shadow cresce com elevação; não usar preto 100%.

### Border Radius

```css
--radius-sm:   4px   /* Inputs, small buttons */
--radius-md:   6px   /* Cards, modals */
--radius-lg:   8px   /* Larger containers */
--radius-xl:   12px  /* Rounded-heavy (opcional, raro) */
```

**Padrão**: Predominar `--radius-md` (6px).

### Transitions

```css
--transition-fast:   0.2s ease    /* Hover, quick interactions */
--transition-base:   0.3s ease    /* Default animations */
--transition-slow:   0.5s ease    /* Page transitions, modals */
```

### BOTÕES

#### Primário (Ação principal)

```css
.btn-primary {
  background: var(--color-primary);
  color: white;
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 600;
  font-size: 0.95rem;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.btn-primary:hover {
  background: var(--color-primary-dark);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-primary:disabled {
  background: var(--color-text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}
```

#### Secundário (Ação suporte)

```css
.btn-secondary {
  background: var(--color-white);
  color: var(--color-dark);
  border: 1px solid var(--color-border);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-secondary:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
  background: var(--color-primary-pale);
  box-shadow: var(--shadow-sm);
}
```

#### Perigo (Undo, delete)

```css
.btn-danger {
  background: transparent;
  color: var(--color-danger);
  border: 1px solid var(--color-danger);
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-danger:hover {
  background: var(--color-danger-light);
  border-color: var(--color-danger-dark);
}
```

### CARDS

```css
.card {
  background: var(--color-white);
  border-radius: var(--radius-md);
  border: 1px solid var(--color-border);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--color-primary-light);
}

/* Variante elevada */
.card-elevated {
  box-shadow: var(--shadow-md);
}

/* Variante subtle (sem border) */
.card-subtle {
  border: none;
  background: var(--color-bg-light);
  box-shadow: none;
  padding: var(--spacing-lg);
}
```

### INPUTS / FORMULÁRIOS

```css
.input {
  width: 100%;
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: var(--font-primary);
  font-size: 0.95rem;
  color: var(--color-text);
  transition: border-color var(--transition-fast);
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.input:disabled {
  background: var(--color-bg-light);
  color: var(--color-text-muted);
  cursor: not-allowed;
}

.input-error {
  border-color: var(--color-danger);
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(201, 126, 126, 0.1);
}

.label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-dark);
  margin-bottom: var(--spacing-sm);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.helper-text {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-top: var(--spacing-sm);
}

.error-text {
  font-size: 0.75rem;
  color: var(--color-danger);
  margin-top: var(--spacing-sm);
  font-weight: 500;
}
```

### MODALS

```css
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1099;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fadeIn 0.2s ease;
}

.modal {
  background: var(--color-white);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  animation: slideUp 0.3s ease;
  display: flex;
  flex-direction: column;
}

.modal-header {
  padding: var(--spacing-xl);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
}

.modal-header h2 {
  margin: 0;
  color: var(--color-dark);
}

.modal-body {
  padding: var(--spacing-xl);
  flex: 1;
  overflow-y: auto;
}

.modal-footer {
  padding: var(--spacing-xl);
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: var(--spacing-md);
  justify-content: flex-end;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### TOASTS / ALERTAS

```css
.toast {
  position: fixed;
  bottom: var(--spacing-lg);
  right: var(--spacing-lg);
  padding: var(--spacing-lg);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  font-size: 0.95rem;
  font-weight: 500;
  animation: slideUp 0.3s ease;
  z-index: 2000;
  max-width: 400px;
}

.toast-success {
  background: var(--color-success-light);
  border-left: 4px solid var(--color-success);
  color: var(--color-success-dark);
}

.toast-danger {
  background: var(--color-danger-light);
  border-left: 4px solid var(--color-danger);
  color: var(--color-danger-dark);
}

.toast-warning {
  background: var(--color-warning-light);
  border-left: 4px solid var(--color-warning);
  color: var(--color-dark);
}

.toast-info {
  background: var(--color-info-light);
  border-left: 4px solid var(--color-info);
  color: var(--color-dark);
}
```

### TABELAS

```css
.table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

.table thead {
  background: var(--color-bg-light);
  border-bottom: 2px solid var(--color-border);
}

.table thead th {
  padding: var(--spacing-md) var(--spacing-lg);
  text-align: left;
  font-weight: 700;
  color: var(--color-dark);
  text-transform: uppercase;
  font-size: 0.75rem;
  letter-spacing: 0.3px;
}

.table tbody td {
  padding: var(--spacing-md) var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text);
}

.table tbody tr:hover {
  background: var(--color-primary-pale);
}

.table tbody tr:last-child td {
  border-bottom: none;
}
```

---

## 📐 PADRÕES DE LAYOUT

### Dashboard / Página Principal

```
┌─────────────────────────────────────┐
│  Header (H1 Elegante)               │
│  Subtítulo (corpo muted)            │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Cards de Estatísticas (3 cols)     │
│  ├─ Card 1: Entraram                │
│  ├─ Card 2: Pendentes               │
│  └─ Card 3: Total                   │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Gráfico / Timeline (2 cols ou full)│
└─────────────────────────────────────┘
```

**Espaçamento**: `var(--spacing-xl)` entre seções.

### Check-in / Lista de Convidados

```
┌─────────────────────────────────────┐
│  [Search] [Filtros] [Botões]        │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Card Convidado 1                   │
│  ├─ Nome (H4 bold)                  │
│  ├─ Categoria (Small muted)         │
│  ├─ Status badge (sucesso/aviso)    │
│  └─ [Botão ação]                    │
└─────────────────────────────────────┘

┌─────────────────────────────────────┐
│  Card Convidado 2                   │
│  ...                                 │
└─────────────────────────────────────┘
```

**Variante Mobile**: Stack vertical, cards full-width.

### Modal de Undo

```
┌──────────────────────────────┐
│  Título Modal                │
├──────────────────────────────┤
│ Descrição clara do que vai   │
│ acontecer com o undo.        │
│                              │
│ [Textarea com placeholder]   │
│ Contador (X/255)             │
│ [Erro se houver]             │
├──────────────────────────────┤
│           [Cancelar] [Confirmar] │
└──────────────────────────────┘
```

---

## 🎯 DIRETRIZES DE USO

### Quando Usar Cada Cor

| Situação | Cor | Por quê |
|----------|-----|--------|
| Confirmação de entrada | `--color-success` | Verde = "está bem" |
| Erro de validação | `--color-danger` | Rosa queimado = grave mas não agressivo |
| Aviso (limite 30min) | `--color-warning` | Dourado = atenção sem pânico |
| Botão primário | `--color-primary` | Identidade visual |
| Texto secundário | `--color-text-muted` | Hierarquia clara |
| Background padrão | Gradient light | Conforto visual prolongado |

### Acessibilidade

- **Contraste**: Mínimo WCAG AA (4.5:1 para texto)
- **Fonts**: Sans-serif em corpo; serif em títulos
- **Mobile**: Min 16px para input em mobile (evita zoom)
- **Touch**: Botões min 44px height (fácil toque)
- **Cores**: Não confiar APENAS em cor; use ícones + cor

### Responsividade

```css
Desktop:  2-3 colunas, max-width 1200px
Tablet:   1-2 colunas, max-width 768px
Mobile:   1 coluna, full-width (com padding)
```

### Interações

- **Hover**: Shadow + cor + subtle lift (`translateY(-1px)`)
- **Active**: Shadow reduz, pressiona para baixo
- **Disabled**: Opacidade 60%, sem cursor pointer
- **Loading**: Spinner suave (girar suave, não violento)

### Animações

- **Modals**: Fade backdrop + slide up conteúdo (0.3s)
- **Toast**: Slide up + auto-dismiss (2s)
- **Transitions**: Máx 0.3s (rápido, responsivo)
- **Evitar**: Bounce, zoom, flash

---

## 📝 APLICAÇÕES IMEDIATAS

### 1. Atualizar `globals.css` com novas cores de status

```css
/* Em :root { ... } */
--color-success:        #6ba583;
--color-success-light:  #e8f5e9;
--color-success-dark:   #4a7c5e;

--color-warning:        #d9b57a;
--color-warning-light:  #fef4e6;

--color-danger:         #c97e7e;
--color-danger-light:   #ffebee;
--color-danger-dark:    #a64444;

--color-info:           #8ab4d8;
--color-info-light:     #e3f2fd;
```

### 2. Criar `components/Button.module.css`

Estilo reutilizável para `btn-primary`, `btn-secondary`, `btn-danger`.

### 3. Aplicar a CheckInList

- Cards de convidados: usar `--radius-md` + `--shadow-md`
- Botões: usar padrão primário/perigo
- Toasts: cores status aprimoradas

### 4. Aplicar a Modal UndoReasonModal

- Usar `--radius-md` consistente
- Textarea com foco em `--color-primary`
- Erro em `--color-danger-light` (não vermelho vibrante)

### 5. Dashboard / Estatísticas

- Cards: `--shadow-md` (não muito pesado)
- Títulos: usar serif em H2/H3
- Contadores: fonte grande mas não exagerada

---

## 🔄 PRÓXIMOS PASSOS

1. **Fase 1** (Esta sprint):
   - Atualizar `globals.css` com cores e tokens novos
   - Aplicar em Dashboard + Check-in
   - Testar em mobile (usabilidade 2+ horas)

2. **Fase 2** (Próxima sprint):
   - Criar biblioteca de componentes (Button, Card, Input)
   - Refatorar páginas de admin
   - Validar com verdadeiros usuários

3. **Fase 3** (Long-term):
   - Criar Storybook documentado
   - Dark mode (opcional, premium)
   - Micro-interactions refinadas

---

**Assinado**: Design System v1.0  
**Data**: Jan 2026  
**Status**: Pronto para implementação
