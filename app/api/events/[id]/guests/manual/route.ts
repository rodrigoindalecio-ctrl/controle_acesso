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

    // Só ADMIN e USER autorizados
    if (payload.role !== 'ADMIN' && payload.role !== 'USER') {
      return NextResponse.json(
        { error: 'Acesso negado' },
        { status: 403 }
      );
    }

    const { id } = await params;
    const eventId = id;
    const body = await req.json();
    const { fullName, category = 'outros' } = body;

    if (!fullName || typeof fullName !== 'string' || fullName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Nome é obrigatório' },
        { status: 400 }
      );
    }

    // Verifica se USER tem acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId: Number(eventId)
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

    // Verifica se evento existe
    const event = await prisma.event.findUnique({
      where: { id: Number(eventId) }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Evento não encontrado' },
        { status: 404 }
      );
    }

    // Verifica se já existe convidado com esse nome no evento
    const existingGuest = await prisma.guest.findUnique({
      where: {
        fullName_eventId: {
          fullName: fullName.trim(),
          eventId: Number(eventId)
        }
      }
    });

    if (existingGuest) {
      return NextResponse.json(
        { error: 'Convidado com esse nome já existe neste evento' },
        { status: 409 }
      );
    }

    // Cria novo convidado manualmente com check-in automático
    const newGuest = await prisma.guest.create({
      data: {
        fullName: fullName.trim(),
        category: category || 'outros',
        eventId: Number(eventId),
        isManual: true,
        checkedInAt: new Date() // Check-in automático
      },
      select: {
        id: true,
        fullName: true,
        category: true,
        tableNumber: true,
        checkedInAt: true,
        isManual: true
      }
    });

    return NextResponse.json({
      success: true,
      guest: newGuest,
      message: 'Convidado adicionado e marcado como presente'
    }, { status: 201 });
  } catch (error) {
    console.error('Erro ao adicionar convidado:', error);
    return NextResponse.json(
      { error: 'Erro ao adicionar convidado' },
      { status: 500 }
    );
  }
}
