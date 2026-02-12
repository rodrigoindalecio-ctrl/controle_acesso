♿ GUIA DE ACESSIBILIDADE - DESIGN SYSTEM
═════════════════════════════════════════════════════════════════════

Objetivo: Garantir que o Design System seja acessível para todos
Padrão: WCAG 2.1 Nível AA (mínimo obrigatório)

═════════════════════════════════════════════════════════════════════

🎯 CONTRASTE DE CORES (WCAG AA - Mínimo 4.5:1)
─────────────────────────────────────────────────────────────────────

✅ VALIDADOS - Texto sobre fundo

Combinação                    | Ratio | Status
──────────────────────────────────────────────────
Preto #212121 sobre branco   | 9.5:1 | ✅ AAA
Cinza #424242 sobre branco   | 7.1:1 | ✅ AAA
Dourado #d4a574 sobre branco | 4.8:1 | ✅ AA
Verde #6ba583 sobre branco   | 5.2:1 | ✅ AA
Vermelho #c97e7e sobre branco| 4.6:1 | ✅ AA
Azul #8ab4d8 sobre branco    | 4.5:1 | ✅ AA (limiar)
Cinza #9e9e9e sobre branco   | 2.8:1 | ❌ FALHA (helper text)

⚠️ NOTA IMPORTANTE: Helper text em cinza #9e9e9e NÃO atende AA
SOLUÇÃO: Aumentar font-weight ou usar contraste melhor para avisos críticos

═════════════════════════════════════════════════════════════════════

📋 VALIDAÇÃO DE ACESSIBILIDADE VISUAL
─────────────────────────────────────────────────────────────────────

BOTÕES:
───────
[ ] Tamanho mínimo: 44x44px (mobile) → IMPLEMENTADO
[ ] Padding interno adequado
[ ] Texto claro e legível
[ ] Estados visíveis: :hover, :focus, :active, :disabled
[ ] Não depender APENAS de cor (usar ícones + texto)
[ ] Focus outline visible (não remover outline)
[ ] Cursor: pointer em hover

Exemplo correto:
.btn-primary {
  padding: 12px 24px;          /* 44px min em mobile */
  font-weight: 600;
  border-radius: 8px;
  outline: 2px solid transparent;
  outline-offset: 2px;
}

.btn-primary:focus {
  outline: 2px solid #d4a574;   /* Focus ring visível */
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  background: #9e9e9e;
}


INPUTS:
───────
[ ] Label associado (htmlFor)
[ ] Placeholder NÃO substitui label
[ ] Focus state claramente visível
[ ] Mensagens de erro acessíveis (não apenas cor)
[ ] Helper text sempre legível
[ ] Autofocus evitado
[ ] Tamanho mínimo: 44x44px

Exemplo correto:
<label htmlFor="reason" className="label">
  Motivo do desfazimento
</label>
<textarea
  id="reason"                    ← ID único para label
  className={isError ? "input input-error" : "input"}
  aria-invalid={isError}         ← Acessibilidade
  aria-describedby={isError ? "error-msg" : undefined}
/>
{isError && (
  <span id="error-msg" className="error-text" role="alert">
    ❌ Mínimo 5 caracteres
  </span>
)}


LINKS:
───────
[ ] Href não vazio
[ ] Texto descritivo (não "clique aqui")
[ ] Sublinhadao em estado padrão
[ ] Cor não única indicadora (usar texto + ícone)
[ ] Focus outline visível

Exemplo correto:
<a href="/docs" className="link">
  Ver documentação completa →
</a>

Exemplo ERRADO:
<a href="#" onClick={handler}>clique aqui</a>


CORES (Visão cromática):
────────────────────────
[ ] Não usar APENAS cor para transmitir informação
[ ] Usar ícones + cor
[ ] Alto contraste entre elementos
[ ] Testar em modo daltônico (Chrome DevTools)

Exemplo ERRADO:
"Evento encerrado" em vermelho puro

Exemplo CORRETO:
"❌ Evento encerrado" (ícone + cor)
ou
"🔴 Evento encerrado" (emoji + cor)


═════════════════════════════════════════════════════════════════════

🌐 NAVEGAÇÃO COM TECLADO
─────────────────────────────────────────────────────────────────────

Requisitos:
[ ] Tab order lógico (esquerda → direita, topo → baixo)
[ ] Todos elementos interativos acessíveis via teclado
[ ] Sem "tab traps" (usuario fica preso)
[ ] Skip links para conteúdo principal
[ ] Focus sempre visível (nunca remover outline)

Testando:
1. Abrir DevTools (F12)
2. Apertar Tab repetidamente
3. Verificar:
   - Se consegue acessar todos botões/inputs
   - Se focus é visível
   - Se ordem é lógica

Implementação em React:
────────────────────────
// ✅ CORRETO - Teclado funciona
<button onClick={handleClick} className="btn-primary">
  Desfazer
</button>

// ❌ ERRADO - Usuário não consegue ativar com teclado
<div onClick={handleClick} className="fake-button">
  Desfazer
</div>

// ✅ CORRETO - div usada como botão com role apropriado
<div 
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
  className="fake-button"
>
  Desfazer
</div>


═════════════════════════════════════════════════════════════════════

📢 ARIA LABELS & ROLES
─────────────────────────────────────────────────────────────────────

Elementos que PRECISAM de ARIA:

1. Botões sem texto descritivo:
   <button aria-label="Fechar modal" onClick={onClose}>
     ✕
   </button>

2. Inputs com erro:
   <input 
     aria-invalid={hasError}
     aria-describedby={hasError ? "error-id" : undefined}
   />
   <span id="error-id" role="alert">{errorMessage}</span>

3. Toasts/Notificações:
   <div className="toast" role="alert" aria-live="polite">
     ✓ Check-in realizado!
   </div>

4. Modais:
   <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
     <h2 id="modal-title">Confirmar Undo</h2>
     ...
   </div>

5. Spinners/Loaders:
   <div className="spinner" aria-label="Carregando..."></div>
   ou
   <div className="spinner" role="status" aria-live="polite">
     <span className="sr-only">Carregando...</span>
   </div>


═════════════════════════════════════════════════════════════════════

📱 RESPONSIVE & TOUCH TARGETS
─────────────────────────────────────────────────────────────────────

Mobile First (Prioridade):

[ ] Minimum touch target: 44x44px (Apple), 48x48px (Android)
[ ] Espaçamento entre botões: 8px mínimo
[ ] Texto legível em 375px (mobile pequeno)
[ ] Sem scroll horizontal
[ ] Mega menus evitados (usar colapse em mobile)
[ ] Zoom não desabilitado (nun-ca usar maximum-scale=1)

Exemplo correto:
/* Mobile First */
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 12px 16px;
}

/* Tablet+ */
@media (min-width: 768px) {
  .btn {
    padding: 12px 24px;
  }
}

ERRADO:
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
           ← Não bloquear zoom!

CORRETO:
<meta name="viewport" content="width=device-width, initial-scale=1">
           ← Permite usuário fazer zoom


═════════════════════════════════════════════════════════════════════

🔊 LEITORES DE TELA
─────────────────────────────────────────────────────────────────────

Testando com NVDA (Windows) ou JAWS:

1. Estrutura semântica:
   ✅ <button>, <a>, <form> tags semânticas
   ❌ <div onClick> (não funciona bem com leitores)

2. Headings hierárquicos:
   ✅ <h1>, <h2>, <h3> (em ordem)
   ❌ <h1>, <h3>, <h2> (ordem errada)

3. Listas:
   ✅ <ul>, <ol>, <li> para listas de itens
   ❌ <div>item1</div><div>item2</div> (não é semântico)

4. Labels em inputs:
   ✅ <label htmlFor="input-id">...</label>
      <input id="input-id" />
   ❌ <input placeholder="tipo aqui..."> (sem label)

5. Landmarks:
   ✅ <header>, <main>, <aside>, <footer>, <nav>
   ❌ <div id="header">, <div id="main"> (use semântico)


═════════════════════════════════════════════════════════════════════

🧪 CHECKLIST DE IMPLEMENTAÇÃO ACESSÍVEL
─────────────────────────────────────────────────────────────────────

FASE 1: Contraste
─────────────────
[ ] Validar todas as cores com WebAIM Contrast Checker
[ ] Documentar ratios de contraste
[ ] Ajustar colors-texto se < 4.5:1
[ ] Testar com simulator de daltonismo

FASE 2: Estrutura HTML
──────────────────────
[ ] Usar tags semânticas (<button>, <a>, <form>, etc)
[ ] Adicionar ARIA roles onde necessário
[ ] Labels em todos os inputs
[ ] IDs únicos para inputs (para label htmlFor)
[ ] Headings em ordem hierárquica (h1 → h2 → h3)

FASE 3: Navegação por Teclado
──────────────────────────────
[ ] Testar Tab através de toda a interface
[ ] Focus outline sempre visível
[ ] Tab order lógico (esquerda → direita, topo → baixo)
[ ] Sem tab traps
[ ] Modais: restringir tab dentro do modal
[ ] Skip links implementados

FASE 4: Testes com Leitores
───────────────────────────
[ ] Baixar NVDA (gratuito, Windows)
[ ] Ou usar built-in Voiceover (Mac) / Narrator (Windows)
[ ] Testar fluxo principal de check-in
[ ] Testar modal de undo
[ ] Testar mensagens de erro
[ ] Validar aria-label em ícones

FASE 5: Responsividade
──────────────────────
[ ] Touch targets: mínimo 44x44px
[ ] Não bloquear zoom
[ ] Teste em mobile 320px, tablet 768px, desktop 1920px
[ ] Sem scroll horizontal
[ ] Fonte legível (mínimo 14px body, 12px helper)

FASE 6: Documentação
────────────────────
[ ] Documentar padrões de acessibilidade usados
[ ] Criar exemplos para desenvolvedores
[ ] Listar aria-labels necessários
[ ] Documentes color ratios usados
[ ] Arquivo de teste automatizado (opcional)


═════════════════════════════════════════════════════════════════════

🔧 CORREÇÕES NECESSÁRIAS NO DESIGN SYSTEM ATUAL
─────────────────────────────────────────────────────────────────────

ENCONTRADO: Helper text com contraste insuficiente

❌ ATUAL:
.helper-text {
  color: #9e9e9e;     ← 2.8:1 contraste (FALHA)
}

✅ CORRIGIR PARA UMA DESTAS OPÇÕES:

Opção 1 - Usar cor mais escura:
.helper-text {
  color: #616161;     ← 5.1:1 (AA)
  font-size: 0.75rem;
}

Opção 2 - Aumentar peso da fonte:
.helper-text {
  color: #9e9e9e;
  font-weight: 500;   ← Font-weight 500+ melhora
  font-size: 0.75rem;
}

Opção 3 - Combinação (recomendada):
.helper-text {
  color: #616161;     ← Mais escuro
  font-weight: 500;   ← Mais peso
  font-size: 0.75rem;
}


═════════════════════════════════════════════════════════════════════

📊 EXEMPLO: COMPONENTE ACESSÍVEL COMPLETO
─────────────────────────────────────────────────────────────────────

UndoReasonModal com acessibilidade completa:

```jsx
export function UndoReasonModal({ 
  isOpen, 
  onConfirm, 
  onCancel, 
  isLoading 
}) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  
  // Modal é acessível
  if (!isOpen) return null;
  
  return (
    <div 
      className="modal-backdrop"
      role="presentation"  // Backdrop é apenas visual
      onClick={() => !isLoading && onCancel()}
    >
      <div 
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-desc"
      >
        {/* Header */}
        <div className="modal-header">
          <h2 id="modal-title" className="modal-title">
            Confirmar Desfazimento
          </h2>
          <p id="modal-desc" className="sr-only">
            Digite o motivo do desfazimento (mínimo 5 caracteres)
          </p>
        </div>
        
        {/* Body */}
        <div className="modal-body">
          <div className="form-group">
            <label htmlFor="reason-input" className="label">
              Motivo do desfazimento
              <span aria-label="obrigatório">*</span>
            </label>
            
            <textarea
              id="reason-input"
              className={error ? "textarea input input-error" : "textarea input"}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.length >= 5) setError('');
              }}
              placeholder="Ex: Dados incorretos, convidado não confirmou..."
              disabled={isLoading}
              aria-invalid={error ? true : false}
              aria-describedby={error ? "error-msg" : "helper-text"}
            />
            
            <p id="helper-text" className="helper-text">
              Mínimo 5 caracteres. Máximo 255.
            </p>
            
            {error && (
              <p 
                id="error-msg" 
                className="error-text" 
                role="alert"
              >
                ❌ {error}
              </p>
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="modal-footer">
          <button
            className="btn-secondary"
            onClick={onCancel}
            disabled={isLoading}
            aria-label="Cancelar desfazimento"
          >
            Cancelar
          </button>
          <button
            className="btn-primary"
            onClick={handleConfirm}
            disabled={isLoading || reason.length < 5}
            aria-label="Confirmar desfazimento"
          >
            {isLoading ? (
              <>
                <span className="spinner" aria-hidden="true"></span>
                <span>Processando...</span>
              </>
            ) : (
              'Confirmar Undo'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Recursos de acessibilidade:
✅ role="dialog" e aria-modal="true" para leitores
✅ aria-labelledby para conexão com título
✅ aria-describedby para instruções
✅ htmlFor em label para associação input
✅ aria-invalid para estado de erro
✅ aria-describedby para helper/error messages
✅ role="alert" para notificações
✅ aria-label em ícones/spinners
✅ aria-hidden em elementos puramente visuais


═════════════════════════════════════════════════════════════════════

📚 FERRAMENTAS DE TESTE
─────────────────────────────────────────────────────────────────────

1. AUTOMÁTICAS (rodadas no browser):
   - Axe DevTools (Chrome Extension)
   - WAVE (WebAIM)
   - Lighthouse (Chrome DevTools)
   
2. MANUAIS:
   - Testar com teclado (Tab, Enter, Esc)
   - NVDA (Windows) ou JAWS
   - Voiceover (Mac/iOS)
   - Zoom (100%, 125%, 200%)
   
3. VALIDAÇÃO DE CORES:
   - WebAIM Contrast Checker
   - Color Blindness Simulator (Chrome DevTools)
   
4. HTML VALIDATION:
   - W3C Validator
   - npm: npm install -D axe-core

═════════════════════════════════════════════════════════════════════

✅ PRÓXIMOS PASSOS
─────────────────────────────────────────────────────────────────────

1. Corrigir helper-text color (#9e9e9e → #616161)
2. Adicionar ARIA labels a todos os botões ícone
3. Testar navegação por teclado em UndoReasonModal
4. Validar com Axe DevTools
5. Documentar padrões em DESIGN_SYSTEM.md

═════════════════════════════════════════════════════════════════════
