# 🛠️ DESIGN SYSTEM - GUIA DE MANUTENÇÃO & EXTENSÃO

---

## 📚 Documentação Rápida

### Arquivos Principais

#### 1. `app/globals.css` — Design Tokens Globais
```css
/* Colors */
--color-primary: #d4a574;
--color-success: #6ba583;
--color-danger: #c97e7e;

/* Spacing */
--spacing-xs: 0.5rem;
--spacing-sm: 0.75rem;
--spacing-md: 1rem;
--spacing-lg: 1.5rem;
--spacing-xl: 2rem;

/* Radius */
--radius-sm: 8px;
--radius-md: 10px;
--radius-lg: 12px;

/* Shadows */
--shadow-sm: 0 1px 3px rgba(0,0,0,0.05);
--shadow-md: 0 2px 8px rgba(0,0,0,0.08);
--shadow-lg: 0 6px 16px rgba(0,0,0,0.1);
```

#### 2. `lib/buttons.module.css` — Button System
Classes disponíveis:
- `.btn` — Base
- `.btn--primary` — Ações principais
- `.btn--secondary` — Ações secundárias
- `.btn--danger` — Undo/Delete
- `.btn--ghost` — Navegação
- `.btn--icon` — Icons only (44x44px)
- `.is-loading` — Loading state
- `.btn__spinner` — Spinner animation

#### 3. `lib/cards.module.css` — Card System
Classes disponíveis:
- `.card` — Base elegante
- `.cardSoft` — Suave
- `.cardHighlight` — Destaque
- `.cardOutline` — Minimal
- `.guestCard` — Para guests
- `.statCard` — Estatísticas
- `.timelineCard` — Timeline
- `.isCheckedIn` — Indicator
- `.cardHeader`, `.cardBody`, `.cardFooter` — Structure

---

## ✅ Como Usar em Novo Componente

### Passo 1: Criar o Component
```tsx
// app/components/MyComponent.tsx
'use client';

import styles from './MyComponent.module.css';
import buttonStyles from '@/lib/buttons.module.css';
import cardStyles from '@/lib/cards.module.css';

export default function MyComponent() {
  return (
    <div className={styles.container}>
      <div className={`${styles.card} ${cardStyles.card}`}>
        <button className={`${styles.btn} ${buttonStyles.btn} ${buttonStyles['btn--primary']}`}>
          Click me
        </button>
      </div>
    </div>
  );
}
```

### Passo 2: Criar o CSS Module
```css
/* app/components/MyComponent.module.css */

.container {
  padding: var(--spacing-lg);
}

.card {
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  transition: all 0.2s ease;
}

.btn {
  font-weight: 600;
}
```

### Passo 3: Usar tokens globais
✅ Use variáveis CSS de `globals.css`
✅ Use classes de `buttons.module.css` e `cards.module.css`
❌ NUNCA use cores hardcoded (#d4a574)
❌ NUNCA use padding/spacing magicos

---

## 🎨 Customização por Componente

### Caso 1: Card com Titulo Customizado
```tsx
<div className={`${styles.cardContainer} ${cardStyles.card}`}>
  <div className={cardStyles.cardHeader}>
    <h3>Meu Título</h3>
  </div>
  <div className={cardStyles.cardBody}>
    Conteúdo aqui
  </div>
</div>
```

### Caso 2: Button com Loading
```tsx
<button 
  className={`${buttonStyles.btn} ${buttonStyles['btn--primary']} ${isLoading ? buttonStyles['is-loading'] : ''}`}
  disabled={isLoading}
>
  {isLoading ? (
    <>
      <span className={buttonStyles['btn__spinner']} aria-hidden="true" />
      Carregando...
    </>
  ) : (
    'Confirmar'
  )}
</button>
```

### Caso 3: Input com Focus Design System
```css
/* MyComponent.module.css */

.input {
  padding: var(--spacing-sm);
  border: 1px solid #e8dfd6;
  border-radius: var(--radius-md);
  background: #fafaf9;
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: #d4a574;
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.08),
              0 1px 3px rgba(0,0,0,0.05);
}
```

---

## 🔧 Checklist para Novo Componente

- [ ] CSS Module criado
- [ ] Importa buttonStyles (se tem botões)
- [ ] Importa cardStyles (se tem cards)
- [ ] USA variáveis CSS (spacing, radius, colors)
- [ ] Tem padding mínimo de 1rem
- [ ] Tem border-radius de 8-12px
- [ ] Tem transições 0.2s ease
- [ ] Hover state definido
- [ ] Focus state acessível
- [ ] Media queries para mobile
- [ ] Zero colors hardcoded

---

## 🚫 Anti-Patterns (NUNCA FAÇA)

### ❌ Errado 1: Colors Hardcoded
```tsx
// ERRADO
<div style={{ color: '#d4a574' }}>
  Não faça isso!
</div>
```

### ❌ Errado 2: Padding Magic Numbers
```css
/* ERRADO */
.container {
  padding: 21px;
  margin: 13px;
}
```

### ❌ Errado 3: Sem Transitions
```css
/* ERRADO */
.button {
  background: white;
  border: 1px solid #ccc;
  cursor: pointer;
}

.button:hover {
  background: blue;  /* Muito rápido! */
}
```

### ❌ Errado 4: Estilos Inline Complexos
```tsx
// ERRADO
<div style={{
  padding: '1rem',
  border: '1px solid #ddd',
  background: 'white',
  borderRadius: '8px'
}}>
  Use CSS Module!
</div>
```

---

## ✅ Best Practices

### ✅ Padrão 1: Use Spacing Tokens
```css
.container {
  padding: var(--spacing-lg);        /* ✅ */
  margin-bottom: var(--spacing-md);  /* ✅ */
  gap: var(--spacing-sm);            /* ✅ */
}
```

### ✅ Padrão 2: Use Radius Tokens
```css
.card {
  border-radius: var(--radius-md);   /* ✅ 10px */
}

.button {
  border-radius: var(--radius-sm);   /* ✅ 8px */
}
```

### ✅ Padrão 3: Use Color Tokens
```css
.button:hover {
  border-color: #d4a574;  /* ✅ Primary color */
  box-shadow: 0 0 0 4px rgba(212, 165, 116, 0.08);
}
```

### ✅ Padrão 4: Transitions Suaves
```css
.element {
  transition: all 0.2s ease;  /* ✅ Suave */
}

.element:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(212, 165, 116, 0.2);
}
```

### ✅ Padrão 5: Estrutura Semântica
```tsx
<div className={cardStyles.card}>
  <div className={cardStyles.cardHeader}>Título</div>
  <div className={cardStyles.cardBody}>Conteúdo</div>
  <div className={cardStyles.cardFooter}>Ações</div>
</div>
```

---

## 🎯 Extending the Design System

### Adicionar Nova Cor

1. **globals.css**:
```css
--color-info: #4a90e2;
```

2. **buttons.module.css**:
```css
.btn--info {
  background: var(--color-info);
  color: white;
  border: none;
}

.btn--info:hover:not(:disabled) {
  background: #3878c4;
  box-shadow: 0 4px 12px rgba(74, 144, 226, 0.2);
}
```

3. **Usar em componente**:
```tsx
<button className={`${buttonStyles.btn} ${buttonStyles['btn--info']}`}>
  Info Action
</button>
```

### Adicionar Novo Tamanho de Button

1. **buttons.module.css**:
```css
.btn--sm {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn--lg {
  padding: 1rem 2rem;
  font-size: 1.125rem;
}
```

2. **Usar**:
```tsx
<button className={`${buttonStyles.btn} ${buttonStyles['btn--primary']} ${buttonStyles['btn--sm']}`}>
  Small Button
</button>
```

### Adicionar Novo Card Variant

1. **cards.module.css**:
```css
.cardMinimal {
  background: transparent;
  border: none;
  box-shadow: none;
  padding: var(--spacing-md);
}

.cardMinimal:hover {
  background: #fafaf9;
  border-radius: var(--radius-md);
}
```

2. **Usar**:
```tsx
<div className={`${styles.container} ${cardStyles.cardMinimal}`}>
  Minimal Card
</div>
```

---

## 🧪 Testing Checklist

Antes de commitar mudanças de Design System:

- [ ] Desktop view (1920px) ✅
- [ ] Tablet view (768px) ✅
- [ ] Mobile view (375px) ✅
- [ ] Hover states working ✅
- [ ] Focus states visible ✅
- [ ] Loading states smooth ✅
- [ ] Color contrast WCAG AA ✅
- [ ] No console errors ✅
- [ ] Performance OK (Lighthouse) ✅

---

## 📱 Responsive Design Pattern

```css
.component {
  /* Mobile first */
  padding: var(--spacing-md);
  display: grid;
  grid-template-columns: 1fr;
}

/* Tablet */
@media (min-width: 768px) {
  .component {
    padding: var(--spacing-lg);
    grid-template-columns: repeat(2, 1fr);
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .component {
    padding: var(--spacing-xl);
    grid-template-columns: repeat(3, 1fr);
  }
}
```

---

## 🔗 Import Patterns

### Pattern 1: Component com Card
```tsx
import buttonStyles from '@/lib/buttons.module.css';
import cardStyles from '@/lib/cards.module.css';
import styles from './MyComponent.module.css';

// Usar:
className={`${styles.container} ${cardStyles.card}`}
```

### Pattern 2: Component com Buttons
```tsx
import buttonStyles from '@/lib/buttons.module.css';
import styles from './MyComponent.module.css';

// Usar:
className={`${buttonStyles.btn} ${buttonStyles['btn--primary']}`}
```

### Pattern 3: Component com Cards + Buttons
```tsx
import buttonStyles from '@/lib/buttons.module.css';
import cardStyles from '@/lib/cards.module.css';
import styles from './MyComponent.module.css';

// Ambos disponíveis
```

---

## 🐛 Debugging

### Issue: Estilo não aplicando?
```tsx
// ✅ Correto
className={`${styles.myClass} ${cardStyles.card}`}

// ❌ Errado
className={styles.myClass + cardStyles.card}

// ❌ Errado
className="{styles.myClass} {cardStyles.card}"
```

### Issue: Cor não mudando?
```css
/* Verifique se está usando classe correta */
.button:hover {
  color: #d4a574;  /* OK */
}

/* Não use color hardcoded nas outras classes */
.button {
  color: #999;  /* ❌ Será sobrescrito */
}
```

### Issue: Hover não funciona?
```css
/* Verifique transitions */
.element {
  transition: all 0.2s ease;  /* ✅ */
}

/* Sem transition, muda instantaneamente */
.element {
  /* ❌ Sem transition */
}
```

---

## 📊 Maintenance Schedule

- **Weekly**: Revisar componentes novos para conformidade
- **Monthly**: Rodar Lighthouse (performance/accessibility)
- **Quarterly**: Atualizar documentação
- **Yearly**: Revisar Design System completo

---

## 🚀 Deploy Checklist

Antes de fazer deploy:

- [ ] Todos os tests passando
- [ ] Build sem warnings
- [ ] Lighthouse score ≥ 90
- [ ] Accessibility score ≥ 95
- [ ] Design System versioned
- [ ] Documentação atualizada
- [ ] No regressions visuais

---

## 📞 Support & Questions

**Quando adicionar novo componente**:
1. Verifique se pode usar card/button existente
2. Se não, estenda `cards.module.css` ou `buttons.module.css`
3. NUNCA crie estilos novos duplicados
4. Sempre use tokens globais
5. Teste em mobile/tablet/desktop

---

*Design System Maintenance Guide v1.0*
*Last Updated: 2025*
*Ready for Production* ✅
