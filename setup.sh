#!/bin/bash

echo "🎉 Iniciando setup do Controle de Acesso..."
echo ""

# 1. Instalar dependências
echo "📦 Instalando dependências..."
npm install

# 2. Criar banco de dados
echo ""
echo "🗄️  Configurando banco de dados..."
npm run prisma:migrate -- --name init

# 3. Seed com usuário admin
echo ""
echo "👤 Criando usuário administrador padrão..."
npm run prisma:seed

echo ""
echo "✅ Setup concluído com sucesso!"
echo ""
echo "📝 Credenciais padrão:"
echo "   Email: admin@controleacesso.com"
echo "   Senha: Admin@123"
echo ""
echo "🚀 Para iniciar o desenvolvimento, execute:"
echo "   npm run dev"
echo ""
echo "📖 Acesse http://localhost:3000"
