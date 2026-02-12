import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    const { id: eventId } = await params;

    // Verifica acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: { userId_eventId: { userId: payload.userId, eventId } }
      });
      if (!userEvent) {
        return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
      }
    }

    // Busca evento
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { id: true, name: true, date: true, status: true }
    });

    if (!event) {
      return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
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
        isChild: true,
        isPaying: true
      }
    });

    const total = guests.length;
    const checkedIn = guests.filter(g => g.checkedInAt !== null);
    const notCheckedIn = guests.filter(g => g.checkedInAt === null);
    const presentes = checkedIn.length;
    const ausentes = notCheckedIn.length;
    const taxaComparecimento = total > 0 ? Math.round((presentes / total) * 100) : 0;

    // Distribuição por categoria
    const categorias: Record<string, { total: number; checkedIn: number }> = {};
    guests.forEach(g => {
      const cat = g.category || 'Outros';
      if (!categorias[cat]) {
        categorias[cat] = { total: 0, checkedIn: 0 };
      }
      categorias[cat].total++;
      if (g.checkedInAt) categorias[cat].checkedIn++;
    });

    // Distribuição por mesa
    const mesas: Record<string, { total: number; checkedIn: number }> = {};
    guests.forEach(g => {
      const mesa = g.tableNumber || 'Sem mesa';
      if (!mesas[mesa]) {
        mesas[mesa] = { total: 0, checkedIn: 0 };
      }
      mesas[mesa].total++;
      if (g.checkedInAt) mesas[mesa].checkedIn++;
    });

    // Horário de check-in (agrupado por hora)
    const checkInsPorHora: Record<string, number> = {};
    checkedIn.forEach(g => {
      if (g.checkedInAt) {
        const hora = new Date(g.checkedInAt).getHours();
        const horaFormatada = `${hora.toString().padStart(2, '0')}:00`;
        checkInsPorHora[horaFormatada] = (checkInsPorHora[horaFormatada] || 0) + 1;
      }
    });

    // Ordena horários
    const horariosOrdenados = Object.entries(checkInsPorHora)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([hora, quantidade]) => ({ hora, quantidade }));

    // Estatísticas de crianças e pagantes
    const criancas = guests.filter(g => g.isChild).length;
    const pagantes = guests.filter(g => g.isPaying && g.checkedInAt).length;

    // Lista completa para impressão (ordenada por nome)
    const listaConvidados = guests
      .map(g => ({
        id: g.id,
        nome: g.fullName,
        categoria: g.category || 'Outros',
        mesa: g.tableNumber || '-',
        presente: g.checkedInAt !== null,
        crianca: g.isChild
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

    return NextResponse.json({
      evento: {
        id: event.id,
        nome: event.name,
        data: event.date,
        status: event.status
      },
      resumo: {
        total,
        presentes,
        ausentes,
        taxaComparecimento,
        criancas,
        pagantes
      },
      distribuicao: {
        categorias: Object.entries(categorias).map(([nome, dados]) => ({
          nome,
          ...dados,
          taxa: dados.total > 0 ? Math.round((dados.checkedIn / dados.total) * 100) : 0
        })),
        mesas: Object.entries(mesas).map(([nome, dados]) => ({
          nome,
          ...dados,
          taxa: dados.total > 0 ? Math.round((dados.checkedIn / dados.total) * 100) : 0
        }))
      },
      checkInsPorHora: horariosOrdenados,
      listaConvidados
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
