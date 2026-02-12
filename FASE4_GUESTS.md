# 📥 FASE 4: IMPORTAÇÃO DE CONVIDADOS VIA CSV

## ✅ Implementação Completa

### 1️⃣ Model Guest (Prisma)
**Arquivo:** `prisma/schema.prisma`

```prisma
model Guest {
  id           String     @id @default(cuid())
  fullName     String
  phone        String?
  category     String     @default("outros")
  tableNumber  String?
  notes        String?
  checkedInAt  DateTime?
  isManual     Boolean    @default(false)
  isChild      Boolean    @default(false)
  childAge     Int?
  isPaying     Boolean    @default(true)
  
  eventId      String
  event        Event      @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  created_at   DateTime   @default(now())
  updated_at   DateTime   @updatedAt
  
  @@unique([fullName, eventId])
  @@map("guests")
}
```

**Campos:**
- ✅ id (uuid)
- ✅ fullName (obrigatório)
- ✅ phone (opcional)
- ✅ category (familia_noiva, familia_noivo, padrinhos, amigos, vip, outros)
- ✅ tableNumber (opcional)
- ✅ notes (opcional)
- ✅ checkedInAt (para check-in, opcional)
- ✅ isManual (false = importado, true = adicionado manualmente)
- ✅ isChild (false = adulto, true = criança)
- ✅ childAge (idade da criança)
- ✅ isPaying (verdadeiro por padrão)
- ✅ eventId (FK para Event)

---

### 2️⃣ Endpoint CSV Upload
**Arquivo:** `app/api/events/[id]/guests/import/route.ts`

#### Requisição
```
POST /api/events/{eventId}/guests/import
Content-Type: multipart/form-data

file: CSV file
```

#### Headers Esperados no CSV
```
full_name, phone, category, table_number, notes
```

#### Validações Implementadas
✅ Apenas ADMIN pode importar
✅ Headers obrigatórios validados
✅ Linhas vazias ignoradas
✅ `full_name` vazio → linha pulada
✅ Normalização de categoria (valores inválidos → 'outros')
✅ Prevenção de duplicatas: `fullName + eventId` deve ser única
✅ Todos entram com: `isManual=false, isChild=false, isPaying=true`

#### Resposta da API
```json
{
  "imported": 8,
  "skipped": 2,
  "total": 10,
  "errors": [
    "Linha 3: full_name é obrigatório",
    "Linha 5: João Silva já existe neste evento"
  ]
}
```

---

### 3️⃣ Categorias Suportadas

| Categoria | Valor no CSV |
|-----------|-------------|
| Família da noiva | `familia_noiva` |
| Família do noivo | `familia_noivo` |
| Padrinhos/Madrinhas | `padrinhos` |
| Amigos | `amigos` |
| VIP | `vip` |
| Outros | `outros` |

**Normalização:** A API converte automaticamente para minúsculas e valida.

---

### 4️⃣ Componentes Frontend

#### GuestImport.tsx
**Localização:** `app/components/GuestImport.tsx`

Componente responsável por:
- ✅ Seleção de arquivo CSV
- ✅ Upload do arquivo
- ✅ Exibição de progresso
- ✅ Resumo de importação (importados, pulados, erros)
- ✅ Lista dos 10 primeiros erros
- ✅ Instruções de formato

#### EventDetailsModal.tsx
**Localização:** `app/components/EventDetailsModal.tsx`

Modal com abas:
- **Detalhes:** Informações do evento
- **Convidados:** (apenas ADMIN) Componente GuestImport

---

### 5️⃣ Exemplo de Uso

#### CSV de Entrada
```csv
full_name,phone,category,table_number,notes
João Silva,11999999999,familia_noiva,A01,Primo do noivo
Maria Santos,11988888888,familia_noivo,A02,Tia da noiva
Pedro Oliveira,11977777777,padrinhos,B01,Padrinho
Ana Costa,11966666666,amigos,C01,Colega de trabalho
Carlos Mendes,11955555555,vip,VIP01,Gerente da empresa
```

#### Fluxo
1. ADMIN faz login
2. Acessa evento no dashboard
3. Clica em "Convidados"
4. Seleciona arquivo CSV
5. Clica "Importar CSV"
6. Recebe resposta com resumo

#### Resposta Esperada
```json
{
  "imported": 5,
  "skipped": 0,
  "total": 5,
  "errors": []
}
```

---

### 6️⃣ Segurança

✅ **Autenticação:** Validação de JWT
✅ **Autorização:** Apenas ADMIN pode importar
✅ **Validação de entrada:** Cabeçalhos, tipos, caracteres especiais
✅ **Prevenção de duplicatas:** Índice único (fullName + eventId)
✅ **Tratamento de erros:** Try/catch robusto, sem crash
✅ **Rate limiting:** Será implementado em produção

---

### 7️⃣ Testes Recomendados

#### Teste 1: Login ADMIN e importar CSV
```bash
1. Fazer login com admin@controleacesso.com
2. Acessar evento
3. Ir para aba "Convidados"
4. Fazer upload do example_guests.csv
5. Verificar resposta com sucesso
```

#### Teste 2: USER tenta importar (deve falhar)
```bash
1. Fazer login com colaborador@controleacesso.com
2. Tentar acessar endpoint /api/events/[id]/guests/import
3. Deve retornar 403 (Forbidden)
```

#### Teste 3: CSV com dados inválidos
```bash
1. Criar CSV sem header "full_name"
2. Tentar fazer upload
3. Deve retornar erro com headers esperados
```

---

### 8️⃣ Próximos Passos (Fase 5)

- [ ] Endpoint GET /api/events/[id]/guests - listar convidados
- [ ] Endpoint PUT /api/events/[id]/guests/[id] - editar convidado
- [ ] Endpoint POST /api/events/[id]/guests/[id]/checkin - registrar check-in
- [ ] Dashboard de convidados com filtros
- [ ] Relatório de check-in
- [ ] Integração com QR code para check-in

---

## 📊 Status da Implementação

```
✅ Model Guest criado
✅ Endpoint POST /api/events/[id]/guests/import
✅ Validação CSV
✅ Componente GuestImport.tsx
✅ Modal EventDetailsModal.tsx
✅ Arquivo de exemplo (example_guests.csv)
✅ Segurança e RBAC
✅ Tratamento de erros

🚀 PRONTO PARA TESTES
```

---

## 📝 Arquivos Criados/Modificados

| Arquivo | Tipo | Descrição |
|---------|------|-----------|
| `prisma/schema.prisma` | Modified | Adicionado model Guest |
| `app/api/events/[id]/guests/import/route.ts` | Created | Endpoint de upload CSV |
| `app/components/GuestImport.tsx` | Created | Componente de upload |
| `app/components/GuestImport.module.css` | Created | Estilos do upload |
| `app/components/EventDetailsModal.tsx` | Created | Modal de detalhes |
| `app/components/EventDetailsModal.module.css` | Created | Estilos do modal |
| `example_guests.csv` | Created | Arquivo de exemplo |

---

**Data:** 28 de Janeiro de 2026
**Status:** ✅ COMPLETO
