import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { generateCheckInReport } from '@/lib/report/generateCheckInReport';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
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
    const eventId = id;

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

    // Busca todos os guests do evento
    const guests = await prisma.guest.findMany({
      where: { eventId },
      select: {
        id: true,
        fullName: true,
        category: true,
        tableNumber: true,
        checkedInAt: true,
      },
      orderBy: { fullName: 'asc' },
    });

    // Converte Date para string ISO para compatibilidade com generateCheckInReport
    // Nota: undoAt será adicionado via migração quando campos forem adicionados ao schema
    const guestsForReport = guests.map((g) => ({
      id: g.id,
      fullName: g.fullName,
      category: g.category ?? undefined,
      tableNumber: g.tableNumber ?? undefined,
      checkedInAt: g.checkedInAt?.toISOString() ?? undefined,
    }));

    // Gera relatório
    const report = generateCheckInReport(guestsForReport);

    // Response com cache-control para SWR-friendly
    return NextResponse.json(report, {
      headers: {
        'Cache-Control': 'public, max-age=10, s-maxage=10',
      },
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de check-in:', error);
    return NextResponse.json(
      { error: 'Erro ao gerar relatório' },
      { status: 500 }
    );
  }
}
