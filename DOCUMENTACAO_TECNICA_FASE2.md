# 📚 DOCUMENTAÇÃO TÉCNICA - FASE 2

## Visão Geral

Fase 2 implementa middleware de autenticação, RBAC e um dashboard inicial totalmente funcional.

---

## 1. Middleware de Autenticação

### Arquivo: `middleware.ts`

```typescript
export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*']
};
```

**Fluxo:**
1. Intercepta requisições para rotas protegidas
2. Obtém token do cookie `auth-token`
3. Verifica se token existe
4. Valida token usando `verifyToken()`
5. Se inválido → redireciona para `/login`
6. Se válido → prossegue

**Importante:**
- Usa `NextResponse.redirect()`, não JSON
- Nenhum dado sensível é exposto
- Token é decodificado apenas para validação

---

## 2. RBAC (Role-Based Access Control)

### Locais Onde RBAC É Enforced

#### 2.1 Backend - Endpoint `/api/events`

```typescript
if (payload.role === 'ADMIN') {
  // Todos os eventos
  events = await prisma.event.findMany();
} else {
  // Apenas eventos vinculados
  events = await prisma.event.findMany({
    where: {
      users: { some: { userId: payload.userId } }
    }
  });
}
```

#### 2.2 Backend - Endpoint `/api/events/[id]`

```typescript
// Verifica autorização
if (payload.role !== 'ADMIN') {
  const hasAccess = event.users.some(ue => ue.userId === payload.userId);
  if (!hasAccess) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
  }
}
```

#### 2.3 Frontend - Redireciona se Acesso Negado

```typescript
// Em /events/[id]/page.tsx
if (response.status === 403) {
  router.push('/dashboard');
  return;
}
```

**Segurança:**
- RBAC é enforced no BACKEND
- Frontend apenas segue redirecionamentos
- USER não consegue acessar dados não autorizados

---

## 3. Database Schema

### Tabelas Relacionadas

```
User (users)
├── id: String (PK)
├── email: String (UNIQUE)
├── name: String
├── password_hash: String
├── role: String (ADMIN | USER)
└── events: UserEvent[]

Event (events)
├── id: String (PK)
├── name: String
├── date: DateTime
├── description: String
├── status: String (PENDING | ACTIVE | COMPLETED)
└── users: UserEvent[]

UserEvent (user_events)
├── id: String (PK)
├── userId: String (FK)
├── eventId: String (FK)
└── UNIQUE: (userId, eventId)
```

**Relacionamento:**
- User `1:N` UserEvent
- Event `1:N` UserEvent
- User `M:N` Event (através de UserEvent)

---

## 4. Endpoints de Eventos

### GET /api/events

**Autenticação:** ✅ Obrigatória (JWT)

**Filtro por Role:**
- ADMIN → Todos os eventos
- USER → Eventos onde `UserEvent.userId = currentUser.id`

**Response (200):**
```json
{
  "events": [
    {
      "id": "event-id",
      "name": "Casamento Ana & João",
      "date": "2026-06-15T18:00:00Z",
      "description": "...",
      "status": "ACTIVE"
    }
  ]
}
```

**Error (401):** Token não encontrado ou inválido
```json
{ "error": "Não autenticado" }
```

---

### GET /api/events/[id]

**Autenticação:** ✅ Obrigatória (JWT)

**Validação de Acesso:**
- ADMIN → Sempre tem acesso
- USER → Verifica se está em `event.users`

**Response (200):**
```json
{
  "event": {
    "id": "event-id",
    "name": "Casamento Ana & João",
    "date": "2026-06-15T18:00:00Z",
    "description": "...",
    "status": "ACTIVE"
  }
}
```

**Error (403):** USER não tem acesso ao evento
```json
{ "error": "Acesso negado" }
```

**Error (404):** Evento não encontrado
```json
{ "error": "Evento não encontrado" }
```

---

## 5. Componentes Frontend

### Dashboard (`/dashboard`)

**Props:** Nenhuma (usa hooks e fetch)

**Estados:**
- `user` - Usuário autenticado
- `events` - Lista de eventos filtrada
- `loading` - Carregando dados
- `error` - Mensagem de erro

**Comportamento:**
1. Ao montar: verifica autenticação via `/api/auth/me`
2. Se não autenticado: redireciona para `/`
3. Se autenticado: carrega eventos via `/api/events`
4. Renderiza view diferente para ADMIN vs USER

**Acesso Não Autorizado:**
- Middleware redireciona para `/login`
- Usuário não consegue acessar `/dashboard` sem autenticação

---

### Página de Evento (`/events/[id]`)

**Props:** `params.id` (ID do evento via URL)

**Comportamento:**
1. Faz request a `/api/events/[id]`
2. Se 403 Forbidden: redireciona para `/dashboard`
3. Se encontrado: exibe detalhes
4. Se não encontrado: exibe erro

**Exemplo de URL Acesso Negado:**
```
USER acessa: /events/event-15-anos-maria
Resultado: 403 Forbidden → redireciona para /dashboard
```

---

## 6. Fluxo de Autenticação Completo

### Login Bem-Sucedido

```
User Input: email + password
    ↓
POST /api/auth/login
    ↓
Validar credenciais com bcrypt
    ↓
Gerar JWT (role incluído no payload)
    ↓
Setar cookie auth-token (HTTP-only)
    ↓
Redirecionar para /dashboard
    ↓
Middleware valida cookie
    ↓
Dashboard carrega eventos filtrados por role
```

### Acesso a Rota Protegida

```
GET /dashboard (sem cookie)
    ↓
Middleware valida cookie
    ↓
Cookie não encontrado
    ↓
NextResponse.redirect('/login')
    ↓
User vê login page
```

### Acesso a Evento Não Autorizado

```
USER tenta: GET /events/event-id-nao-vinculado
    ↓
Endpoint verifica: event.users.some(ue => ue.userId === userId)
    ↓
Resultado: false
    ↓
Response: 403 Forbidden
    ↓
Frontend redireciona para /dashboard
```

---

## 7. Dados de Teste Criados

### Usuários

#### ADMIN
```
Email: admin@controleacesso.com
Senha: Admin@123
Role: ADMIN
Eventos: 2 (ambos)
```

#### USER
```
Email: colaborador@controleacesso.com
Senha: User@123
Role: USER
Eventos: 1 (Casamento Ana & João)
```

### Eventos

#### Casamento Ana & João
```
ID: event-wedding
Data: 15/06/2026 18:00
Status: ACTIVE
Descrição: Casamento da Ana e do João. Local: Salão Grand Hotel.
Quem vê: Admin + João Silva
```

#### 15 Anos – Maria
```
ID: event-debutante
Data: 20/08/2026 20:00
Status: PENDING
Descrição: Festa de 15 anos da Maria. Local: Clube da Cidade.
Quem vê: Apenas Admin
```

---

## 8. Tratamento de Erros

### Middleware
| Cenário | Ação |
|---------|------|
| Cookie não existe | Redireciona para /login |
| Token expirado | Redireciona para /login |
| Token inválido | Redireciona para /login |
| Token válido | Prossegue |

### Endpoints de Evento
| Cenário | Status | Response |
|---------|--------|----------|
| Não autenticado | 401 | `{ error: "Não autenticado" }` |
| Evento não existe | 404 | `{ error: "Evento não encontrado" }` |
| USER sem acesso | 403 | `{ error: "Acesso negado" }` |
| Sucesso | 200 | `{ event: {...} }` |
| Erro servidor | 500 | `{ error: "Erro interno..." }` |

### Dashboard
| Cenário | Ação |
|---------|------|
| Carregando | Exibe spinner |
| Não autenticado | Redireciona para `/` |
| Erro ao carregar eventos | Exibe mensagem de erro |
| Sem eventos | Exibe mensagem "Nenhum evento" |

---

## 9. Extensibilidade para Fase 3

### O Que Precisa Ser Adicionado

#### Endpoint POST /api/events
```typescript
export async function POST(req: NextRequest) {
  // Apenas ADMIN pode criar
  // Validar: name, date, description (opcionais), status
  // Criar evento
  // Vincular ADMIN automaticamente
  // Return 201 + evento criado
}
```

#### Endpoint PUT /api/events/[id]
```typescript
export async function PUT(req: NextRequest) {
  // Apenas ADMIN pode editar
  // Validar autorização
  // Atualizar campos
  // Return 200 + evento atualizado
}
```

#### Endpoint DELETE /api/events/[id]
```typescript
export async function DELETE(req: NextRequest) {
  // Apenas ADMIN pode deletar
  // Validar autorização
  // Deletar evento (cascata: UserEvent também deletado)
  // Return 204 (no content)
}
```

### Interface Será Simples
- Form para criar evento
- Edit button em cada evento
- Delete button com confirmação

**Estrutura está 100% pronta para isso!**

---

## 10. Segurança - Checklist

- ✅ JWT com expiração (7 dias)
- ✅ Cookies HTTP-only (não acessível via JS)
- ✅ Secure flag em produção
- ✅ SameSite=Lax (CSRF protection)
- ✅ RBAC enforced no backend
- ✅ Senhas hasheadas com bcryptjs
- ✅ Validação de input em todos endpoints
- ✅ Tratamento de erros sem expor detalhes
- ✅ TypeScript strict para segurança de tipos

---

## 11. Performance

- **Middleware:** Zero overhead, apenas valida token
- **Endpoints:** Queries otimizadas com Prisma
- **Frontend:** CSR com React hooks
- **CSS:** CSS Modules (scoped, sem conflito)
- **Bundle:** Next.js 14 otimizado

---

## 12. Próximos Passos

1. ✅ Fase 2 completa e testada
2. ⏳ Fase 3: CRUD de Eventos (POST/PUT/DELETE)
3. ⏳ Fase 4: Gerenciamento de Usuários
4. ⏳ Fase 5: Check-in de Convidados
5. ⏳ Fase 6 onwards: Mesas, Financeiro, Dashboards, Avançado

---

**Documentação Versão:** 2.0
**Data:** 28/01/2026
**Status:** ✅ PRODUCTION READY
