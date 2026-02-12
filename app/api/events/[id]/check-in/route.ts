import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const checkInSchema = z.object({
  guestId: z.string().nonempty(),
  isPaying: z.boolean().optional().default(true),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      console.error('[CHECKIN] Falha de autenticação: token ausente');
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      console.error('[CHECKIN] Token inválido');
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id } = await params;
    const eventId = id;
    const body = await req.json();
    const { guestId, isPaying } = checkInSchema.parse(body);

    // Log do payload recebido
    console.log(`[CHECKIN] Payload recebido:`, { eventId, guestId, checkedInBy: payload.userId, role: payload.role });

    // Verifica se evento existe
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) {
      console.error('[CHECKIN] Evento não encontrado:', eventId);
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    // Verifica se convidado existe e pertence ao evento
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest || guest.eventId !== eventId) {
      console.error('[CHECKIN] Convidado não encontrado ou não pertence ao evento:', guestId);
      return NextResponse.json({ error: 'Convidado não encontrado' }, { status: 404 });
    }

    // Permissão: ADMIN ou USER vinculado ao evento
    let isAuthorized = false;
    if (payload.role === 'ADMIN') {
      isAuthorized = true;
    } else if (payload.role === 'USER') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: payload.userId,
            eventId: eventId
          }
        }
      });
      isAuthorized = !!userEvent;
    }
    if (!isAuthorized) {
      console.error('[CHECKIN] Permissão negada:', { userId: payload.userId, role: payload.role, eventId });
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // IDEMPOTÊNCIA: Se já está presente, retorna 200 com estado atual
    if (guest.checkedInAt) {
      console.log('[CHECKIN] Idempotente: convidado já presente', { guestId });
      return NextResponse.json({
        success: true,
        guest: {
          id: guest.id,
          fullName: guest.fullName,
          checkedInAt: guest.checkedInAt?.toISOString() || null
        },
        message: `${guest.fullName} já estava marcado como presente`
      });
    }

    // Marca como presente e atualiza event.updatedAt e lastChangeType
    await prisma.$transaction([
      prisma.guest.update({
        where: { id: guestId },
        data: {
          checkedInAt: new Date(),
          checkedInBy: payload.userId ?? null,
          isPaying: isPaying,
        }
      }),
      prisma.event.update({
        where: { id: eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'CHECKIN',
        }
      })
    ]);

    // Busca convidado atualizado
    const updated = await prisma.guest.findUnique({ where: { id: guestId } });
    console.log('[CHECKIN] Check-in realizado com sucesso', { guestId, checkedInBy: payload.userId, role: payload.role });
    return NextResponse.json({
      success: true,
      guest: {
        id: updated.id,
        fullName: updated.fullName,
        checkedInAt: updated.checkedInAt?.toISOString() || null
      },
      message: `${updated.fullName} marcado como presente`
    });
  } catch (error) {
    console.error('[CHECKIN] Erro ao marcar check-in:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Erro ao marcar check-in', details: error?.message }, { status: 500 });
  }
}
