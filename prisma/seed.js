const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Criar usuários
  console.log('📝 Criando usuários...');
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@controleacesso.com' },
    update: {},
    create: {
      email: 'admin@controleacesso.com',
      name: 'Administrador do Sistema',
      password_hash: await bcrypt.hash('Admin@123', 10),
      role: 'ADMIN'
    }
  });
  console.log('  ✅ Admin: admin@controleacesso.com');

  const userCollaborator = await prisma.user.upsert({
    where: { email: 'colaborador@controleacesso.com' },
    update: {},
    create: {
      email: 'colaborador@controleacesso.com',
      name: 'João Silva',
      password_hash: await bcrypt.hash('User@123', 10),
      role: 'USER'
    }
  });
  console.log('  ✅ Usuário: colaborador@controleacesso.com\n');

  // 2. Criar eventos
  console.log('📅 Criando eventos...');
  
  const wedding = await prisma.event.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      name: 'Casamento Ana & João',
      date: new Date('2026-06-15T18:00:00'),
      description: 'Casamento da Ana e do João. Local: Salão Grand Hotel.',
      status: 'ACTIVE'
    }
  });
  console.log('  ✅ ' + wedding.name);

  const debutante = await prisma.event.upsert({
    where: { id: 2 },
    update: {},
    create: {
      id: 2,
      name: '15 Anos – Maria',
      date: new Date('2026-08-20T20:00:00'),
      description: 'Festa de 15 anos da Maria. Local: Clube da Cidade.',
      status: 'PENDING'
    }
  });
  console.log('  ✅ ' + debutante.name);

  // 3. Vincular usuários aos eventos
  console.log('🔗 Vinculando usuários aos eventos...');
  
  // Admin pode ver todos os eventos
  await prisma.userEvent.upsert({
    where: {
      userId_eventId: {
        userId: adminUser.id,
        eventId: wedding.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      eventId: wedding.id
    }
  });
  console.log('  ✅ Admin → Casamento Ana & João');

  await prisma.userEvent.upsert({
    where: {
      userId_eventId: {
        userId: adminUser.id,
        eventId: debutante.id
      }
    },
    update: {},
    create: {
      userId: adminUser.id,
      eventId: debutante.id
    }
  });
  console.log('  ✅ Admin → 15 Anos – Maria');

  // User vinculado apenas ao casamento
  await prisma.userEvent.upsert({
    where: {
      userId_eventId: {
        userId: userCollaborator.id,
        eventId: wedding.id
      }
    },
    update: {},
    create: {
      userId: userCollaborator.id,
      eventId: wedding.id
    }
  });
  console.log('  ✅ João Silva → Casamento Ana & João\n');

  console.log('✨ Seed concluído com sucesso!');
  console.log('\n📋 RESUMO:');
  console.log('  Usuários criados: 2');
  console.log('  Eventos criados: 2');
  console.log('  Vínculos criados: 3');
  console.log('\n🔐 Credenciais de teste:');
  console.log('  ADMIN:');
  console.log('    Email: admin@controleacesso.com');
  console.log('    Senha: Admin@123');
  console.log('  USER (Colaborador):');
  console.log('    Email: colaborador@controleacesso.com');
  console.log('    Senha: User@123');
}

main()
  .catch((e) => {
    console.error('❌ Erro ao fazer seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
