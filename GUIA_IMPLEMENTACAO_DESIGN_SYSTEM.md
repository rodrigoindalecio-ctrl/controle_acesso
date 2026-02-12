📋 GUIA DE IMPLEMENTAÇÃO - DESIGN SYSTEM
═════════════════════════════════════════════════════════════════════

🎯 OBJETIVO
─────────────────────────────────────────────────────────────────────
Aplicar o Design System novo mantendo funcionalidade 100% intacta.
Abordagem: Incremental, modular, sem quebra de funcionalidade.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 1: REFATORAÇÃO DE BOTÕES (Prioridade: ALTA)
─────────────────────────────────────────────────────────────────────

Páginas que usam muitos botões:
✓ CheckInList.tsx → Botões de check-in e undo
✓ Dashboard.tsx → Botões de ação
✓ UndoReasonModal.tsx → Botões de cancel/confirm
✓ AdminPanel → Muitos botões de gestão

Como aplicar:
1. Importar `lib/components.css` ao topo do arquivo
2. Substituir classes genéricas por padrões:
   
   ANTES:
   <button className="undoBtn">Desfazer</button>
   
   DEPOIS:
   <button className={`${styles.undoBtn} lib-btn-danger lib-btn-sm`}>
     Desfazer
   </button>

3. Exemplo: Aplicar em UndoReasonModal.tsx

PASSO 1: Import
   import '../../../lib/components.css';

PASSO 2: Substituir botão de cancelamento
   <button 
     className="btn-secondary"
     onClick={onCancel}
     disabled={isLoading}
   >
     Cancelar
   </button>

PASSO 3: Substituir botão de confirmação
   <button 
     className="btn-primary"
     onClick={handleSubmit}
     disabled={isLoading || !reason.trim()}
   >
     Confirmar Undo
   </button>

Arquivos a atualizar em FASE 1:
  [ ] app/components/UndoReasonModal.tsx
  [ ] app/components/ConfirmDialog.tsx
  [ ] app/admin/page.tsx (botões de admin)
  [ ] app/api/guests route components

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 2: REFATORAÇÃO DE CARDS (Prioridade: ALTA)
─────────────────────────────────────────────────────────────────────

Páginas que usam cards:
✓ CheckInList.tsx → Cards de convidado
✓ Dashboard.tsx → Cards de estatística
✓ GuestHistoryDrawer.tsx → Cards de histórico
✓ AttendanceDashboard.tsx → Cards informativos

Como aplicar:

ANTES (CheckInList.tsx - Card de convidado):
<div className={styles.guestItem}>
  <div className={styles.guestHeader}>
    <span>{guest.name}</span>
  </div>
</div>

DEPOIS:
<div className={`${styles.guestItem} lib-card`}>
  <div className={styles.guestHeader}>
    <span>{guest.name}</span>
  </div>
</div>

Tipos de cards por página:
- Dashboard → lib-card-stat (com contador)
- CheckInList → lib-card (padrão, com hover)
- History → lib-card-subtle (sem muita profundidade)

Arquivos a atualizar em FASE 2:
  [ ] app/components/CheckInList.tsx
  [ ] app/components/Dashboard.tsx
  [ ] app/components/GuestHistoryDrawer.tsx
  [ ] app/components/AttendanceDashboard.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 3: REFATORAÇÃO DE INPUTS (Prioridade: MÉDIA)
─────────────────────────────────────────────────────────────────────

Páginas com inputs:
✓ UndoReasonModal.tsx → Textarea de razão
✓ AdminPanel → Inputs de filtro
✓ SearchGuest → Input de busca
✓ ImportGuests → Input de arquivo

Como aplicar:

ANTES (UndoReasonModal.tsx):
<textarea
  className={styles.reasonInput}
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  placeholder="Motivo do desfazimento..."
  disabled={isLoading}
/>

DEPOIS:
<textarea
  className="textarea input"
  value={reason}
  onChange={(e) => setReason(e.target.value)}
  placeholder="Motivo do desfazimento..."
  disabled={isLoading}
/>

Validação com erro:
<input 
  className={reason.length < 5 ? 'input input-error' : 'input'}
  value={reason}
/>
{reason.length < 5 && (
  <span className="error-text">Mínimo 5 caracteres</span>
)}

Arquivos a atualizar em FASE 3:
  [ ] app/components/UndoReasonModal.tsx
  [ ] app/components/SearchGuest.tsx
  [ ] app/admin/page.tsx (inputs de filtro)
  [ ] app/events/[id]/import/page.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 4: REFATORAÇÃO DE MODAIS (Prioridade: MÉDIA)
─────────────────────────────────────────────────────────────────────

Modais existentes:
✓ UndoReasonModal → Modal de razão
✓ ConfirmDialog → Modal de confirmação
✓ GuestHistoryDrawer → Drawer com histórico
✓ CorrectionModal → Modal de correção

Estrutura padrão de modal:

<div className="modal-backdrop" onClick={handleBackdropClick}>
  <div className="modal">
    <div className="modal-header">
      <h2>Título do Modal</h2>
    </div>
    
    <div className="modal-body">
      {/* Conteúdo aqui */}
    </div>
    
    <div className="modal-footer">
      <button className="btn-secondary" onClick={onCancel}>
        Cancelar
      </button>
      <button className="btn-primary" onClick={onConfirm}>
        Confirmar
      </button>
    </div>
  </div>
</div>

Arquivos a atualizar em FASE 4:
  [ ] app/components/UndoReasonModal.tsx (refactoring completo)
  [ ] app/components/ConfirmDialog.tsx
  [ ] app/components/GuestHistoryDrawer.tsx
  [ ] app/components/CorrectionModal.tsx

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 FASE 5: TOASTS & ALERTAS (Prioridade: BAIXA)
─────────────────────────────────────────────────────────────────────

Sistema de notificações:
- Toast de sucesso (check-in realizado)
- Toast de erro (falha na API)
- Toast de aviso (evento encerrado)
- Toast de info (dados atualizados)

Aplicar em:
✓ CheckInList → Toast ao fazer check-in
✓ UndoReasonModal → Toast ao desfazer
✓ AdminPanel → Toast ao salvar

Exemplo:
<div className="toast toast-success">
  ✓ Check-in realizado com sucesso!
</div>

Arquivos a atualizar em FASE 5:
  [ ] app/components/CheckInList.tsx (integrar toasts)
  [ ] app/components/UndoReasonModal.tsx (integrar toasts)
  [ ] lib/toast-manager.ts (criar sistema centralizado)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 COMO TESTAR A APLICAÇÃO
─────────────────────────────────────────────────────────────────────

Após cada fase:

1. Visual Tests:
   ✓ Abrir app no navegador (http://localhost:3000)
   ✓ Verificar consistência de cores
   ✓ Validar hover/active states
   ✓ Testar em mobile (DevTools → Toggle device toolbar)
   ✓ Testar em tablet
   ✓ Testar em desktop (1920px)

2. Functional Tests:
   ✓ Fazer check-in (deve funcionar normalmente)
   ✓ Desfazer check-in (modal deve aparecer com novo estilo)
   ✓ Enviar formulário (sem erros JS)
   ✓ Navegar entre páginas (sem layout breaks)

3. Performance:
   ✓ Inspecionar Chrome DevTools → Lighthouse
   ✓ Verificar se CSS não aumentou bundle (< 50KB)
   ✓ Testar em rede 3G (DevTools → Network throttling)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚙️ CHECKLIST DE IMPLEMENTAÇÃO
─────────────────────────────────────────────────────────────────────

FASE 1: Botões
─────────────────────────────────────────────────────────────────────
[ ] lib/components.css criado com classes .btn-*
[ ] UndoReasonModal.tsx atualizado
[ ] ConfirmDialog.tsx atualizado
[ ] AdminPanel buttons atualizado
[ ] Testes visuais em mobile/tablet/desktop
[ ] Sem erros TypeScript
[ ] Funcionalidade 100% intacta

FASE 2: Cards
─────────────────────────────────────────────────────────────────────
[ ] CheckInList cards atualizado
[ ] Dashboard stats cards atualizado
[ ] GuestHistoryDrawer cards atualizado
[ ] AttendanceDashboard cards atualizado
[ ] Testes visuais (especialmente hover states)
[ ] Performance: bundle size OK

FASE 3: Inputs
─────────────────────────────────────────────────────────────────────
[ ] Input/textarea padrão aplicado
[ ] Validação visual com .input-error
[ ] Error text exibido corretamente
[ ] States: normal, focus, disabled, error
[ ] Testes em mobile (tap targets >= 44px)

FASE 4: Modais
─────────────────────────────────────────────────────────────────────
[ ] Estrutura modal-backdrop → modal → modal-body → modal-footer
[ ] Backdrop guard contra clique durante loading
[ ] Animação slideUp funcionando
[ ] Botões com classes .btn-primary / .btn-secondary
[ ] Acessibilidade: focus management OK

FASE 5: Toasts
─────────────────────────────────────────────────────────────────────
[ ] Toast system criado ou integrado
[ ] 4 tipos: success, danger, warning, info
[ ] Posicionamento bottom-right fixo
[ ] Auto-dismiss após 3-5 segundos
[ ] Z-index correto (2000)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DICAS DE IMPLEMENTAÇÃO
─────────────────────────────────────────────────────────────────────

1. INCREMENTAL:
   - Fazer 1 componente por vez
   - Testar antes de passar para o próximo
   - Commit no git após cada fase

2. REUTILIZAÇÃO:
   - Copiar estrutura HTML de um componente
   - Adaptar classes CSS
   - Não duplicar código

3. VALIDAÇÃO:
   - npm run build (TypeScript check)
   - npm run lint (ESLint check)
   - npm run dev (visual inspection)

4. FALLBACK:
   - Se algo quebrar, git revert da fase
   - Começar novamente, mais cuidadosamente

5. FEEDBACK:
   - Screenshots antes/depois
   - Testar com usuários reais se possível
   - Ajustar cores se não gostar

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 REFERÊNCIAS
─────────────────────────────────────────────────────────────────────

Design System: DESIGN_SYSTEM.md
Global Colors: app/globals.css
Component Styles: lib/components.css (NOVO)

Variáveis CSS disponíveis:
✓ --color-primary (#d4a574)
✓ --color-success (#6ba583)
✓ --color-danger (#c97e7e)
✓ --color-warning (#d9b57a)
✓ --color-info (#8ab4d8)
✓ --spacing-* (xs, sm, md, lg, xl, 2xl)
✓ --radius-* (sm, md, lg, xl)
✓ --shadow-* (sm, md, lg, xl)
✓ --font-primary (Playfair Display)
✓ --transition-* (fast, base, slow)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PROXIMOS PASSOS
─────────────────────────────────────────────────────────────────────

1. Executar FASE 1 (Botões)
   → Atualizar UndoReasonModal.tsx
   → Atualizar ConfirmDialog.tsx
   → Testar visualmente

2. Executar FASE 2 (Cards)
   → Atualizar CheckInList.tsx
   → Atualizar Dashboard.tsx
   → Testar em mobile

3. Executar FASE 3 (Inputs)
   → Atualizar UndoReasonModal textarea
   → Testar validação

4. Executar FASE 4 (Modais)
   → Refactoring completo de modais
   → Testes de acessibilidade

5. Executar FASE 5 (Toasts)
   → Integrar sistema de notificação
   → Final validation

═════════════════════════════════════════════════════════════════════
