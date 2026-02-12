import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { createAuditLog } from '@/lib/audit';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const undoCheckInSchema = z.object({
  guestId: z.string().nonempty(),
  // P5.1: Motivo obrigatório para undo (5-255 caracteres)
  undoReason: z.string().min(5, 'Motivo deve ter no mínimo 5 caracteres').max(255, 'Motivo deve ter no máximo 255 caracteres'),
});

export async function POST(
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

    // Verifica se evento existe (acesso permitido para qualquer usuário autenticado)
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }


    const body = await req.json();
    const { guestId, undoReason } = undoCheckInSchema.parse(body);

    // Verifica se convidado existe e pertence ao evento
    const guest = await prisma.guest.findUnique({
      where: { id: guestId }
    });

    if (!guest || guest.eventId !== eventId) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se foi marcado como presente
    if (!guest.checkedInAt) {
      return NextResponse.json(
        { error: 'Convidado não foi marcado como presente' },
        { status: 409 }
      );
    }

    const beforeState = { checkedInAt: guest.checkedInAt?.toISOString() || null };

    // P4.3 + P5.1: Undo permitido a qualquer momento
    // Observação: validação de janela de tempo removida — o sistema
    // continua auditável e registra `undoAt`, `undoBy` e `undoReason`.

    // Remove a marcação de presente e atualiza event.updated_at/lastChangeType
    const [updated] = await prisma.$transaction([
      prisma.guest.update({
        where: { id: guestId },
        data: { 
          checkedInAt: null,
          undoAt: new Date(), // P4.3: Registrar quando foi desfeito
          undoBy: payload.userId, // P4.3: Registrar quem desfez
          undoReason: undoReason, // P5.1: Persistir justificativa
        } as any
      }),
      prisma.event.update({
        where: { id: eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'UNCHECK',
        }
      })
    ]);

    const afterState = { checkedInAt: null };

    // Registra na auditoria
    await createAuditLog({
      userId: payload.userId,
      role: payload.role,
      action: 'UNCHECK',
      entityType: 'Guest',
      entityId: guestId,
      before: beforeState,
      after: afterState,
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown'
    });

    return NextResponse.json({
      success: true,
      guest: {
        id: updated.id,
        fullName: updated.fullName,
        checkedInAt: null
      },
      message: `Check-in de ${updated.fullName} desfeito`
    });
  } catch (error) {
    console.error('Erro ao desfazer check-in:', error);
    if (error instanceof z.ZodError) {
      const messages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      return NextResponse.json(
        { 
          error: messages || 'Dados inválidos',
          message: 'Validação falhou'
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { 
        error: 'Erro ao desfazer check-in',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    );
  }
}
