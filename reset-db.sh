#!/bin/bash

# Script para resetar banco de dados em desenvolvimento

echo "⚠️  Este script irá deletar e recriar todo o banco de dados!"
echo "Pressione CTRL+C para cancelar, ou aguarde 5 segundos..."
sleep 5

echo ""
echo "🗑️  Deletando banco de dados..."
rm -f prisma/dev.db prisma/dev.db-journal

echo "🔄 Recriando tabelas..."
npm run prisma:migrate -- --name init

echo "👤 Criando usuário admin padrão..."
npm run prisma:seed

echo ""
echo "✅ Banco de dados resetado com sucesso!"
echo ""
echo "📝 Credenciais padrão:"
echo "   Email: admin@controleacesso.com"
echo "   Senha: Admin@123"
echo ""
echo "🚀 Para iniciar o desenvolvimento:"
echo "   npm run dev"
