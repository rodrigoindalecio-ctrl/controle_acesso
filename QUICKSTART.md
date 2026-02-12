# ⚡ Início Rápido

Coloque o aplicativo em funcionamento em 5 minutos!

## Pré-requisitos

- ✅ Node.js 18+ instalado
- ✅ npm ou yarn disponível
- ✅ (Opcional) Git para versionamento

## Instalação (Windows/Linux/Mac)

### 1️⃣ Instalar Dependências

```bash
npm install
```

⏱️ Tempo estimado: 2-3 minutos

### 2️⃣ Configurar Banco de Dados

```bash
npm run prisma:migrate
npm run prisma:seed
```

✅ Isso criará as tabelas e o usuário ADMIN padrão

### 3️⃣ Iniciar Servidor

```bash
npm run dev
```

Você verá:
```
> next dev
  ▲ Next.js 14.0.0
  - Local:        http://localhost:3000
```

### 4️⃣ Acessar a Aplicação

Abra seu navegador:

```
http://localhost:3000
```

## 🔐 Credenciais Padrão

| Campo | Valor |
|-------|-------|
| Email | `admin@controleacesso.com` |
| Senha | `Admin@123` |

## ✨ Próximas Ações

Após fazer login com sucesso:

1. **Explorar Dashboard**: Veja a interface para ADMIN
2. **Alterar Senha**: Recomendado para segurança
3. **Ler Documentação**: Verifique [README.md](./README.md)
4. **Começar Desenvolvimento**: Consulte [DEVELOPMENT.md](./DEVELOPMENT.md)

## 🛠️ Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Inicia servidor com hot-reload

# Build e Produção
npm run build                  # Compila para produção
npm run start                  # Inicia servidor de produção

# Banco de Dados
npm run prisma:migrate         # Executa migrações
npm run prisma:seed           # Popula dados iniciais
npm run prisma:studio         # Abre interface visual do Prisma

# Reset (desenvolvimento)
bash reset-db.sh              # Deleta e recria banco (CUIDADO!)
```

## 📁 Estrutura Básica

```
app/
├── page.tsx           ← Login
├── dashboard/
│   └── page.tsx       ← Dashboard (protegido)
└── api/auth/
    ├── login/         ← POST para autenticar
    ├── logout/        ← POST para sair
    └── me/            ← GET sessão atual
```

## 🚨 Troubleshooting Rápido

### Erro: "npm: comando não encontrado"
```bash
# Instale Node.js em nodejs.org
node --version  # Verifique se está instalado
```

### Erro: "Port 3000 already in use"
```bash
# Use outra porta
npm run dev -- -p 3001
```

### Erro: "DATABASE_URL not found"
```bash
# Crie arquivo .env.local (já existe, verifique)
# Ou copie de .env.example
cp .env.example .env.local
```

### Banco de dados corrompido
```bash
# Reset completo
bash reset-db.sh
```

## 🎯 Checklist de Início

- [ ] Node.js 18+ instalado
- [ ] `npm install` executado com sucesso
- [ ] `npm run prisma:migrate` executado
- [ ] `npm run prisma:seed` executado
- [ ] `npm run dev` iniciou sem erros
- [ ] Navegador abriu `http://localhost:3000`
- [ ] Login bem-sucedido com credenciais padrão
- [ ] Dashboard carregou

## 📚 Próximos Passos

1. **Ler README.md** - Entender a arquitetura
2. **Explorar Código** - Familiarizar com estrutura
3. **Criar Evento** - Quando implementado
4. **Adicionar Convidados** - Quando implementado
5. **Sistema de Check-in** - Fase futura

## 💡 Dicas

- **Hot Reload**: Alterações em arquivos recarregam automaticamente
- **Prisma Studio**: Use `npm run prisma:studio` para ver dados
- **Debugger**: Use DevTools do navegador (F12)
- **Terminal**: Ctrl+C para parar servidor

## 🆘 Precisa de Ajuda?

- 📖 Leia [README.md](./README.md)
- 📋 Consulte [API.md](./API.md) para endpoints
- 🗺️ Veja [DEVELOPMENT.md](./DEVELOPMENT.md) para roadmap
- 🚀 Siga [DEPLOYMENT.md](./DEPLOYMENT.md) para produção

## ⏮️ Reset Completo

Se algo der errado:

```bash
# 1. Parar servidor (Ctrl+C)
# 2. Deletar node_modules
rm -rf node_modules

# 3. Reinstalar
npm install

# 4. Reset banco de dados
bash reset-db.sh

# 5. Iniciar novamente
npm run dev
```

---

✅ **Tudo pronto! Aproveite o desenvolvimento! 🎉**

**Dúvidas?** Entre em contato com a equipe.
