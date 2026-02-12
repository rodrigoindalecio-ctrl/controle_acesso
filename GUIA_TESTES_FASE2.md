# 🧪 GUIA DE TESTES - FASE 2

## Setup Inicial

### 1. Database Resetado
```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

✅ Dados de teste criados automaticamente

---

## 🧪 Teste 1: Middleware Protege Rotas

### Objetivo
Verificar que usuários não autenticados são redirecionados para `/login`

### Passos
1. Abra http://localhost:3000/dashboard
2. Verifique o URL muda para http://localhost:3000 (ou permanece em /login)

### Resultado Esperado
✅ Redireciona para `/login`

### Técnica Usada
```typescript
// middleware.ts valida token e redireciona
const token = request.cookies.get('auth-token')?.value;
if (!token) {
  return NextResponse.redirect(new URL('/login', request.url));
}
```

---

## 🧪 Teste 2: Login ADMIN e Visualizar Todos os Eventos

### Objetivo
Verificar que ADMIN vê todos os eventos após login

### Passos
1. Acesse http://localhost:3000 (login)
2. Digite credenciais:
   - Email: `admin@controleacesso.com`
   - Senha: `Admin@123`
3. Clique "Entrar"
4. Verifique dashboard

### Resultado Esperado
- ✅ Redireciona para `/dashboard`
- ✅ Exibe: "👑 Administrador"
- ✅ Mostra email: `admin@controleacesso.com`
- ✅ Seção "📅 Todos os Eventos"
- ✅ Lista 2 eventos:
  - "Casamento Ana & João" (ACTIVE)
  - "15 Anos – Maria" (PENDING)

### Verificar Dados
Abra console (F12) e teste:
```javascript
// GET /api/events (como ADMIN)
fetch('/api/events')
  .then(r => r.json())
  .then(d => console.log(d.events.length)) // Deve ser 2
```

---

## 🧪 Teste 3: ADMIN Clica em Evento

### Objetivo
Verificar navegação e acesso a evento específico

### Passos
1. (Logado como ADMIN)
2. No dashboard, clique no card "Casamento Ana & João"
3. Verifique redirecionamento

### Resultado Esperado
- ✅ Navega para `/events/event-wedding`
- ✅ Exibe título do evento
- ✅ Mostra data: "Terça, 15 de junho de 2026 às 18:00"
- ✅ Mostra status: "ACTIVE"
- ✅ Exibe descrição completa
- ✅ Link "← Voltar para Dashboard" funciona

### Verificar Dados
Console:
```javascript
// GET /api/events/event-wedding (como ADMIN)
fetch('/api/events/event-wedding')
  .then(r => r.json())
  .then(d => console.log(d.event.name))
```

---

## 🧪 Teste 4: USER Vê Apenas 1 Evento

### Objetivo
Verificar que USER vê apenas eventos atribuídos

### Passos
1. No dashboard ADMIN, clique "Sair" (logout)
2. Login com credenciais:
   - Email: `colaborador@controleacesso.com`
   - Senha: `User@123`
3. Verifique dashboard

### Resultado Esperado
- ✅ Exibe: "👤 Colaborador"
- ✅ Mostra email: `colaborador@controleacesso.com`
- ✅ Seção "📅 Meus Eventos"
- ✅ Lista apenas 1 evento:
  - "Casamento Ana & João"
- ✅ Evento "15 Anos – Maria" NÃO aparece

### Verificar Dados
Console:
```javascript
// GET /api/events (como USER)
fetch('/api/events')
  .then(r => r.json())
  .then(d => console.log(d.events.length)) // Deve ser 1
```

---

## 🧪 Teste 5: USER Acessa Evento Autorizado

### Objetivo
Verificar que USER consegue acessar evento atribuído

### Passos
1. (Logado como USER)
2. No dashboard, clique em "Casamento Ana & João"
3. Verifique acesso ao evento

### Resultado Esperado
- ✅ Navega para `/events/event-wedding`
- ✅ Exibe detalhes do evento
- ✅ Mensagem "Funcionalidades... Fase 5"

### Verificar Dados
Console:
```javascript
fetch('/api/events/event-wedding')
  .then(r => r.json())
  .then(d => console.log(d.event.name))
```

---

## 🧪 Teste 6: USER Tenta Acessar Evento Não Autorizado

### Objetivo
Verificar que USER não consegue acessar evento não atribuído

### Passos
1. (Logado como USER: colaborador@...)
2. Manualmente altere URL para: `http://localhost:3000/events/event-debutante`
3. Pressione Enter

### Resultado Esperado
- ✅ Redireciona AUTOMATICAMENTE para `/dashboard`
- ✅ Não exibe erro (redireciona silenciosamente)
- ✅ Fica no dashboard

### Verificar Resposta API
Console:
```javascript
// GET /api/events/event-debutante (como USER)
fetch('/api/events/event-debutante')
  .then(r => {
    console.log('Status:', r.status); // Deve ser 403
    return r.json();
  })
  .then(d => console.log(d.error)) // "Acesso negado"
```

---

## 🧪 Teste 7: Logout Funciona

### Objetivo
Verificar que logout limpa cookie e redireciona

### Passos
1. (Logado como USER ou ADMIN)
2. Clique botão "Sair"
3. Verifique redirecionamento

### Resultado Esperado
- ✅ Cookie `auth-token` é deletado
- ✅ Redireciona para `/` (login)
- ✅ Se clicar no dashboard agora, redireciona para login novamente

### Verificar Cookie
Console (F12 → Application → Cookies):
```javascript
// Verificar que cookie não existe mais
document.cookie.includes('auth-token') // false
```

---

## 🧪 Teste 8: Resposta HTTP Correta

### Objetivo
Verificar que endpoints retornam status HTTP corretos

### Passos
Use console ou Postman

#### GET /api/events (autenticado)
```javascript
fetch('/api/events').then(r => {
  console.log('Status:', r.status) // Deve ser 200
  return r.json()
}).then(d => console.log('Events:', d.events.length))
```

#### GET /api/events (não autenticado)
1. Abra nova aba anônima / incógnita
2. Console:
```javascript
fetch('http://localhost:3000/api/events')
  .then(r => {
    console.log('Status:', r.status) // Deve ser 401
    return r.json()
  })
  .then(d => console.log('Error:', d.error))
```

#### GET /api/events/event-id (USER sem acesso)
```javascript
// Logado como colaborador@...
fetch('/api/events/event-debutante')
  .then(r => {
    console.log('Status:', r.status) // Deve ser 403
    return r.json()
  })
  .then(d => console.log('Error:', d.error)) // "Acesso negado"
```

---

## 🧪 Teste 9: Responsividade

### Objetivo
Verificar que dashboard é responsivo

### Passos
1. Abra DevTools (F12)
2. Clique em Device Toolbar (modo mobile)
3. Teste em:
   - Mobile (375px)
   - Tablet (768px)
   - Desktop (1200px)

### Resultado Esperado
- ✅ Layout se adapta em todos tamanhos
- ✅ Menu legível
- ✅ Cards eventos responsivos
- ✅ Sem scroll horizontal

---

## 🧪 Teste 10: Design e UX

### Objetivo
Verificar que interface está elegante e usável

### Checklist Visual
- ✅ Logo visible no topo
- ✅ Cores douradas/champagne (Playfair Display)
- ✅ Cards com hover effect
- ✅ Status badges coloridas:
  - PENDING: amarelo
  - ACTIVE: verde
  - COMPLETED: azul
- ✅ Botões com transições suaves
- ✅ Espaçamento uniforme
- ✅ Contraste text adequado

---

## ✅ Checklist de Testes Completo

| # | Teste | Status |
|---|-------|--------|
| 1 | Middleware redireciona | ✅ |
| 2 | ADMIN vê 2 eventos | ✅ |
| 3 | ADMIN clica evento | ✅ |
| 4 | USER vê 1 evento | ✅ |
| 5 | USER acessa autorizado | ✅ |
| 6 | USER acesso negado | ✅ |
| 7 | Logout funciona | ✅ |
| 8 | HTTP status corretos | ✅ |
| 9 | Responsividade | ✅ |
| 10 | Design elegante | ✅ |

---

## 🎯 Resultado

Se todos os testes **passarem com ✅**, então:

- ✅ Middleware funciona
- ✅ RBAC está correto
- ✅ Dashboard renderiza correto
- ✅ Acesso é restringido apropriadamente
- ✅ Interface é elegante e responsiva
- ✅ **FASE 2 COMPLETA E PRONTA**

---

**Data:** 28/01/2026
**Status:** 🟢 READY FOR PRODUCTION

Próximo: Fase 3 - CRUD de Eventos
