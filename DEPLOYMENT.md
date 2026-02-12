# 🚀 Guia de Deployment

Instruções para colocar o aplicativo em produção.

## Pré-requisitos

- Node.js 18+ instalado
- PostgreSQL instalado (para produção)
- Conta em um serviço de hosting (Vercel, Railway, Heroku, etc.)
- Domínio configurado (opcional)

## 🔐 Preparação para Produção

### 1. Variáveis de Ambiente

Crie um arquivo `.env.production.local`:

```env
DATABASE_URL="postgresql://user:password@host:5432/db_name"
JWT_SECRET="[gere uma chave aleatória de 32+ caracteres]"
NEXTAUTH_SECRET="[gere outra chave aleatória]"
NODE_ENV="production"
NEXT_PUBLIC_APP_URL="https://seu-dominio.com"
```

Para gerar chaves seguras:
```bash
openssl rand -base64 32
```

### 2. Segurança

- [ ] Alterar todas as chaves secretas
- [ ] Ativar HTTPS
- [ ] Configurar CORS apropriadamente
- [ ] Implementar rate limiting
- [ ] Adicionar logging e monitoramento
- [ ] Realizar teste de segurança
- [ ] Implementar backup automático

### 3. Testes

```bash
npm run build
npm run test  # após implementar testes
```

## 📦 Deploy via Vercel (Recomendado)

### 1. Conectar Repositório

1. Ir para [vercel.com](https://vercel.com)
2. Fazer login com GitHub
3. Clicar em "New Project"
4. Selecionar seu repositório
5. Clicar em "Import"

### 2. Configurar Ambiente

1. Em "Environment Variables", adicione:
   - `DATABASE_URL` (PostgreSQL em produção)
   - `JWT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL`

2. Deixe outras configurações padrão

### 3. Deploy

1. Vercel detectará Next.js automaticamente
2. Clicar em "Deploy"
3. Aguardar build (2-3 minutos)

### 4. Configurar Banco de Dados

Após deploy bem-sucedido:

1. Acessar URL do projeto no Vercel
2. Conectar via SSH ou painel do Vercel
3. Executar migrações:

```bash
npm run prisma:migrate -- --skip-generate
```

4. Executar seed:

```bash
npm run prisma:seed
```

## 🐘 Deploy via Railway

### 1. Criar Conta

1. Ir para [railway.app](https://railway.app)
2. Fazer login com GitHub

### 2. Criar Novo Projeto

1. Clicar em "Start New Project"
2. Selecionar "Deploy from GitHub repo"
3. Autorizar GitHub e selecionar repositório

### 3. Adicionar Banco de Dados

1. Clicar em "Add Service"
2. Selecionar "PostgreSQL"
3. Railway criará automaticamente

### 4. Configurar Variáveis

1. No painel do projeto, clicar em sua app
2. Ir para "Variables"
3. Adicionar:
   - `JWT_SECRET`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_APP_URL` (URL do Railway)
   - `NODE_ENV=production`

Railway detectará `DATABASE_URL` automaticamente do PostgreSQL.

### 5. Deploy

Railway fará deploy automaticamente ao fazer push.

## 🐳 Deploy via Docker

### 1. Criar Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### 2. Criar .dockerignore

```
node_modules
.next
.git
.env*.local
*.db
```

### 3. Build e Execute

```bash
docker build -t controle-acesso .
docker run -p 3000:3000 -e DATABASE_URL=... controle-acesso
```

## 🔄 CI/CD Pipeline

### GitHub Actions (exemplo)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - run: npm install
      - run: npm run build
      - run: npm test
      - run: npm run prisma:migrate -- --skip-generate
      
      # Deploy para Vercel/Railway/etc
```

## 📊 Monitoramento

### Logs

- **Vercel**: Ir para projeto → "Logs"
- **Railway**: Dashboard → "Logs"
- **Sentry** (opcional): Adicionar para rastreamento de erros

### Métricas

- Performance do site: Vercel Analytics
- Erros: Sentry ou console do serviço
- Banco de dados: Dashboard do PostgreSQL

## 🔄 Atualizações

### Fazer Update

```bash
git pull origin main
npm install
npm run build
npm run prisma:migrate
# Deploy automático via Vercel/Railway
```

## 🆘 Troubleshooting

### Erro: "DATABASE_URL não definido"

```bash
# Verificar variáveis
echo $DATABASE_URL

# Ou no painel do seu serviço de hosting
# Redeployar após adicionar variável
```

### Erro: "Port 3000 already in use"

```bash
# Alterar porta em package.json
"dev": "next dev -p 3001"
```

### Build falha

```bash
# Limpar cache
rm -rf .next
npm install
npm run build
```

## 📝 Checklist Final

Antes de colocar em produção:

- [ ] Todas as chaves secretas alteradas
- [ ] HTTPS ativado
- [ ] Banco de dados em produção configurado
- [ ] Backup automatizado configurado
- [ ] Monitoramento e logging ativados
- [ ] Email de contato em caso de problemas
- [ ] Plano de disaster recovery
- [ ] Testes manuais realizados
- [ ] Termos de serviço e política de privacidade
- [ ] Conformidade com LGPD (Brasil)

## 📱 Domínio Customizado

### Vercel

1. No projeto → Settings
2. Domains
3. Adicionar domínio
4. Seguir instruções de DNS

### Railway

1. Dashboard → Settings
2. Custom Domain
3. Adicionar e configurar DNS

## 🆘 Suporte

Para problemas:

- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Next.js: https://nextjs.org/docs
- Prisma: https://www.prisma.io/docs

---

**Sucesso no deploy! 🎉**
