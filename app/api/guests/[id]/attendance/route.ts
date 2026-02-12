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

export async function PATCH(
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

    // Só ADMIN e USER autorizados
    if (payload.role !== 'ADMIN' && payload.role !== 'USER') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const guestId = id;
    const body = await req.json();
    const { present, isPaying = true } = body;

    if (typeof present !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo "present" inválido' },
        { status: 400 }
      );
    }

    // Busca o convidado
    const guest = await prisma.guest.findUnique({
      where: { id: guestId },
      include: { event: true }
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se USER tem acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: payload.userId,
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

    // IDEMPOTÊNCIA: Se já está no estado desejado, retorna 200 com estado atual, não atualiza event
    if ((present && guest.checkedInAt) || (!present && !guest.checkedInAt)) {
      return NextResponse.json({
        success: true,
        guest: {
          id: guest.id,
          fullName: guest.fullName,
          category: guest.category,
          tableNumber: guest.tableNumber,
          checkedInAt: guest.checkedInAt,
          isPaying: guest.isPaying,
          isManual: guest.isManual
        },
        message: present ? 'Presença já confirmada' : 'Presença já estava desfeita'
      });
    }

    // Atualiza guest e event.updatedAt/lastChangeType
    await prisma.$transaction([
      prisma.guest.update({
        where: { id: guestId },
        data: {
          checkedInAt: present ? new Date() : null,
          isPaying: present ? isPaying : true,
          updated_at: new Date()
        }
      }),
      prisma.event.update({
        where: { id: guest.eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: present ? 'CHECKIN' : 'UNDO',
        }
      })
    ]);

    // Busca convidado atualizado
    const updatedGuest = await prisma.guest.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        fullName: true,
        category: true,
        tableNumber: true,
        checkedInAt: true,
        isPaying: true,
        isManual: true
      }
    });

    return NextResponse.json({
      success: true,
      guest: updatedGuest,
      message: present ? 'Presença confirmada' : 'Presença removida'
    });
  } catch (error) {
    console.error('Erro ao atualizar presença:', error);
    return NextResponse.json(
      { error: 'Erro ao atualizar presença' },
      { status: 500 }
    );
  }
}
