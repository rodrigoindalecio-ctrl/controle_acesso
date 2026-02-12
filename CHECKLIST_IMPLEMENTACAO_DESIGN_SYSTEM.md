✅ CHECKLIST DE IMPLEMENTAÇÃO - DESIGN SYSTEM
═════════════════════════════════════════════════════════════════════

Documentação: DESIGN_SYSTEM_SUMARIO_EXECUTIVO.md
Guia de Implementação: GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md

═════════════════════════════════════════════════════════════════════

📋 FASE 1: REFATORAÇÃO DE BOTÕES
─────────────────────────────────────────────────────────────────────

Objetivo: Aplicar novo estilo em todos os botões
Tempo estimado: 2-3 horas
Componentes afetados: 4 arquivos

┌─ Planejamento
├─ [ ] Ler lib/components.css (classes .btn-*)
├─ [ ] Entender variações: primary, secondary, danger
├─ [ ] Identificar todos botões na codebase
└─ [ ] Backup do projeto atual (git commit)

┌─ Implementação
├─ [ ] app/components/UndoReasonModal.tsx
│   ├─ [ ] Importar '../../../lib/components.css'
│   ├─ [ ] Botão "Cancelar" → className="btn-secondary"
│   ├─ [ ] Botão "Confirmar" → className="btn-primary"
│   └─ [ ] Testar modal visualmente
│
├─ [ ] app/components/ConfirmDialog.tsx
│   ├─ [ ] Aplicar classes .btn-primary / .btn-secondary
│   └─ [ ] Testar funcionamento
│
├─ [ ] app/admin/page.tsx
│   ├─ [ ] Botões de ação → .btn-primary
│   ├─ [ ] Botões secundários → .btn-secondary
│   └─ [ ] Botões de delete → .btn-danger
│
└─ [ ] Outros componentes com botões
    ├─ [ ] Verificar componentes em app/components/
    ├─ [ ] Verificar componentes em app/api/
    └─ [ ] Aplicar classes apropriadas

┌─ Testes
├─ [ ] npm run build (TypeScript check)
├─ [ ] npm run dev (Visual inspection)
├─ [ ] Testar em mobile (DevTools → device 375px)
├─ [ ] Testar em tablet (DevTools → device 768px)
├─ [ ] Testar em desktop (DevTools → device 1920px)
├─ [ ] Hover states funcionam?
├─ [ ] Disabled states funcionam?
├─ [ ] Click events funcionam?
├─ [ ] Sem erros no console?
└─ [ ] Nenhuma funcionalidade quebrou?

┌─ Validação
├─ [ ] Cores match PALETA_CORES_GUIA.md?
├─ [ ] Espaçamento consistente?
├─ [ ] Animações suaves?
├─ [ ] Touch targets >= 44px (mobile)?
├─ [ ] Contraste adequado (4.5:1+)?
└─ [ ] Documentar issues encontrados

┌─ Conclusão
├─ [ ] Fazer screenshot antes/depois
├─ [ ] Git commit com mensagem descritiva
└─ [ ] Marcar Fase 1 como COMPLETO


═════════════════════════════════════════════════════════════════════

📋 FASE 2: REFATORAÇÃO DE CARDS
─────────────────────────────────────────────────────────────────────

Objetivo: Aplicar novo estilo em todos os cards
Tempo estimado: 2-3 horas
Componentes afetados: 4 arquivos

┌─ Planejamento
├─ [ ] Ler lib/components.css (classes .card-*)
├─ [ ] Entender variações: padrão, elevated, subtle, stat
├─ [ ] Identificar todos cards na codebase
└─ [ ] Git status (sem mudanças pendentes)

┌─ Implementação
├─ [ ] app/components/CheckInList.tsx
│   ├─ [ ] Guest item wrapper → className="... lib-card"
│   ├─ [ ] Remover hardcoded box-shadow (usar .card)
│   ├─ [ ] Validar hover effect
│   └─ [ ] Testar visualmente
│
├─ [ ] app/components/Dashboard.tsx
│   ├─ [ ] Stat cards → className="... lib-card-stat"
│   ├─ [ ] Counter border → usar .card-stat styling
│   └─ [ ] Testar responsividade
│
├─ [ ] app/components/GuestHistoryDrawer.tsx
│   ├─ [ ] History items → className="... lib-card-subtle"
│   └─ [ ] Teste em drawer
│
└─ [ ] app/components/AttendanceDashboard.tsx
    ├─ [ ] Info cards → className="... lib-card"
    └─ [ ] Testar interatividade

┌─ Testes
├─ [ ] npm run build (sem erros)
├─ [ ] npm run dev
├─ [ ] Hover states em cards funcionam?
├─ [ ] Shadow depth apropriada?
├─ [ ] Mobile layout ok (cards empilhados)?
├─ [ ] Tablet layout ok (2 colunas)?
├─ [ ] Desktop layout ok (3+ colunas)?
├─ [ ] Sem erros no console?
└─ [ ] Performance ok (Lighthouse > 90)?

┌─ Validação
├─ [ ] Cards com boa profundidade visual?
├─ [ ] Hover lift animation funciona?
├─ [ ] Border colors apropriados?
├─ [ ] Espaçamento interno consistente?
└─ [ ] Documentar mudanças

┌─ Conclusão
├─ [ ] Fazer screenshot antes/depois
├─ [ ] Git commit
└─ [ ] Marcar Fase 2 como COMPLETO


═════════════════════════════════════════════════════════════════════

📋 FASE 3: REFATORAÇÃO DE INPUTS
─────────────────────────────────────────────────────────────────────

Objetivo: Aplicar novo estilo em inputs, textareas, labels
Tempo estimado: 1-2 horas
Componentes afetados: 4 arquivos

┌─ Planejamento
├─ [ ] Ler lib/components.css (classes .input, .textarea, .label)
├─ [ ] Entender states: normal, focus, disabled, error
├─ [ ] Identificar todos inputs na codebase
└─ [ ] Git status (sem mudanças pendentes)

┌─ Implementação
├─ [ ] app/components/UndoReasonModal.tsx
│   ├─ [ ] Label → className="label"
│   ├─ [ ] Textarea → className="textarea input"
│   ├─ [ ] Error state → className="textarea input input-error"
│   ├─ [ ] Error message → className="error-text"
│   └─ [ ] Testar validação
│
├─ [ ] app/components/SearchGuest.tsx
│   ├─ [ ] Input de busca → className="input"
│   ├─ [ ] Placeholder funcionando?
│   └─ [ ] Focus state visível?
│
├─ [ ] app/admin/page.tsx (filtros)
│   ├─ [ ] Inputs de filtro → className="input"
│   ├─ [ ] Labels apropriados
│   └─ [ ] Helper text clareza
│
└─ [ ] Formulários gerais
    ├─ [ ] Validar all inputs
    ├─ [ ] Todos com labels
    ├─ [ ] Error states apropriados
    └─ [ ] Placeholder vs label distinction clara

┌─ Testes
├─ [ ] npm run build (sem erros)
├─ [ ] Focus states visíveis em todos inputs?
├─ [ ] Disabled inputs parecem desabilitados?
├─ [ ] Error messages exibindo corretamente?
├─ [ ] Contrastde labels/placeholders OK?
├─ [ ] Mobile: Teclado não oculta campos?
├─ [ ] Tab order correto?
└─ [ ] Sem erros no console?

┌─ Validação
├─ [ ] Focus ring color apropriado (#d4a574)?
├─ [ ] Border colors match spec?
├─ [ ] Error text color appropriate?
├─ [ ] Helper text legível?
├─ [ ] Contraste 4.5:1+?
└─ [ ] Documentar achados

┌─ Conclusão
├─ [ ] Screenshot antes/depois
├─ [ ] Git commit
└─ [ ] Marcar Fase 3 como COMPLETO


═════════════════════════════════════════════════════════════════════

📋 FASE 4: REFATORAÇÃO DE MODAIS
─────────────────────────────────────────────────────────────────────

Objetivo: Aplicar estrutura padrão em todos os modais
Tempo estimado: 2-3 horas
Componentes afetados: 3-4 modais

┌─ Planejamento
├─ [ ] Ler lib/components.css (classes .modal-*)
├─ [ ] Entender estrutura: backdrop → modal → header/body/footer
├─ [ ] Listar todos modais no projeto
└─ [ ] Git status (sem mudanças pendentes)

┌─ Implementação
├─ [ ] app/components/UndoReasonModal.tsx
│   ├─ [ ] Wrapper → className="modal-backdrop"
│   ├─ [ ] Modal container → className="modal"
│   ├─ [ ] Header → className="modal-header"
│   ├─ [ ] Body → className="modal-body"
│   ├─ [ ] Footer → className="modal-footer"
│   ├─ [ ] Botões → .btn-primary / .btn-secondary
│   ├─ [ ] Backdrop guard (não fechar durante loading)
│   ├─ [ ] Animação slideUp funcionando?
│   └─ [ ] Testar acessibilidade
│
├─ [ ] app/components/ConfirmDialog.tsx
│   ├─ [ ] Aplicar mesma estrutura modal
│   ├─ [ ] Title apropriado
│   ├─ [ ] Mensagem clara
│   └─ [ ] Botões estruturados
│
├─ [ ] app/components/GuestHistoryDrawer.tsx
│   ├─ [ ] Considerar se é modal ou drawer
│   ├─ [ ] Se modal, aplicar estrutura
│   └─ [ ] Se drawer, considerar slide-from-right
│
└─ [ ] app/components/CorrectionModal.tsx
    ├─ [ ] Aplicar estrutura completa
    └─ [ ] Testar validação

┌─ Testes
├─ [ ] npm run build (sem erros)
├─ [ ] Modal backdrop visível?
├─ [ ] Modal centered na tela?
├─ [ ] Animação slideUp suave?
├─ [ ] Backdrop click não fecha durante loading?
├─ [ ] ESC key fecha modal?
├─ [ ] Focus trapped dentro modal (accessibility)?
├─ [ ] Mobile: Modal full-height com scroll?
├─ [ ] Tablet/Desktop: Modal responsivo?
├─ [ ] Sem erros no console?
└─ [ ] Performance ok?

┌─ Validação (Acessibilidade)
├─ [ ] role="dialog" presente?
├─ [ ] aria-modal="true" presente?
├─ [ ] aria-labelledby conectado ao title?
├─ [ ] aria-describedby para instruções?
├─ [ ] Botões acessíveis por teclado?
├─ [ ] Focus visível (não remover outline)?
├─ [ ] Contraste de cores OK?
└─ [ ] Sem erros Axe DevTools?

┌─ Conclusão
├─ [ ] Screenshot antes/depois
├─ [ ] Git commit
└─ [ ] Marcar Fase 4 como COMPLETO


═════════════════════════════════════════════════════════════════════

📋 FASE 5: TOASTS & NOTIFICAÇÕES
─────────────────────────────────────────────────────────────────────

Objetivo: Criar sistema centralizado de notificações
Tempo estimado: 1-2 horas
Componentes afetados: Sistema novo

┌─ Planejamento
├─ [ ] Ler lib/components.css (classes .toast-*)
├─ [ ] Definir tipologia: success, danger, warning, info
├─ [ ] Identificar onde toasts são necessários
└─ [ ] Git status

┌─ Implementação
├─ [ ] Criar lib/toast-manager.ts (se não existir)
│   ├─ [ ] Hook useToast() para exibir notificações
│   ├─ [ ] Toast context/provider (se usar Context)
│   └─ [ ] Timer para auto-dismiss (3-5 segundos)
│
├─ [ ] app/components/CheckInList.tsx
│   ├─ [ ] Toast ao check-in bem-sucedido
│   ├─ [ ] Toast em caso de erro
│   └─ [ ] Testar fluxo
│
├─ [ ] app/components/UndoReasonModal.tsx
│   ├─ [ ] Toast ao desfazer bem-sucedido
│   ├─ [ ] Toast em caso de erro
│   └─ [ ] Testar mensagens
│
└─ [ ] Outros componentes conforme necessário
    ├─ [ ] Admin actions
    ├─ [ ] Import guests
    └─ [ ] Dados atualizados

┌─ Testes
├─ [ ] npm run build (sem erros)
├─ [ ] Toast aparece ao bottom-right?
├─ [ ] Toast com tipo correto (cores, ícones)?
├─ [ ] Auto-dismiss após 3-5 segundos?
├─ [ ] Multiple toasts empilham?
├─ [ ] Mobile: Toast não oculta conteúdo?
├─ [ ] Z-index correto (2000)?
├─ [ ] Sem erros no console?
└─ [ ] Performance ok com múltiplos toasts?

┌─ Validação
├─ [ ] Cores match paleta?
├─ [ ] Ícones apropriados?
├─ [ ] Mensagens claras?
├─ [ ] Sem muito spam de notificações?
└─ [ ] Documentar padrão

┌─ Conclusão
├─ [ ] Screenshot antes/depois
├─ [ ] Git commit
└─ [ ] Marcar Fase 5 como COMPLETO


═════════════════════════════════════════════════════════════════════

🔍 VALIDAÇÃO FINAL
─────────────────────────────────────────────────────────────────────

Depois que TODAS as 5 fases estiverem completas:

┌─ Visual Quality
├─ [ ] Cores match design spec
├─ [ ] Espaçamento consistente
├─ [ ] Tipografia hierárquica
├─ [ ] Sombras apropriadas
├─ [ ] Radius consistency
├─ [ ] Animações suaves (não jarring)
├─ [ ] Sem glitches em transições
└─ [ ] Overall "premium" feeling

┌─ Funcional
├─ [ ] Todos features funcionam 100%
├─ [ ] Sem cliques que não fazem nada
├─ [ ] Sem navegação quebrada
├─ [ ] Modais abrem/fecham corretamente
├─ [ ] Validação funciona
├─ [ ] Sem race conditions
├─ [ ] Sem memory leaks
└─ [ ] Performance aceitável

┌─ Acessibilidade
├─ [ ] Axe DevTools: 0 erros críticos
├─ [ ] Navegação por teclado completa
├─ [ ] Tab order lógico
├─ [ ] Focus sempre visível
├─ [ ] Contraste validado (4.5:1+)
├─ [ ] ARIA labels presentes
├─ [ ] Responsive em 375px, 768px, 1920px
├─ [ ] Sem scroll horizontal
├─ [ ] Touch targets 44x44px+
└─ [ ] Testado com leitor de tela (NVDA)

┌─ Compatibilidade
├─ [ ] Chrome ✓
├─ [ ] Firefox ✓
├─ [ ] Safari ✓
├─ [ ] Edge ✓
├─ [ ] iOS Safari ✓
├─ [ ] Android Chrome ✓
└─ [ ] Browsers antigos (fallbacks)

┌─ Documentação
├─ [ ] DESIGN_SYSTEM.md atualizado
├─ [ ] GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md completo
├─ [ ] PALETA_CORES_GUIA.md referenciável
├─ [ ] ACESSIBILIDADE_GUIA.md usado
├─ [ ] lib/components.css bem comentado
└─ [ ] Exemplos de uso claros

┌─ Conclusão
├─ [ ] Fazer demo com usuários (se possível)
├─ [ ] Documentar feedback
├─ [ ] Fazer ajustes menores
├─ [ ] Final git commit: "Design System v1.0 - Implementação Completa"
└─ [ ] PROJETO COMPLETO ✅


═════════════════════════════════════════════════════════════════════

📊 STATUS GERAL
─────────────────────────────────────────────────────────────────────

Design System Base:
  ✅ DESIGN_SYSTEM.md (2000+ linhas) - COMPLETO
  ✅ app/globals.css (cores atualizadas) - COMPLETO
  ✅ lib/components.css (classes reutilizáveis) - COMPLETO

Documentação:
  ✅ DESIGN_SYSTEM_SUMARIO_EXECUTIVO.md - COMPLETO
  ✅ GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md - COMPLETO
  ✅ PALETA_CORES_GUIA.md - COMPLETO
  ✅ ACESSIBILIDADE_GUIA.md - COMPLETO
  🔄 CHECKLIST (este arquivo) - EM PROGRESSO

Implementação por Fase:
  ⏳ FASE 1: Botões - NÃO INICIADO
  ⏳ FASE 2: Cards - NÃO INICIADO
  ⏳ FASE 3: Inputs - NÃO INICIADO
  ⏳ FASE 4: Modais - NÃO INICIADO
  ⏳ FASE 5: Toasts - NÃO INICIADO

═════════════════════════════════════════════════════════════════════

💡 DICAS IMPORTANTES
─────────────────────────────────────────────────────────────────────

1. FAÇA UMA FASE POR VEZ
   Não tente fazer tudo de uma vez. Testes são mais fáceis.

2. GIT COMMIT APÓS CADA FASE
   Assim você pode reverter se algo der errado.

3. TESTE FREQUENTEMENTE
   npm run dev depois de cada arquivo modificado.

4. MOBILE-FIRST
   Testar em mobile 375px antes de desktop.

5. NÃO REMOVA CSS ANTIGO
   Mantenha as classes antigas até que estejam 100% migradas.

6. SCREENSHOT ANTES/DEPOIS
   Ajuda a documentar progresso.

7. PERGUNTE PARA DESIGNERS/STAKEHOLDERS
   Se algo não parecer certo, valide antes de continuar.

═════════════════════════════════════════════════════════════════════

Marca a lista conforme você conclui cada seção!
Sucesso com a implementação! 🚀

═════════════════════════════════════════════════════════════════════
