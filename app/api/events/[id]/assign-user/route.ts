import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

/**
 * POST /api/events/[id]/assign-user
 * Vincular usuário a um evento
 * Apenas ADMIN pode vincular
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Obtém o token do cookie
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Valida o token
    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    // Verifica se é ADMIN
    if (payload.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Apenas administradores podem atribuir usuários a eventos' },
        { status: 403 }
      );
    }

    const eventId = Number(params.id);

    // Obtém dados do corpo da requisição
    const body = await req.json();
    const { userId } = body;

    // Validação de campo obrigatório
    if (!userId) {
      return NextResponse.json(
        { error: 'Campo obrigatório: userId' },
        { status: 400 }
      );
    }

    // Verifica se o evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: Number(userId) }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se o usuário já está vinculado ao evento
    const existingAssignment = await prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId: Number(userId),
          eventId: eventId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json(
        { error: 'Usuário já está vinculado a este evento' },
        { status: 409 }
      );
    }

    // Cria a vinculação
    const assignment = await prisma.userEvent.create({
      data: {
        userId: Number(userId),
        eventId: eventId
      }
    });

    return NextResponse.json(
      {
        success: true,
        assignment: {
          userId: assignment.userId,
          eventId: assignment.eventId
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao vincular usuário a evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
