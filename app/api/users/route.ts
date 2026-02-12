import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * GET /api/users
 * Lista usuários do sistema (para seleção de colaboradores)
 * Apenas ADMIN
 */
export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    if (payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Apenas administradores podem listar usuários' }, { status: 403 });
    }

    // Por padrão, retornamos usuários comuns (colaboradores)
    const users = await prisma.user.findMany({
      where: { role: 'USER' },
      select: { id: true, email: true, name: true, role: true },
      orderBy: [{ name: 'asc' }, { email: 'asc' }]
    });

    return NextResponse.json({
      users: users.map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        role: u.role
      }))
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
