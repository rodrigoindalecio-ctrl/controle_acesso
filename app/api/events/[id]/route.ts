import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(
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

    const eventId = params.id;

    // Busca o evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      include: {
        users: true
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica autorização
    if (payload.role !== 'ADMIN') {
      // USER precisa estar vinculado ao evento
      const hasAccess = event.users.some((ue: any) => ue.userId === payload.userId);
      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Acesso negado' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({
      event: {
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        description: event.description,
        status: event.status,
        lastChangeType: event.lastChangeType ?? null
      }
    });
  } catch (error) {
    console.error('Erro ao buscar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * PUT /api/events/[id]
 * Editar evento existente
 * Apenas ADMIN pode editar
 */
export async function PUT(
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
        { error: 'Apenas administradores podem editar eventos' },
        { status: 403 }
      );
    }

    const eventId = params.id;

    // Verifica se evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Obtém dados do corpo da requisição
    const body = await req.json();
    const { name, date, description, status } = body;

    // Valida que pelo menos um campo foi fornecido
    if (!name && !date && description === undefined && !status) {
      return NextResponse.json(
        { error: 'Pelo menos um campo deve ser fornecido' },
        { status: 400 }
      );
    }

    // Prepara os dados a atualizar
    const updateData: any = {};

    if (name) {
      updateData.name = String(name).trim();
    }

    if (date) {
      try {
        const eventDate = new Date(date);
        if (isNaN(eventDate.getTime())) {
          throw new Error('Data inválida');
        }
        updateData.date = eventDate;
      } catch (error) {
        return NextResponse.json(
          { error: 'Data no formato ISO inválida' },
          { status: 400 }
        );
      }
    }

    if (description !== undefined) {
      updateData.description = description ? String(description).trim() : null;
    }

    if (status) {
      const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Status inválido. Use: PENDING, ACTIVE, COMPLETED ou CANCELLED' },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    // Atualiza o evento
    const updatedEvent = await prisma.event.update({
      where: { id: eventId },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      event: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        date: updatedEvent.date.toISOString(),
        description: updatedEvent.description,
        status: updatedEvent.status,
        lastChangeType: updatedEvent.lastChangeType ?? null
      }
    });
  } catch (error) {
    console.error('Erro ao atualizar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * DELETE /api/events/[id]
 * Deletar evento
 * Apenas ADMIN pode deletar
 */
export async function DELETE(
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
        { error: 'Apenas administradores podem deletar eventos' },
        { status: 403 }
      );
    }

    const eventId = params.id;

    // Verifica se evento existe
    const event = await prisma.event.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Deleta as relações de usuários primeiro (para evitar constraint)
    await prisma.userEvent.deleteMany({
      where: { eventId }
    });

    // Deleta o evento
    await prisma.event.delete({
      where: { id: eventId }
    });

    return NextResponse.json(
      { success: true, message: 'Evento deletado com sucesso' },
      { status: 204 }
    );
  } catch (error) {
    console.error('Erro ao deletar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
