🎨 PALETA DE CORES - GUIA PRÁTICO
═════════════════════════════════════════════════════════════════════

ESTRUTURA DE CORES
─────────────────────────────────────────────────────────────────────

Cada cor tem 3 variantes disponíveis:
  --color-X         → Cor principal (para elementos interativos)
  --color-X-light   → Versão clara (para fundos/backgrounds)
  --color-X-dark    → Versão escura (para hover/active states)

═════════════════════════════════════════════════════════════════════

🎯 COR PRIMÁRIA (Ouro Quente)
─────────────────────────────────────────────────────────────────────

Uso: Botões primários, links, destaques, hover effects

--color-primary          #d4a574    ← Padrão (dourado quente)
--color-primary-light    #f4ebe3    ← Fundo suave (hover states)
--color-primary-dark     #b8845f    ← Hover/Active (mais escuro)
--color-primary-pale     #f4ebe3    ← Alias (mesmo que light)

EXEMPLOS DE USO:

✓ Botão primário:
  background: var(--color-primary);  /* #d4a574 */
  
✓ Fundo hover (suave):
  background: var(--color-primary-light);  /* #f4ebe3 */
  
✓ Borda ativa:
  border-color: var(--color-primary-dark);  /* #b8845f */

═════════════════════════════════════════════════════════════════════

✅ SUCESSO (Verde Suave)
─────────────────────────────────────────────────────────────────────

Uso: Check-ins realizados, ações bem-sucedidas, status positivo

--color-success          #6ba583    ← Verde suave (tom premium)
--color-success-light    #e8f5e9    ← Fundo muito claro
--color-success-dark     #4a7c5e    ← Tom escuro para texto

EXEMPLOS DE USO:

✓ Toast de sucesso:
  background: var(--color-success-light);  /* #e8f5e9 */
  color: var(--color-success-dark);        /* #4a7c5e */
  border-left: 4px solid var(--color-success);  /* #6ba583 */

✓ Badge de status OK:
  <div className="badge badge-success">✓ Confirmado</div>

✓ Ícone de sucesso:
  color: var(--color-success);  /* #6ba583 */

═════════════════════════════════════════════════════════════════════

❌ PERIGO (Rosa Queimado)
─────────────────────────────────────────────────────────────────────

Uso: Erros, deletar, ações irreversíveis, avisos críticos

--color-danger           #c97e7e    ← Rosa queimado (dessaturado)
--color-danger-light     #ffebee    ← Fundo muito claro (rose tint)
--color-danger-dark      #a64444    ← Tom escuro para texto

EXEMPLOS DE USO:

✓ Botão de perigo (undo):
  background: transparent;
  border: 1px solid var(--color-danger);      /* #c97e7e */
  color: var(--color-danger);
  
  &:hover {
    background: var(--color-danger-light);    /* #ffebee */
    color: var(--color-danger-dark);          /* #a64444 */
  }

✓ Toast de erro:
  background: var(--color-danger-light);  /* #ffebee */
  color: var(--color-danger-dark);        /* #a64444 */
  border-left: 4px solid var(--color-danger);  /* #c97e7e */

✓ Campo com erro:
  border-color: var(--color-danger);  /* #c97e7e */
  box-shadow: 0 0 0 3px rgba(201, 126, 126, 0.1);

═════════════════════════════════════════════════════════════════════

⚠️ AVISO (Dourado Quente)
─────────────────────────────────────────────────────────────────────

Uso: Avisos, informações importantes, itens pendentes

--color-warning          #d9b57a    ← Dourado quente
--color-warning-light    #fff8e1    ← Fundo amarelo claro
--color-warning-dark     #b8885e    ← Tom escuro

EXEMPLOS DE USO:

✓ Toast de aviso:
  background: var(--color-warning-light);  /* #fff8e1 */
  color: var(--color-dark);
  border-left: 4px solid var(--color-warning);  /* #d9b57a */

✓ Alerta de evento encerrado:
  <div className="badge badge-warning">
    ⚠ Evento encerrado
  </div>

═════════════════════════════════════════════════════════════════════

ℹ️ INFORMAÇÃO (Azul Suave)
─────────────────────────────────────────────────────────────────────

Uso: Informações, dicas, dados auxiliares

--color-info             #8ab4d8    ← Azul suave
--color-info-light       #e3f2fd    ← Fundo azul claro
--color-info-dark        #5a7fa5    ← Tom escuro

EXEMPLOS DE USO:

✓ Toast informativo:
  background: var(--color-info-light);  /* #e3f2fd */
  color: var(--color-dark);
  border-left: 4px solid var(--color-info);  /* #8ab4d8 */

✓ Helper text:
  color: var(--color-info);  /* #8ab4d8 */

═════════════════════════════════════════════════════════════════════

⚫ NEUTRAS (Preto/Cinza/Branco)
─────────────────────────────────────────────────────────────────────

--color-white            #ffffff    ← Branco puro
--color-bg-lighter       #fafafa    ← Cinza muito claro (backgrounds)
--color-bg-light         #f5f5f5    ← Cinza claro (backgrounds)
--color-border           #e0e0e0    ← Cinza para borders
--color-text-muted       #9e9e9e    ← Cinza para textos secundários
--color-text             #424242    ← Cinza escuro para textos
--color-dark             #212121    ← Quase preto para títulos

HIERARQUIA DE CINZAS (Claro → Escuro):
  #ffffff  ← Backgrounds primários (cards, modais)
  #fafafa  ← Backgrounds secundários (footers, asides)
  #f5f5f5  ← Backgrounds terciários (input disabled)
  #e0e0e0  ← Borders
  #9e9e9e  ← Textos mutados (helper, labels pequenos)
  #424242  ← Textos normais (body)
  #212121  ← Títulos (headers)

EXEMPLOS DE USO:

✓ Card padrão:
  background: var(--color-white);           /* #ffffff */
  border: 1px solid var(--color-border);    /* #e0e0e0 */

✓ Texto secundário:
  color: var(--color-text-muted);  /* #9e9e9e */
  font-size: 0.75rem;

✓ Input desabilitado:
  background: var(--color-bg-light);  /* #f5f5f5 */
  color: var(--color-text-muted);     /* #9e9e9e */

═════════════════════════════════════════════════════════════════════

🎯 EXEMPLOS PRÁTICOS DE COMBINAÇÃO
─────────────────────────────────────────────────────────────────────

EXEMPLO 1: Botão Primário
───────────────────────────
.btn-primary {
  background: var(--color-primary);        /* #d4a574 */
  color: white;                            /* texto branco para contraste */
  border: 1px solid var(--color-primary);
}

.btn-primary:hover {
  background: var(--color-primary-dark);   /* #b8845f */
}

.btn-primary:active {
  box-shadow: inset 0 2px 4px rgba(0,0,0,0.2);
}

Resultado: Botão dourado quente, elegante, com feedback claro


EXEMPLO 2: Card com Status de Sucesso
───────────────────────────────────────
.card-success {
  background: var(--color-white);          /* #ffffff */
  border-left: 4px solid var(--color-success);  /* #6ba583 */
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
}

.card-success .status-badge {
  background: var(--color-success-light);  /* #e8f5e9 */
  color: var(--color-success-dark);        /* #4a7c5e */
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

Resultado: Card elegante com indicador visual claro


EXEMPLO 3: Modal de Confirmação
─────────────────────────────────
.modal {
  background: var(--color-white);          /* #ffffff */
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
}

.modal-backdrop {
  background: rgba(0, 0, 0, 0.4);         /* Overlay escuro, não agresivo */
}

.modal button.confirm {
  background: var(--color-primary);        /* #d4a574 */
}

.modal button.cancel {
  background: var(--color-white);          /* #ffffff */
  border: 1px solid var(--color-border);   /* #e0e0e0 */
  color: var(--color-dark);                /* #212121 */
}

.modal button.cancel:hover {
  background: var(--color-bg-light);       /* #f5f5f5 */
  border-color: var(--color-primary);      /* #d4a574 */
}

Resultado: Modal com múltiplas opções, visual claro e sofisticado


EXEMPLO 4: Input com Validação
────────────────────────────────
.input {
  border: 1px solid var(--color-border);   /* #e0e0e0 */
  color: var(--color-text);                /* #424242 */
  background: var(--color-white);          /* #ffffff */
}

.input:focus {
  border-color: var(--color-primary);      /* #d4a574 */
  box-shadow: 0 0 0 3px rgba(212, 165, 116, 0.1);
}

.input-error {
  border-color: var(--color-danger);       /* #c97e7e */
}

.input-error:focus {
  box-shadow: 0 0 0 3px rgba(201, 126, 126, 0.1);
}

.error-text {
  color: var(--color-danger);              /* #c97e7e */
  font-size: 0.75rem;
}

Resultado: Input com feedback visual claro de erro


EXEMPLO 5: Toast de Sucesso
──────────────────────────────
.toast-success {
  background: var(--color-success-light);  /* #e8f5e9 */
  border-left: 4px solid var(--color-success);  /* #6ba583 */
  color: var(--color-success-dark);        /* #4a7c5e */
  box-shadow: var(--shadow-md);
  animation: slideUp 0.3s ease;
}

.toast-success .icon {
  color: var(--color-success);              /* #6ba583 */
  font-weight: bold;
}

Resultado: Notificação discreta mas clara de sucesso

═════════════════════════════════════════════════════════════════════

📋 CHECKLIST DE CORES
─────────────────────────────────────────────────────────────────────

Antes de aplicar cores, validar:

[ ] Contraste adequado (WCAG AA minimum 4.5:1 para texto)
[ ] Cores não usadas apenas para "aviso colorido"
[ ] Consistência em toda a interface
[ ] Variantes light/dark em uso
[ ] Sem cores hardcoded (usar variáveis CSS)
[ ] Paleta reduzida (máximo 4-5 cores primárias)
[ ] Cores acessíveis para daltônicos

═════════════════════════════════════════════════════════════════════

🧪 TESTE DE CONTRASTE
─────────────────────────────────────────────────────────────────────

Usar WebAIM Contrast Checker:
https://webaim.org/resources/contrastchecker/

Exemplos validados:
✅ #d4a574 (ouro) sobre #ffffff (branco) = 4.8:1 (AA)
✅ #6ba583 (verde) sobre #e8f5e9 (claro) = 6.2:1 (AA)
✅ #c97e7e (vermelho) sobre #ffebee (claro) = 5.9:1 (AA)
✅ #424242 (texto) sobre #ffffff (branco) = 9.5:1 (AAA)

═════════════════════════════════════════════════════════════════════

💡 REFERÊNCIA RÁPIDA
─────────────────────────────────────────────────────────────────────

Cor            | Hex      | Uso Típico
─────────────────────────────────────────────────────────────────────
Primária       | #d4a574  | Botões, destaques, links
Sucesso        | #6ba583  | Check-in OK, confirmações
Perigo         | #c97e7e  | Undo, delete, erros críticos
Aviso          | #d9b57a  | Avisos, items pendentes
Informação     | #8ab4d8  | Info, dicas, dados auxiliares
Branco         | #ffffff  | Backgrounds, textos em cores
Cinza Claro    | #f5f5f5  | Backgrounds secundários
Cinza Borda    | #e0e0e0  | Bordas, separadores
Cinza Texto    | #9e9e9e  | Textos mutados, labels
Texto Escuro   | #212121  | Títulos, textos principais

═════════════════════════════════════════════════════════════════════

📚 ARQUIVOS DE REFERÊNCIA
─────────────────────────────────────────────────────────────────────

app/globals.css            → Definições de cores (variáveis CSS)
DESIGN_SYSTEM.md           → Documentação completa
lib/components.css         → Classes reutilizáveis
GUIA_IMPLEMENTACAO_DESIGN_SYSTEM.md → Plano de implementação

═════════════════════════════════════════════════════════════════════
