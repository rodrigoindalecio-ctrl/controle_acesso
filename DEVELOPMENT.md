# 📋 Guia de Desenvolvimento - Próximas Fases

Este documento descreve as funcionalidades a serem implementadas nas próximas fases do projeto.

## 🎯 Fases de Desenvolvimento

### Fase 2: Gerenciamento de Eventos
**Objetivo**: Criar sistema completo de CRUD de eventos

#### Tarefas:
1. **Criar API de eventos**
   - `POST /api/events` - Criar novo evento
   - `GET /api/events` - Listar eventos
   - `GET /api/events/:id` - Obter evento por ID
   - `PUT /api/events/:id` - Atualizar evento
   - `DELETE /api/events/:id` - Deletar evento

2. **Interface de Gerenciamento de Eventos**
   - Página `/admin/events`
   - Formulário de criação/edição
   - Lista com filtros (status, data, etc.)
   - Preview do evento

3. **Validações**
   - Nome obrigatório
   - Data do evento não pode ser no passado
   - Descrição opcional
   - Status controlado

#### Modelos Relacionados:
```typescript
interface Event {
  id: string;
  name: string;
  date: DateTime;
  description?: string;
  status: EventStatus;
  created_at: DateTime;
  updated_at: DateTime;
  // Relações
  users: UserEvent[];
}
```

---

### Fase 3: Gerenciamento de Usuários e Permissões
**Objetivo**: Permitir ADMIN gerenciar colaboradores

#### Tarefas:
1. **Criar API de usuários**
   - `POST /api/users` - Criar novo usuário
   - `GET /api/users` - Listar usuários
   - `GET /api/users/:id` - Obter usuário por ID
   - `PUT /api/users/:id` - Atualizar usuário
   - `DELETE /api/users/:id` - Deletar usuário
   - `POST /api/users/:id/assign-event` - Vincular usuário a evento

2. **Interface de Gerenciamento de Usuários**
   - Página `/admin/users`
   - Formulário de convite/criação
   - Lista de usuários com status
   - Atribuição a eventos

3. **Sistema de Convites**
   - Enviar email com link de criação de senha
   - Token de convite com expiração
   - Primeira autenticação define a senha

---

### Fase 4: Cadastro e Gerenciamento de Convidados
**Objetivo**: Permitir upload e gerenciamento de listas de convidados

#### Tarefas:
1. **Criar modelo Guest**
```prisma
model Guest {
  id String @id @default(cuid())
  name String
  email String?
  phone String?
  eventId String
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  # Atributos sociais
  company String?
  relationship String? // amigo, família, colega
  
  # Controle
  checkInAt DateTime?
  paid Boolean @default(false)
  notes String?
  
  # Acompanhantes
  childrenCount Int @default(0)
  companionCount Int @default(0)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

2. **Sistema de Upload**
   - Upload de CSV/XLSX com lista de convidados
   - Validação e preview antes de importar
   - Tratamento de duplicatas
   - Mapeamento de colunas

3. **Interface de Gerenciamento**
   - Página `/admin/events/:id/guests`
   - Busca e filtros avançados
   - Edição em massa
   - Exportação de listas

---

### Fase 5: Sistema de Check-in
**Objetivo**: Registrar presença de convidados no dia do evento

#### Tarefas:
1. **Criar API de Check-in**
   - `POST /api/events/:id/check-in` - Registrar presença
   - `GET /api/events/:id/check-ins` - Listar check-ins

2. **Interface de Check-in**
   - Página `/events/:id/check-in` (para colaboradores)
   - Busca por nome/email
   - Confirmação de identidade
   - Registro de acompanhantes e crianças
   - Feedback visual (confirmação)

3. **Validações**
   - Verificar se convidado existe na lista
   - Evitar check-in duplo
   - Registro de hora
   - Foto opcional do convidado

---

### Fase 6: Mesas e Alocação de Lugares
**Objetivo**: Gerenciar mesas e alocação de convidados

#### Tarefas:
1. **Criar modelo Table**
```prisma
model Table {
  id String @id @default(cuid())
  eventId String
  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
  
  number Int
  capacity Int
  
  # Alocação
  guests Guest[]
  
  created_at DateTime @default(now())
}
```

2. **Interface de Alocação**
   - Visualização das mesas (grid ou lista)
   - Drag-and-drop de convidados
   - Busca de mesa vazia/disponível

---

### Fase 7: Controle Financeiro
**Objetivo**: Rastrear convidados pagantes e não-pagantes

#### Tarefas:
1. **Campos no Guest**
   - `paid: Boolean`
   - `ticketType: String` (Normal, VIP, Criança)
   - `paymentMethod: String` (Dinheiro, Cartão, PIX)
   - `totalAmount: Decimal`

2. **Relatório de Pagamentos**
   - Página `/admin/events/:id/payments`
   - Total coletado vs esperado
   - Lista de não-pagantes
   - Exportação para financeiro

---

### Fase 8: Dashboard e Relatórios
**Objetivo**: Visão consolidada de dados e estatísticas

#### Tarefas:
1. **Dashboard Admin**
   - Eventos próximos
   - Estatísticas gerais (total de convidados, presença, etc.)
   - Gráficos de check-in em tempo real
   - Alertas (eventos próximos, não-pagantes, etc.)

2. **Dashboard Colaborador**
   - Evento atual
   - Próximos check-ins
   - Estatísticas rápidas

3. **Relatórios**
   - Presença por evento
   - Pagantes vs não-pagantes
   - Tempo de check-in
   - Exportação (PDF/Excel)

---

### Fase 9: Funcionalidades Avançadas
**Objetivo**: Melhorias e integrações

#### Tarefas:
1. **Integração QR Code**
   - Gerar QR code por convidado
   - Leitura rápida para check-in

2. **Notificações**
   - Email de confirmação para convidados
   - Lembretes de evento
   - Notificações em tempo real

3. **Fotos/Mídia**
   - Upload de foto do convidado
   - Foto do evento (portfolio)
   - Galeria de eventos

---

## 🏗️ Padrões e Convenções

### Estrutura de Componentes
```
components/
├── [Feature]/
│   ├── Component.tsx
│   ├── Component.module.css
│   └── Component.types.ts
├── Common/
│   ├── Button/
│   ├── Modal/
│   ├── Form/
│   └── Table/
```

### Estrutura de Rotas
```
app/
├── api/
│   ├── auth/
│   ├── events/
│   ├── users/
│   └── guests/
├── admin/
│   ├── events/
│   ├── users/
│   └── settings/
├── [eventId]/
│   ├── check-in/
│   └── guests/
```

### API Response Pattern
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

### Error Handling
- 400: Bad Request (validação)
- 401: Unauthorized (não autenticado)
- 403: Forbidden (sem permissão)
- 404: Not Found
- 500: Internal Server Error

---

## 🧪 Testes

Futuras fases devem incluir:
- Testes unitários (Jest)
- Testes de integração (API)
- Testes E2E (Cypress/Playwright)

---

## 🚀 Performance e Escalabilidade

### Otimizações Futuras
1. **Caching**
   - Redis para sessões
   - Cache de eventos frequentes

2. **Paginação**
   - Implementar em todas as listas

3. **Busca**
   - Full-text search para convidados

4. **Real-time**
   - WebSocket para check-in ao vivo
   - Atualização em tempo real de dashboards

---

## 📱 Aplicativo Mobile

### Futuro
- App mobile (React Native) para check-in rápido
- Escanear QR code de convidado
- Modo offline

---

## 🔒 Segurança

Implementar nas próximas fases:
- Rate limiting em endpoints
- Validação CSRF
- Input sanitization
- Logging de ações
- Backup automático do banco

---

## 📊 Métricas de Sucesso

- [ ] 99% uptime
- [ ] Tempo de check-in < 5 segundos
- [ ] Performance page load < 2s
- [ ] Zero vulnerabilidades críticas

---

## 📞 Contato

Para dúvidas sobre a implementação, contacte a equipe de desenvolvimento.
