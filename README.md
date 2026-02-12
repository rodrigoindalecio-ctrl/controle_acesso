# 🎉 Controle de Acesso - Sistema de Eventos Sociais

Sistema profissional de check-in e controle de acesso para eventos sociais (casamentos, debutantes e eventos corporativos).

## ✨ Características

- **Autenticação Segura**: Login com e-mail e senha usando JWT
- **Controle de Acesso por Papel (RBAC)**:
  - **ADMIN**: Acesso total ao sistema
  - **USER**: Colaborador com acesso restrito
- **Interface Elegante**: Design refinado com tema para eventos sociais
- **Banco de Dados**: SQLite com Prisma ORM
- **API RESTful**: Rotas protegidas por autenticação

## 🚀 Quick Start

### 1. Instalação de Dependências

```bash
npm install
```

### 2. Configurar Banco de Dados

```bash
# Criar arquivo de migração
npm run prisma:migrate

# Seed com usuário ADMIN padrão
npm run prisma:seed
```

### 3. Iniciar Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000`

## 📝 Credenciais Padrão

Para ambiente de desenvolvimento, um usuário ADMIN é criado automaticamente:

- **Email**: `admin@controleacesso.com`
- **Senha**: `Admin@123`

⚠️ **IMPORTANTE**: Altere a senha após o primeiro login em ambiente de produção!

## 📁 Estrutura do Projeto

```
controle_acesso/
├── app/                      # Next.js App Router
│   ├── api/                 # Rotas da API
│   │   └── auth/
│   │       ├── login/       # Autenticação
│   │       ├── logout/
│   │       └── me/
│   ├── dashboard/           # Página de dashboard
│   ├── page.tsx             # Página de login
│   ├── globals.css          # Estilos globais
│   └── layout.tsx           # Layout raiz
├── lib/                      # Utilitários
│   ├── auth.ts              # Funções de autenticação
│   ├── middleware.ts        # Middleware de proteção
│   └── session.ts           # Gerenciamento de sessão
├── prisma/
│   ├── schema.prisma        # Modelo de banco de dados
│   └── seed.ts              # Script de seed
├── .env.local               # Variáveis de ambiente
├── package.json
├── tsconfig.json
└── next.config.js
```

## 🔐 Sistema de Autenticação

### API Endpoints

#### Login
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@controleacesso.com",
  "password": "Admin@123"
}
```

#### Logout
```bash
POST /api/auth/logout
```

#### Obter Sessão Atual
```bash
GET /api/auth/me
```

### Fluxo de Autenticação

1. Usuário faz login com email e senha
2. Backend valida credenciais contra hash bcrypt
3. Token JWT é gerado e armazenado em cookie HTTP-only
4. Frontend redireciona para dashboard
5. Todas as requisições subsequentes incluem o cookie
6. Token é validado em cada requisição

## 🎨 Design

O design segue uma paleta de cores elegante apropriada para eventos sociais:

- **Cores Primárias**: Rosé e Dourado (#d4a574, #c9905e)
- **Cores Neutras**: Off-white e Nude claro (#faf7f2, #f5f0eb)
- **Tipografia**:
  - Títulos: Playfair Display (serifada)
  - Corpo: Lato / Inter (sans-serif)

## 🔄 Rotas Protegidas

As rotas de dashboard são automaticamente protegidas:
- Se o usuário não estiver autenticado, é redirecionado para `/`
- A sessão é verificada ao carregar a página
- Logout limpa o cookie de autenticação

## 🗄️ Banco de Dados

### Modelos Atuais

#### User
```prisma
- id (String, PK)
- email (String, unique)
- name (String)
- password_hash (String)
- role (ADMIN | USER)
- created_at (DateTime)
- updated_at (DateTime)
```

#### Event
```prisma
- id (String, PK)
- name (String)
- date (DateTime)
- description (String?, optional)
- status (PENDING | ACTIVE | COMPLETED | CANCELLED)
- created_at (DateTime)
- updated_at (DateTime)
```

#### UserEvent (Relação M2M)
```prisma
- userId (String, FK)
- eventId (String, FK)
- created_at (DateTime)
```

## 📋 Próximas Fases

- [ ] CRUD completo de eventos
- [ ] Gerenciamento de usuários e permissões
- [ ] Cadastro e check-in de convidados
- [ ] Controle de mesas e alocação
- [ ] Registro de crianças e acompanhantes
- [ ] Controle de pagantes vs não-pagantes
- [ ] Upload de fotos/documentos
- [ ] Dashboard de estatísticas
- [ ] Exportação de relatórios (PDF/Excel)
- [ ] Integração com QR code
- [ ] Notificações em tempo real

## ⚙️ Variáveis de Ambiente

Edite `.env.local`:

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key"
JWT_SECRET="your-jwt-secret-key"
```

## 🛠️ Scripts Disponíveis

```bash
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run start            # Inicia servidor de produção
npm run prisma:migrate   # Executa migrações do banco
npm run prisma:seed      # Popula dados iniciais
npm run prisma:studio    # Abre Prisma Studio (interface visual)
```

## 📱 Responsividade

O design é totalmente responsivo:
- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)

## 🔒 Segurança

- Senhas são hasheadas com bcryptjs
- JWTs assinados com chave secreta
- Cookies HTTP-only (seguros contra XSS)
- CSRF protection pronto para implementação
- Validação de entrada em todas as rotas

## 📝 Notas Importantes

- Este é um projeto em desenvolvimento
- Antes de usar em produção, altere todas as chaves secretas
- Implemente rate limiting em endpoints de autenticação
- Adicione logging e monitoramento
- Configure CORS apropriadamente
- Use HTTPS em produção

## 📄 Licença

Todos os direitos reservados © 2026

## 👨‍💻 Suporte

Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ para eventos incríveis**
