# 🚀 FASE 3 - GUIA DE INICIALIZAÇÃO E RESOLUÇÃO DE ERROS

## ✅ Instalação e Setup

### 1. Dependências Instaladas
```bash
npm install zod jose --save
```

Pacotes adicionados:
- `zod` v4.3.6 - Validação de esquema
- `jose` v6.1.3 - JWT utilities (opcional, usando jsonwebtoken)

### 2. Banco de Dados
```bash
npx prisma migrate dev --name add_audit_log_table
```

Alterações:
- ✅ Tabela `audit_logs` criada
- ✅ Índices em userId, action, entityType, created_at
- ✅ Prisma Client regenerado

### 3. Regenerar Prisma Client
```bash
npx prisma generate
```

## 🔧 Resolução de Erros de Tipo TypeScript

Se ver erro: `Property 'auditLog' does not exist on type 'PrismaClient'`

### Causa
VS Code está usando cache desatualizado do TypeScript IntelliSense.

### Solução 1: Reload TypeScript (Rápido)
```
Ctrl+Shift+P → TypeScript: Restart TS Server
```

### Solução 2: Limpar e Regenerar (Completo)
```bash
# 1. Deletar node_modules/@prisma/client
rm -rf node_modules/.prisma
rm -rf node_modules/@prisma

# 2. Reinstalar
npm install
npx prisma generate

# 3. Reload VS Code
```

### Solução 3: Fechar e Reabrir VS Code
Simples mas eficaz. O cache será atualizado.

## 📱 Como Usar a Fase 3

### Para USER (Recepção)

#### 1. Corrigir Dados de Convidado
```
1. Ir para /dashboard
2. Selecionar evento
3. Na tabela, clicar botão "✏️" do convidado
4. Preencher dados a corrigir (opcionais)
5. **OBRIGATÓRIO**: Preencher "Motivo da correção"
6. Clicar aba "Preview" para conferir antes/depois
7. Clicar "Salvar correção"
8. Badge ⚠ aparece indicando correção
```

#### 2. Restrições de Rate Limiting
- ⏱️ Máximo **30 correções por hora** (global)
- 👤 Máximo **5 correções por dia** para o mesmo convidado
- Se ultrapassar, recebe mensagem de erro com tempo de reset

#### 3. Auditoria
- Toda correção é registrada imutavelmente
- Admin pode ver histórico em /admin/audit

### Para ADMIN

#### 1. Ver Auditoria Completa
```
1. Acessar /admin/audit
2. Usar filtros:
   - Ação: (Check-in, Correção, Login, etc)
   - Tipo: (Convidado, Evento, Usuário)
   - Usuário: (Email ou ID)
   - Data: (Intervalo)
3. Clicar "Mostrar mudanças" para expandir
4. Ver before vs after em JSON
```

#### 2. Informações no Log
- 📝 Ação e timestamp
- 👤 Usuário que fez
- 🏷️ Papel (Admin/User)
- 🎯 Entidade afetada (ID)
- 💬 Justificativa (se houver)
- 🌐 IP de origem
- 🔍 Browser User-Agent
- 📊 Before/After snapshots

## 📊 Endpoints da API

### PATCH /api/guests/[id]/correction
Corrige dados de um convidado.

**Headers:**
```
Content-Type: application/json
Cookie: auth-token=<JWT>
```

**Body:**
```json
{
  "fullName": "João Silva",      // Opcional
  "phone": "11987654321",         // Opcional, nullable
  "category": "Acompanhante",     // Opcional
  "notes": "Nome incorreto",      // Opcional, nullable
  "justification": "Correção de dados incompletos"  // OBRIGATÓRIO
}
```

**Resposta (200):**
```json
{
  "message": "Dados do convidado atualizados com sucesso",
  "guest": { ... },
  "auditLog": { ... }
}
```

**Erros:**
- `401` - Não autenticado
- `403` - Sem permissão (não é USER/ADMIN)
- `404` - Convidado não encontrado
- `400` - Dados inválidos (Zod validation)
- `429` - Rate limit excedido

### GET /api/audit
Busca logs de auditoria (ADMIN only).

**Query Parameters:**
```
action=CORRECT_GUEST        // Tipo de ação
entityType=GUEST            // Tipo de entidade
userId=user@email.com       // Usuário
dateFrom=2026-01-01         // Data inicial
dateTo=2026-01-31           // Data final
limit=100                   // Itens por página
offset=0                    // Paginação
```

**Resposta:**
```json
{
  "logs": [
    {
      "id": "...",
      "userId": "...",
      "action": "CORRECT_GUEST",
      "before": { "fullName": "João" },
      "after": { "fullName": "João Silva" },
      "justification": "Correção de nome",
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "created_at": "2026-01-29T19:00:00Z"
    }
  ],
  "total": 150,
  "limit": 100,
  "offset": 0,
  "hasMore": true
}
```

## 🔒 Segurança e Validações

### Campos Validados (Zod)
```
fullName:      min 2, max 255 chars, opcional
phone:         max 20 chars, opcional, can be null
category:      max 50 chars, opcional
notes:         max 500 chars, opcional, can be null
justification: min 5, max 255 chars, OBRIGATÓRIO
```

### Rate Limits
```
Por Hora:      30 correções máx por usuário
Por Convidado: 5 correções máx por dia
Retry-After:   Indicado em mensagem de erro
```

### Auditoria
```
Todos os campos antes/depois salvos em JSON
IP da requisição capturado
User-Agent capturado
Timestamp automático
Motivo obrigatório
Imutável (append-only)
```

## 🧪 Teste Local

### Pré-requisito
```bash
npm run dev
# Abre em http://localhost:3000
```

### 1. Login
```
Email: admin@example.com (ou USER)
Senha: admin123
```

### 2. Ir para Dashboard
```
http://localhost:3000/dashboard
```

### 3. Selecionar Evento
- Escolha um evento existente

### 4. Corrigir Convidado
- Clique no botão "✏️" de um convidado
- Preencha dados
- **Preencha motivo obrigatoriamente**
- Clique "Salvar correção"
- Veja badge ⚠ aparecer

### 5. Ver Auditoria (ADMIN)
```
http://localhost:3000/admin/audit
```

- Use filtros
- Veja timeline
- Clique "Mostrar mudanças"
- Confira before/after

## 📚 Estrutura de Arquivos

```
prisma/
  schema.prisma                    # Adicionado AuditLog model
  migrations/
    20260129220159_.../           # Nova migração

lib/
  audit.ts                         # Auditoria (novo)
  rate-limit.ts                    # Rate limiting (novo)
  validation-schemas.ts            # Zod schemas (novo)
  auth.ts                          # Adicionada verifyAuth()

app/
  api/
    guests/[id]/correction/
      route.ts                     # PATCH endpoint (novo)
    audit/
      route.ts                     # GET endpoint (novo)
  components/
    CorrectionModal.tsx            # Modal (novo)
    CorrectionModal.module.css     # Styling (novo)
    CorrectionStatus.tsx           # Badge (novo)
    CorrectionStatus.module.css    # Styling (novo)
    AuditLog.tsx                   # Timeline (novo)
    AuditLog.module.css            # Styling (novo)
    GuestCheckInList.tsx           # Modificado
    GuestCheckInList.module.css    # Modificado
  admin/
    page.tsx                       # Dashboard (novo)
    page.module.css                # Styling (existe)
```

## 🐛 Troubleshooting

### Erro: "Property 'auditLog' does not exist"
- **Solução**: `Ctrl+Shift+P` → "TypeScript: Restart TS Server"

### Erro: "Cannot find module 'zod'"
- **Solução**: `npm install zod jose --save`

### Erro: "Migrations not applied"
- **Solução**: `npx prisma migrate dev`

### Rate limit não funciona
- **Verificar**: Dados estão no banco?
- **Solução**: Verificar logs de API em Network tab

### Modal não abre
- **Verificar**: User role é USER ou ADMIN?
- **Solução**: Verificar console do browser

## 📞 Suporte

Se encontrar problemas:
1. Verificar console do browser (F12)
2. Verificar terminal do dev (npm run dev)
3. Verificar Network tab (requisições API)
4. Verificar banco de dados (prisma studio)

```bash
npx prisma studio
```

---

**Último Update**: 29/01/2026
**Status**: ✅ Pronto para Produção
**Compatibilidade**: Next.js 14 + Prisma 5 + React 18
