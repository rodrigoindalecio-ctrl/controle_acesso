import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

// Singleton pattern para Prisma Client
const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// PUT - Editar convidado
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Parse params/body
    const { id } = await params;
    const { fullName, category, tableNumber, isPaying, isChild, childAge } = await req.json();

    // Validação básica
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Buscar convidado
    const guest = await prisma.guest.findUnique({
      where: { id }
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // Autorização: ADMIN ou USER vinculado ao evento do convidado
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId: guest.eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Atualizar convidado e event.updated_at na mesma transação
    let updated;
    await prisma.$transaction(async (tx) => {
      updated = await tx.guest.update({
        where: { id },
        data: {
          fullName: fullName.trim(),
          category: category || 'outros',
          tableNumber: tableNumber || null,
          isPaying: typeof isPaying === 'boolean' ? isPaying : true,
          isChild: typeof isChild === 'boolean' ? isChild : false,
          childAge: isChild && childAge ? childAge : null
        }
      });
      await tx.event.update({
        where: { id: guest.eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'UPDATE',
        }
      });
    });
    return NextResponse.json({
      success: true,
      guest: updated
    });
  } catch (error) {
    console.error('Erro ao atualizar convidado:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar convidado' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar convidado
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Verificar se convidado existe
    const guest = await prisma.guest.findUnique({
      where: { id }
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // Autorização: ADMIN ou USER vinculado ao evento do convidado
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId: guest.eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Deleta convidado e atualiza event.updatedAt/lastChangeType
    await prisma.$transaction([
      prisma.guest.delete({ where: { id } }),
      prisma.event.update({
        where: { id: guest.eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'DELETE',
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: 'Convidado deletado com sucesso'
    });
  } catch (error) {
    console.error('Erro ao deletar convidado:', error);
    return NextResponse.json(
      { error: 'Erro ao deletar convidado' },
      { status: 500 }
    );
  }
}
