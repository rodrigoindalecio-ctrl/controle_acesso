import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

type CollaboratorDTO = {
  id: string;
  email: string;
  name: string;
  role: string;
};

const normalizeEmail = (email: unknown) => {
  if (typeof email !== 'string') return '';
  return email.trim().toLowerCase();
};

const ensureAdmin = (req: NextRequest) => {
  const token = req.cookies.get('auth-token')?.value;
  if (!token) {
    return { ok: false as const, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { ok: false as const, res: NextResponse.json({ error: 'Token inválido' }, { status: 401 }) };
  }

  if (payload.role !== 'ADMIN') {
    return {
      ok: false as const,
      res: NextResponse.json({ error: 'Apenas administradores podem gerenciar colaboradores' }, { status: 403 })
    };
  }

  return { ok: true as const, payload };
};

/**
 * GET /api/events/[id]/collaborators
 * Lista colaboradores (usuários vinculados) do evento
 * Apenas ADMIN
 */
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const eventId = params.id;

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const assignments = await prisma.userEvent.findMany({
      where: { eventId },
      include: {
        user: { select: { id: true, email: true, name: true, role: true } }
      },
      orderBy: { created_at: 'asc' }
    });

    const collaborators: CollaboratorDTO[] = assignments.map((a) => ({
      id: a.user.id,
      email: a.user.email,
      name: a.user.name,
      role: a.user.role
    }));

    return NextResponse.json({ collaborators });
  } catch (error) {
    console.error('Erro ao listar colaboradores:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/events/[id]/collaborators
 * Adiciona colaborador ao evento por email
 * Body: { email }
 * Apenas ADMIN
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const eventId = params.id;
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body?.email);

    if (!email) {
      return NextResponse.json({ error: 'Campo obrigatório: email' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    const user = await prisma.user.findFirst({
      where: { email },
      select: { id: true, email: true, name: true, role: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado para este email' }, { status: 404 });
    }

    try {
      await prisma.userEvent.create({
        data: {
          userId: user.id,
          eventId
        }
      });
    } catch (e: any) {
      // unique constraint violation
      return NextResponse.json({ error: 'Usuário já está vinculado a este evento' }, { status: 409 });
    }

    return NextResponse.json(
      {
        success: true,
        collaborator: { id: user.id, email: user.email, name: user.name, role: user.role }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao adicionar colaborador:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/events/[id]/collaborators
 * Remove colaborador do evento
 * Body: { userId }
 * Apenas ADMIN
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const eventId = params.id;
    const body = await req.json().catch(() => ({}));
    const userId = typeof body?.userId === 'string' ? body.userId.trim() : '';

    if (!userId) {
      return NextResponse.json({ error: 'Campo obrigatório: userId' }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
    }

    await prisma.userEvent.delete({
      where: {
        userId_eventId: {
          userId,
          eventId
        }
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    // If relationship doesn't exist, treat as success to keep UX simple
    console.error('Erro ao remover colaborador:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
