# 🔌 Documentação da API

## Base URL

```
http://localhost:3000/api          # Desenvolvimento
https://seu-dominio.com/api        # Produção
```

## Autenticação

Todos os endpoints, exceto `/auth/login`, requerem autenticação via cookie JWT.

O token é armazenado em um cookie HTTP-only chamado `auth-token` e é automaticamente enviado com cada requisição.

## Endpoints de Autenticação

### 1. Login

Autentica um usuário com email e senha.

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@controleacesso.com",
  "password": "Admin@123"
}
```

**Response (200)**
```json
{
  "success": true,
  "user": {
    "id": "clm1a2b3c4d5e6f7g8h9i0j",
    "email": "admin@controleacesso.com",
    "name": "Administrador",
    "role": "ADMIN"
  }
}
```

**Response (401)**
```json
{
  "error": "Email ou senha inválidos."
}
```

**Response (400)**
```json
{
  "error": "Email e senha são obrigatórios."
}
```

---

### 2. Logout

Encerra a sessão do usuário.

```http
POST /api/auth/logout
```

**Response (200)**
```json
{
  "success": true,
  "message": "Logout realizado com sucesso."
}
```

---

### 3. Obter Sessão Atual

Retorna informações do usuário logado.

```http
GET /api/auth/me
```

**Response (200) - Autenticado**
```json
{
  "user": {
    "userId": "clm1a2b3c4d5e6f7g8h9i0j",
    "email": "admin@controleacesso.com",
    "role": "ADMIN"
  }
}
```

**Response (200) - Não autenticado**
```json
{
  "user": null
}
```

---

## Endpoints Preparados (Futuro)

Os seguintes endpoints estão preparados na estrutura para serem implementados:

### Eventos

```http
GET    /api/events              # Listar eventos
POST   /api/events              # Criar evento
GET    /api/events/:id          # Obter evento
PUT    /api/events/:id          # Atualizar evento
DELETE /api/events/:id          # Deletar evento
```

### Convidados

```http
GET    /api/events/:id/guests   # Listar convidados
POST   /api/events/:id/guests   # Adicionar convidado
PUT    /api/guests/:id          # Atualizar convidado
DELETE /api/guests/:id          # Deletar convidado
```

### Check-in

```http
POST   /api/events/:id/check-in # Registrar presença
GET    /api/events/:id/check-in # Listar check-ins
```

### Usuários

```http
GET    /api/users               # Listar usuários (ADMIN)
POST   /api/users               # Criar usuário (ADMIN)
PUT    /api/users/:id           # Atualizar usuário (ADMIN)
DELETE /api/users/:id           # Deletar usuário (ADMIN)
```

---

## Códigos de Status

| Código | Significado | Descrição |
|--------|-------------|-----------|
| 200 | OK | Requisição bem-sucedida |
| 400 | Bad Request | Erro de validação |
| 401 | Unauthorized | Não autenticado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 500 | Internal Server Error | Erro no servidor |

---

## Tipos de Resposta

### Sucesso
```typescript
interface SuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}
```

### Erro
```typescript
interface ErrorResponse {
  success?: false;
  error: string;
}
```

---

## Papéis de Usuário

### ADMIN
- Acesso total ao sistema
- Pode gerenciar eventos
- Pode gerenciar usuários
- Pode visualizar todos os relatórios

### USER (Colaborador)
- Acesso apenas aos eventos vinculados
- Pode realizar check-in
- Pode adicionar convidados

---

## Exemplo de Cliente

### JavaScript/Fetch

```javascript
// Login
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@controleacesso.com',
    password: 'Admin@123'
  })
});

// Logout
await fetch('/api/auth/logout', { method: 'POST' });

// Obter sessão
const meResponse = await fetch('/api/auth/me');
const { user } = await meResponse.json();
```

### Axios (usado no projeto)

```typescript
import { apiClient } from '@/lib/api-client';

// Login
const response = await apiClient.login('email@example.com', 'password');

// Logout
await apiClient.logout();

// Obter sessão
const { data } = await apiClient.getMe();
```

---

## Rate Limiting (Futuro)

A ser implementado em próximas fases:

```
- 100 requisições por 15 minutos por IP
- 5 tentativas de login por 15 minutos por IP
```

---

## Modelos de Dados

### User
```typescript
{
  id: string;           // ID único
  email: string;        // Email único
  name: string;         // Nome completo
  password_hash: string;// Senha hasheada
  role: 'ADMIN' | 'USER';
  created_at: Date;
  updated_at: Date;
}
```

### Event
```typescript
{
  id: string;
  name: string;
  date: Date;
  description?: string;
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  created_at: Date;
  updated_at: Date;
}
```

### UserEvent
```typescript
{
  id: string;
  userId: string;
  eventId: string;
  created_at: Date;
}
```

---

## Segurança

### Headers de Segurança
Implementados automaticamente:
- `HttpOnly` cookies (protege contra XSS)
- `Secure` flag em produção (HTTPS only)
- `SameSite=Lax` (proteção CSRF)

### Validação
- Todos os inputs são validados
- Senhas são hasheadas com bcryptjs
- JWTs têm expiração de 7 dias

---

## Troubleshooting

### Erro: "Token inválido ou expirado"
- Faça login novamente
- Limpe cookies do navegador
- Verifique se o relógio do servidor está sincronizado

### Erro: "Acesso negado"
- Verifique seu papel de usuário
- Confirme se você está vinculado ao recurso

### Cookie não é enviado
- Verifique se está usando `withCredentials: true` no Axios
- Confirme CORS em produção

---

## Changelog da API

### v1.0.0 (Inicial)
- ✅ Endpoints de autenticação
- ✅ Middleware de proteção
- ✅ RBAC básico

---

**Última atualização**: Janeiro 2026

Para mais informações, consulte [README.md](./README.md)
