import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Verifica se admin já existe
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@controleacesso.com' }
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    
    const admin = await prisma.user.create({
      data: {
        email: 'admin@controleacesso.com',
        name: 'Administrador',
        password_hash: hashedPassword,
        role: 'ADMIN'
      }
    });
    
    console.log('✅ Usuário ADMIN criado com sucesso!');
    console.log('📧 Email: admin@controleacesso.com');
    console.log('🔐 Senha: Admin@123');
  } else {
    console.log('ℹ️ Usuário ADMIN já existe');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
