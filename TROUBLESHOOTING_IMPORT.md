# 🔧 Guia de Troubleshooting - Importação de Convidados

## ❓ Problemas Comuns e Soluções

### 1️⃣ "Seção de importação não aparece"

#### Possível Causa
- Usuário não é ADMIN
- Hook `useAuth()` ainda está carregando
- Role do usuário não é "ADMIN"

#### Solução
```typescript
// Verificar no console do navegador:
console.log(user?.role); // Deve ser "ADMIN"

// Verificar em Network:
// GET /api/auth/me deve retornar:
{
  "user": {
    "role": "ADMIN"  // ← IMPORTANTE
  }
}
```

---

### 2️⃣ "Arquivo selecionado desaparece"

#### Possível Causa
- Input foi resetado após sucesso
- Componente re-renderizou

#### Solução
```typescript
// Esperado - arquivo é limpo após sucesso
// Para manter o arquivo, edite GuestImportSection.tsx:

// Remova esta seção:
setSelectedFile(null);
if (fileInputRef.current) {
  fileInputRef.current.value = '';
}
```

---

### 3️⃣ "Erro 403 - Acesso Negado"

#### Possível Causa
- Backend rejeitou a requisição
- Role do usuário é USER, não ADMIN
- Cookie de autenticação expirou

#### Solução
```bash
# 1. Limpar cookies/cache
# Abrir DevTools → Storage → Cookies → Deletar tudo

# 2. Fazer login novamente
# Garantir que obtém token válido

# 3. Verificar no console
console.log(document.cookie); // Deve ter "auth-token"
```

---

### 4️⃣ "Erro 400 - Bad Request"

#### Possível Causa
- Arquivo não é CSV válido
- FormData não foi criada corretamente
- Backend espera coluna diferente

#### Solução
```csv
# ✅ Formato CORRETO
full_name,phone,category,table_number,notes
João Silva,11999999999,familia_noivo,A01,Parente
Maria Santos,11988888888,familia_noiva,A02,Amiga

# ❌ ERRADO - falta coluna
full_name
João Silva

# ❌ ERRADO - nomes de coluna diferentes
fullname,email_address
João,joao@example.com
```

---

### 5️⃣ "Botão não responde (sempre desabilitado)"

#### Possível Causa
- `selectedFile` é null
- Arquivo não passou na validação
- Estado loading está true

#### Solução
```typescript
// Adicione debug no componente:
console.log('selectedFile:', selectedFile);
console.log('loading:', loading);
console.log('error:', error);

// Botão precisa de:
// ✅ selectedFile != null
// ✅ loading == false
```

---

### 6️⃣ "Feedback não aparece após upload"

#### Possível Causa
- Resposta do backend não tem `imported` ou `ignored`
- Erro na requisição (status != 200)
- Exception no try/catch

#### Solução
```typescript
// No DevTools → Network
// POST /api/events/[id]/guests/import
// Response deve ser JSON com:
{
  "imported": 3,
  "ignored": 0,
  "errors": []
}

// Se não aparecer, check:
console.log('response:', response); // Verificar status
console.log('data:', data); // Verificar estrutura
```

---

### 7️⃣ "Mensagem de erro não é amigável"

#### Possível Causa
- Erro técnico não foi tratado
- Backend retornou erro inesperado

#### Solução
```typescript
// No GuestImportSection.tsx, adicione mais try/catch:
catch (err) {
  if (err instanceof TypeError) {
    setError('Erro de conexão. Verifique sua internet.');
  } else if (err instanceof SyntaxError) {
    setError('Erro ao processar resposta do servidor.');
  } else {
    setError(err.message || 'Erro desconhecido');
  }
}
```

---

### 8️⃣ "Componente não renderiza"

#### Possível Causa
- Import statement errado
- Arquivo não existe
- Erro de sintaxe no componente

#### Solução
```bash
# 1. Verificar arquivo existe
ls -la app/components/GuestImportSection.tsx

# 2. Verificar build
npm run build

# 3. Verificar erros de compilação
npm run dev # Deve mostrar erros se houver
```

---

### 9️⃣ "ADMIN vê seção mas USER também vê"

#### Possível Causa
- Verificação de role não está funcionando
- `user` é null quando deveria ter valor
- Hook useAuth() retorna role incorreto

#### Solução
```typescript
// Adicione debug na página:
console.log('user:', user);
console.log('user?.role:', user?.role);
console.log('isAdmin:', isAdmin);

// Verifique a lógica:
const isAdmin = user?.role === 'ADMIN';
console.log('isAdmin:', isAdmin); // Deve ser false para USER
```

---

### 🔟 "Arquivo muito grande (timeout)"

#### Possível Causa
- CSV com muitos registros
- Upload levando muito tempo
- Network lenta

#### Solução
```typescript
// Adicione timeout no fetch:
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s

const response = await fetch(url, {
  ...options,
  signal: controller.signal
});

clearTimeout(timeoutId);
```

---

## 🔍 Debug Checklist

```typescript
// Adicione este código no console:

// 1. Verificar autenticação
fetch('/api/auth/me').then(r => r.json()).then(console.log);

// 2. Verificar events
fetch('/api/events').then(r => r.json()).then(console.log);

// 3. Verificar role
document.cookie;

// 4. Verificar elemento existe
document.querySelector('[class*="ImportSection"]');

// 5. Verificar rendering
// DevTools → React tab → Inspect component
```

---

## 📊 Análise de Network

### Requisição GET /api/events/[id]
```
Status: 200
Headers:
  Content-Type: application/json
  Set-Cookie: auth-token=...

Body:
{
  "event": {
    "id": "...",
    "name": "...",
    "role": "ADMIN"
  }
}
```

### Requisição POST /api/events/[id]/guests/import
```
Status: 200
Headers:
  Content-Type: application/json

Body:
{
  "imported": 3,
  "ignored": 0,
  "errors": []
}
```

---

## 🆘 Ainda com Problemas?

### Verificação Passo a Passo

1. **Arquivo existe?**
   ```bash
   cat app/components/GuestImportSection.tsx | head -20
   ```

2. **Componente é exportado?**
   ```typescript
   export default function GuestImportSection() { ... }
   ```

3. **Está importado corretamente?**
   ```typescript
   import GuestImportSection from '@/app/components/GuestImportSection';
   ```

4. **Está renderizado?**
   ```typescript
   {isAdmin && <GuestImportSection eventId={eventId} />}
   ```

5. **useAuth() funciona?**
   ```typescript
   const { user, loading, error } = useAuth();
   console.log(user, loading, error);
   ```

---

## 📝 Logs Recomendados

Adicione no GuestImportSection.tsx:

```typescript
console.log('Component mounted', { eventId });
console.log('File selected', { selectedFile });
console.log('Submitting form', { selectedFile, loading });
console.log('Upload response', { status, data });
console.log('Final result', { result, error });
```

---

## 🎯 Teste Rápido

```bash
# 1. Abrir console (F12)
# 2. Executar:

// Login
fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@example.com',
    password: 'admin123'
  })
}).then(r => r.json()).then(console.log);

// Depois de fechar/abrir página:
// Verificar evento
fetch('/api/events').then(r => r.json()).then(console.log);

// Verificar seção de importação aparece
document.querySelector('[class*="ImportSection"]')?.textContent
```

---

## 💡 Tips & Tricks

### Ver estado do componente
```typescript
// No arquivo GuestImportSection.tsx, adicione:
useEffect(() => {
  console.log('State:', { selectedFile, loading, result, error });
}, [selectedFile, loading, result, error]);
```

### Forçar re-render
```typescript
// Pressione F12 e refresh da página
// Ou feche a aba e abra novamente
```

### Limpar cache
```typescript
// DevTools → Application → Storage → Clear All
// Depois refresh (Ctrl+Shift+R)
```

---

**Última atualização**: 29/01/2026
