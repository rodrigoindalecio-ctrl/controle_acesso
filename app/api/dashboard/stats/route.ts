import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
    }

    // Get total events
    const totalEvents = await prisma.event.count();

    // Get total guests across all events
    const totalGuests = await prisma.guest.count();

    // Get next upcoming event
    const nextEvent = await prisma.event.findFirst({
      where: {
        date: {
          gte: new Date()
        },
        status: 'ACTIVE'
      },
      orderBy: {
        date: 'asc'
      },
      select: {
        id: true,
        name: true,
        date: true
      }
    });

    return NextResponse.json({
      totalEvents,
      totalGuests,
      nextEvent: nextEvent ? {
        id: nextEvent.id,
        name: nextEvent.name,
        date: nextEvent.date.toISOString()
      } : null
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
