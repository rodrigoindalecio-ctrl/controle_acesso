# UX de Importação de Convidados - Implementação Concluída

## 📋 Visão Geral

Implementação completa da UX de importação de convidados com fluxo em 3 etapas:
1. **Upload** - Seleção do arquivo CSV/XLSX
2. **Preview** - Validação e preview antes de confirmar
3. **Confirmação** - Importação e exibição detalhada de resultados

## 🎯 Componentes Criados

### 1. `GuestImportUpload.tsx`
- Componente de upload de arquivo
- Mostra nome e tamanho do arquivo selecionado
- Botão "Validar arquivo" para iniciar validação
- Botão "Trocar arquivo" para seleção diferente

**Props:**
```typescript
{
  onFileSelect: (file: File) => void;
  onValidate: () => Promise<void>;
  isLoading: boolean;
  file: File | null;
  error: string;
}
```

### 2. `GuestImportValidationPreview.tsx`
- Preview em tabela após validação
- Mostra 4 estatísticas: Total, Válidos, Duplicados, Erros
- Status por linha: ✓ OK | ⚠ Duplicado | ✗ Erro
- Bloqueia confirmação se houver erros
- Botões: "Voltar" e "Confirmar importação"

**Props:**
```typescript
{
  validationData: ValidateResponse;
  onConfirm: () => Promise<void>;
  onGoBack: () => void;
  isLoading: boolean;
}
```

### 3. `GuestImportConfirmation.tsx`
- Resumo visual com 4 cards: Criados, Atualizados, Ignorados, Erros
- Tabela detalhada com resultados por convidado
- Colunas: Nome Original | Nome Normalizado | Ação | Motivo
- Badges de status coloridas
- Botão "Fechar e Voltar" para nova importação

**Props:**
```typescript
{
  confirmData: ConfirmResponse;
  onClose: () => void;
}
```

## 🔄 Fluxo de Integração em `GuestImportSection.tsx`

O componente `GuestImportSection` agora orquestra todo o fluxo:

```
1. Upload (step = 'upload')
   ↓ [Validar arquivo]
2. Preview (step = 'preview')
   ↓ [Confirmar importação]
3. Success (step = 'success')
   ↓ [Fechar e Voltar]
   ↑ (volta ao Upload)
```

**Estados gerenciados:**
- `step`: Controla qual componente exibir
- `selectedFile`: Arquivo selecionado
- `validationData`: Resposta do endpoint `/api/guests/import/validate`
- `confirmData`: Resposta do endpoint `/api/guests/import/confirm`
- `loading`: Estado de carregamento
- `error`: Mensagem de erro global

## 📡 Endpoints Utilizados

### POST `/api/guests/import/validate`
Valida arquivo sem salvar

**Request:**
```json
{
  "file": File,
  "eventId": string
}
```

**Response:**
```json
{
  "summary": {
    "total": number,
    "valid": number,
    "invalid": number,
    "duplicates": number
  },
  "data": {
    "valid": Guest[],
    "invalid": Guest[],
    "duplicates": Guest[]
  }
}
```

### POST `/api/guests/import/confirm`
Confirma e salva a importação

**Request:**
```json
{
  "eventId": string,
  "guests": Guest[],
  "duplicateStrategy": "ignore" | "update" | "mark"
}
```

**Response:**
```json
{
  "message": string,
  "summary": {
    "created": number,
    "updated": number,
    "skipped": number,
    "failed": number
  },
  "results": ImportResultItem[]
}
```

## 🎨 Estilos & CSS Modules

- `GuestImportUpload.module.css` - Upload area, file info, buttons
- `GuestImportValidationPreview.module.css` - Summary stats, table, badges
- `GuestImportConfirmation.module.css` - Summary cards, detailed table
- `GuestImportSection.module.css` - Global error banner

**Paleta de cores utilizada:**
- ✓ OK (Verde): `#2ecc71` / `#d4edda`
- ⚠ Duplicado (Laranja): `#f39c12` / `#fff3cd`
- ✗ Erro (Vermelho): `#e74c3c` / `#f8d7da`

## 🔍 Validações & Comportamentos

### Upload
- Apenas CSV e XLSX aceitos
- Mensagem clara se arquivo inválido
- Arquivo pode ser trocado sem perder sessão

### Preview
- Se houver erros: botão "Confirmar" desabilitado
- Aviso em destaque: "Você precisa corrigir os erros"
- Tabela scrollável (max-height: 400px)
- Mostra primeiros 100 registros (se houver mais, aviso)

### Confirmação
- Usa `duplicateStrategy: 'update'` (padrão)
- Resume exatamente o que aconteceu com cada convidado
- Actions por linha:
  - `created` - Novo convidado criado
  - `updated` - Existente foi atualizado
  - `skipped` - Ignorado na importação
  - `marked` - Marcado como duplicado
  - `failed` - Erro ao processar

## 🚀 Como Usar

### Na página de evento `app/events/[id]/page.tsx`

Já está integrado via `GuestImportSection`:

```tsx
import GuestImportSection from '@/app/components/GuestImportSection';

export default function EventPage() {
  // ... código existente ...
  
  const handleImportSuccess = () => {
    // Recarregar lista de convidados se necessário
    setRefreshKey(prev => prev + 1);
  };

  return (
    <>
      {isAdmin && (
        <GuestImportSection 
          eventId={eventId} 
          onImportSuccess={handleImportSuccess}
        />
      )}
    </>
  );
}
```

## ✨ Características de UX

✅ **Loading states claros** - Botões desabilitados durante requisições
✅ **Sem múltiplos submits** - Estados `loading` previnem duplicação
✅ **Mensagens amigáveis** - Sem termos técnicos
✅ **Layout simples** - Tabelas scrolláveis, não poluído
✅ **Feedback por linha** - Usuário vê exatamente o que aconteceu
✅ **Sem surpresas** - Preview antes de confirmar

## 📝 Tipos TypeScript

Todos os componentes são totalmente tipados. Tipos principais:

```typescript
// Resposta de validação
interface ValidateResponse {
  summary: { total: number; valid: number; invalid: number; duplicates: number };
  data: { valid: any[]; invalid: any[]; duplicates: any[] };
  errorCSV?: string;
}

// Resposta de confirmação
interface ConfirmResponse {
  message: string;
  summary: { created: number; updated: number; skipped: number; failed: number };
  results: ImportResultItem[];
  timestamp: string;
}

// Item de resultado por convidado
interface ImportResultItem {
  full_name: string;
  normalizedName: string;
  action: 'created' | 'updated' | 'skipped' | 'marked' | 'failed';
  reason?: string;
  guestId?: string;
}
```

## ⚙️ Customizações Futuras

Se precisar alterar:
- **Estratégia de duplicatas**: Altere `duplicateStrategy` em `GuestImportSection`
- **Limite de linhas preview**: Modifique `max-height` em CSS
- **Cores**: Atualize paleta em CSS modules
- **Mensagens**: Atualize textos em cada componente

## 🔧 Sem Dependências Novas

- Reutiliza CSS variables existentes
- Sem bibliotecas externas adicionadas
- Compatível com Next.js App Router
- TypeScript strict mode
