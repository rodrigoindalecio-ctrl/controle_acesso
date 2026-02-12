⚡ QUICK START - COMEÇAR EM 5 MINUTOS
═════════════════════════════════════════════════════════════════════

Você não tem tempo? Comece aqui!

═════════════════════════════════════════════════════════════════════

🎯 EM 5 MINUTOS
─────────────────────────────────────────────────────────────────────

1. Leia este arquivo (2 minutos)
2. Abra PALETA_CORES_GUIA.md (1 minuto)
3. Abra lib/components.css (2 minutos)
4. Pronto para começar!

═════════════════════════════════════════════════════════════════════

📁 ARQUIVOS CRIADOS
─────────────────────────────────────────────────────────────────────

DOCUMENTAÇÃO:
  • DESIGN_SYSTEM.md (referência completa)
  • DESIGN_SYSTEM_SUMARIO_EXECUTIVO.md (resumo)
  • PALETA_CORES_GUIA.md (cores rápidas)
  • GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md (como fazer)
  • ACESSIBILIDADE_GUIA.md (validação)
  • ANTES_DEPOIS_VISUAL.md (impacto visual)
  • CHECKLIST_IMPLEMENTACAO_DESIGN_SYSTEM.md (acompanhamento)
  • INDICE_DESIGN_SYSTEM.md (índice)
  • ENTREGA_DESIGN_SYSTEM_v1.0.md (resumo final)

CÓDIGO:
  • lib/components.css (NEW - 400 linhas de componentes CSS)
  • app/globals.css (UPDATED - novas cores)

═════════════════════════════════════════════════════════════════════

🚀 COMEÇAR AGORA
─────────────────────────────────────────────────────────────────────

PASSO 1: Escolher um componente
─────────────────────────────────
Qual você quer refatorar primeiro?

[ ] Botões (UndoReasonModal.tsx)
[ ] Cards (CheckInList.tsx)
[ ] Inputs (UndoReasonModal textarea)
[ ] Modais (UndoReasonModal completo)

Recomendado: COMECE COM BOTÕES (mais fácil)

PASSO 2: Importar a biblioteca
───────────────────────────────
No seu componente, adicione no topo:

```jsx
import '../../../lib/components.css';
```

PASSO 3: Usar as classes
────────────────────────
Substitua o className do seu elemento:

ANTES:
<button className={styles.submitBtn}>Confirmar</button>

DEPOIS:
<button className="btn-primary">Confirmar</button>

PASSO 4: Testar
───────────────
npm run dev
Abra browser em http://localhost:3000
Veja o botão com novo estilo!

PASSO 5: Repetir
────────────────
Próximo botão, próximo componente, etc.

═════════════════════════════════════════════════════════════════════

🎨 CLASSES PRINCIPAIS
─────────────────────────────────────────────────────────────────────

BOTÕES:
  .btn-primary      → Botão azul (ação principal)
  .btn-secondary    → Botão branco (ação secundária)
  .btn-danger       → Botão vermelho (undo, delete)

CARDS:
  .card             → Card padrão
  .card-stat        → Card com contador

INPUTS:
  .input            → Input text/select
  .textarea         → Textarea
  .label            → Label de formulário

MODAIS:
  .modal-backdrop   → Fundo preto
  .modal            → Container do modal
  .modal-header     → Título
  .modal-body       → Conteúdo
  .modal-footer     → Botões

NOTIFICAÇÕES:
  .toast            → Base
  .toast-success    → Verde (✓)
  .toast-danger     → Vermelho (✗)
  .toast-warning    → Amarelo (⚠️)
  .toast-info       → Azul (ℹ️)

═════════════════════════════════════════════════════════════════════

🎯 EXEMPLO PRÁTICO
─────────────────────────────────────────────────────────────────────

Refatorar UndoReasonModal.tsx (5 minutos):

1. Import:
   ```tsx
   import '../../../lib/components.css';
   ```

2. Botões (find/replace):
   ANTES:
   <button className={styles.cancelBtn}>Cancelar</button>
   <button className={styles.confirmBtn}>Confirmar</button>
   
   DEPOIS:
   <button className="btn-secondary">Cancelar</button>
   <button className="btn-primary">Confirmar</button>

3. Textarea:
   ANTES:
   <textarea className={styles.reasonInput} />
   
   DEPOIS:
   <textarea className="textarea input" />

4. Testar:
   npm run dev
   Abrir modal → Ver novo estilo ✓

═════════════════════════════════════════════════════════════════════

💡 DICAS RÁPIDAS
─────────────────────────────────────────────────────────────────────

✅ FAÇA:
  • Usar as classes prontas de lib/components.css
  • Testar após cada mudança
  • Fazer git commit após cada componente
  • Consultar PALETA_CORES_GUIA.md se tiver dúvida

❌ NÃO FAÇA:
  • Não remova o CSS antigo ainda
  • Não mude cores diretamente (use CSS variables)
  • Não ignore erros de TypeScript
  • Não pule testes visuais

═════════════════════════════════════════════════════════════════════

📱 RESPONSIVIDADE
─────────────────────────────────────────────────────────────────────

Todos os componentes já são responsivos!

Mobile (375px):     Automático ✓
Tablet (768px):     Automático ✓
Desktop (1920px):   Automático ✓

Não precisa fazer nada de especial.

═════════════════════════════════════════════════════════════════════

🎨 PALETA DE CORES (QUICK REF)
─────────────────────────────────────────────────────────────────────

Cor           | Hex     | Uso
──────────────────────────────────────────
Primária      | #d4a574 | Botões, destaques
Sucesso       | #6ba583 | Check-in OK
Perigo        | #c97e7e | Undo, delete
Aviso         | #d9b57a | Avisos
Info          | #8ab4d8 | Dicas
Branco        | #ffffff | Backgrounds
Texto         | #212121 | Títulos
Texto suave   | #424242 | Body text

═════════════════════════════════════════════════════════════════════

🔍 TESTES RÁPIDOS
─────────────────────────────────────────────────────────────────────

Após refatorar um componente:

[ ] npm run build (sem erros TypeScript)
[ ] npm run dev (visual ok?)
[ ] Hover states funcionam?
[ ] Mobile (DevTools 375px) - ok?
[ ] Sem erros no console?
[ ] Funcionalidade ainda funciona?

═════════════════════════════════════════════════════════════════════

📚 PRÓXIMA LEITURA
─────────────────────────────────────────────────────────────────────

Depois de fazer 1-2 componentes:

1. GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md (como continuar)
2. PALETA_CORES_GUIA.md (referência de cores)
3. ACESSIBILIDADE_GUIA.md (validar tudo)

═════════════════════════════════════════════════════════════════════

❓ FAQ RÁPIDO
─────────────────────────────────────────────────────────────────────

P: Qual cor de botão usar?
R: .btn-primary (azul), .btn-secondary (branco), .btn-danger (vermelho)

P: Como validar se tá certo?
R: Consulte PALETA_CORES_GUIA.md e veja o screenshot

P: E se quebrar algo?
R: git revert do último commit. Tudo é CSS, sem lógica quebrada.

P: Quanto tempo vai levar?
R: ~15-20 horas total para todo app (em 5 fases)
   Ou ~2-3 horas por componente principal

P: Preciso ler tudo?
R: NÃO! Este arquivo + lib/components.css é suficiente para começar.

═════════════════════════════════════════════════════════════════════

🎬 VAMOS COMEÇAR!
─────────────────────────────────────────────────────────────────────

1. Abra: app/components/UndoReasonModal.tsx
2. Adicione no topo: import '../../../lib/components.css';
3. Mude: className={styles.cancelBtn} → className="btn-secondary"
4. Mude: className={styles.confirmBtn} → className="btn-primary"
5. Execute: npm run dev
6. Veja o resultado!

✅ Pronto! Você começou!

═════════════════════════════════════════════════════════════════════

💬 AINDA NÃO SABE POR ONDE COMEÇAR?
─────────────────────────────────────────────────────────────────────

OK, então:

1. Abra: INDICE_DESIGN_SYSTEM.md
2. Leia: Seção "Começar Aqui"
3. Siga a ordem sugerida

═════════════════════════════════════════════════════════════════════

✨ PRONTO PARA RODAR!

Boa sorte! 🚀

═════════════════════════════════════════════════════════════════════
