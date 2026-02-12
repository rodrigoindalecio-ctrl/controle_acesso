import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
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

    let events;

    if (payload.role === 'ADMIN') {
      // ADMIN vê todos os eventos
      events = await prisma.event.findMany({
        orderBy: { date: 'asc' }
      });
    } else {
      // USER vê apenas eventos vinculados a ele
      events = await prisma.event.findMany({
        where: {
          users: {
            some: {
              userId: payload.userId
            }
          }
        },
        orderBy: { date: 'asc' }
      });
    }

    return NextResponse.json({
      events: events.map((event: any) => ({
        id: event.id,
        name: event.name,
        date: event.date.toISOString(),
        description: event.description,
        status: event.status
      }))
    });
  } catch (error) {
    console.error('Erro ao buscar eventos:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/events
 * Criar novo evento
 * Apenas ADMIN pode criar
 */
export async function POST(req: NextRequest) {
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
        { error: 'Apenas administradores podem criar eventos' },
        { status: 403 }
      );
    }

    // Obtém dados do corpo da requisição
    const body = await req.json();
    const { name, date, description, status } = body;

    // Validação de campos obrigatórios
    if (!name || !date || !status) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, date, status' },
        { status: 400 }
      );
    }

    // Validação de status
    const validStatuses = ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Status inválido. Use: PENDING, ACTIVE, COMPLETED ou CANCELLED' },
        { status: 400 }
      );
    }

    // Validação de data
    let eventDate: Date;
    try {
      eventDate = new Date(date);
      if (isNaN(eventDate.getTime())) {
        throw new Error('Data inválida');
      }
    } catch (error) {
      return NextResponse.json(
        { error: 'Data no formato ISO inválida' },
        { status: 400 }
      );
    }

    // Cria o evento no banco
    const event = await prisma.event.create({
      data: {
        name: String(name).trim(),
        date: eventDate,
        description: description ? String(description).trim() : null,
        status
      }
    });

    // Vincula o ADMIN ao evento automaticamente
    await prisma.userEvent.create({
      data: {
        userId: payload.userId,
        eventId: event.id
      }
    });

    return NextResponse.json(
      {
        success: true,
        event: {
          id: event.id,
          name: event.name,
          date: event.date.toISOString(),
          description: event.description,
          status: event.status
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Erro ao criar evento:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

