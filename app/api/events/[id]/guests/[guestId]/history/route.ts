import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export interface GuestHistoryEntry {
  type: 'checkin' | 'undo';
  timestamp: string;
  userId: string | null;
  reason?: string; // P5.1: Motivo do undo, se disponível
}

export interface GuestHistoryResponse {
  guestId: string;
  guestName: string;
  history: GuestHistoryEntry[];
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
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

    const { id: eventId, guestId } = await params;

    // Verifica se tem acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: payload.userId,
            eventId: eventId,
          },
        },
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    // Busca convidado
    // @ts-ignore - Campos adicionados via migration (Prisma client desatualizado)
    const guest: any = await (prisma as any).guest.findUnique({
      where: { id: guestId },
    });

    if (!guest || guest.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // Monta histórico
    const history: GuestHistoryEntry[] = [];

    if (guest.checkedInAt) {
      history.push({
        type: 'checkin',
        timestamp: guest.checkedInAt.toISOString(),
        userId: guest.checkedInBy || null,
      });
    }

    if (guest.undoAt) {
      history.push({
        type: 'undo',
        timestamp: guest.undoAt.toISOString(),
        userId: guest.undoBy || null,
        reason: guest.undoReason || undefined, // P5.1: Incluir motivo, se disponível
      });
    }

    // Ordena por timestamp crescente
    history.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    const response: GuestHistoryResponse = {
      guestId: guest.id,
      guestName: guest.fullName,
      history,
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 'public, max-age=5, s-maxage=5',
      },
    });
  } catch (error) {
    console.error('Erro ao buscar histórico:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar histórico' },
      { status: 500 }
    );
  }
}
