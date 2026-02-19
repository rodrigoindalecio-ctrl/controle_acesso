import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient, Prisma } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

// Singleton pattern para Prisma Client
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
    const eventId = Number(id);

    // Verifica se tem acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId: eventId
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

    // Busca todos os convidados do evento
    const guests = await prisma.guest.findMany({
      where: { eventId },
      select: {
        id: true,
        fullName: true,
        category: true,
        tableNumber: true,
        checkedInAt: true,
        isManual: true,
        isChild: true,
        childAge: true,
        isPaying: true
      },
      orderBy: { fullName: 'asc' }
    });

    const total = guests.length;
    const checkedIn = guests.filter(g => g.checkedInAt).length;
    const pending = total - checkedIn;
    const paying = guests.filter(g => g.checkedInAt && g.isPaying !== false).length;
    const nonPaying = guests.filter(g => g.checkedInAt && g.isPaying === false).length;

    return NextResponse.json({
      guests,
      stats: {
        total,
        checkedIn,
        pending,
        paying,
        nonPaying
      }
    });
  } catch (error) {
    console.error('Erro ao buscar convidados:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar convidados' },
      { status: 500 }
    );
  }
}
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
    const eventId = Number(id);

    // Verifica se tem acesso ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId: eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // Parse request body
    const body = await req.json();
    const { fullName, category, tableNumber, isPaying, isChild, childAge } = body;

    // Validação: nome obrigatório e mínimo 3 caracteres
    if (!fullName || typeof fullName !== 'string') {
      return NextResponse.json(
        { error: 'Nome do convidado é obrigatório' },
        { status: 400 }
      );
    }

    // Normalizar nome: trim + collapse spaces
    const normalizedName = fullName
      .trim()
      .replace(/\s+/g, ' ');

    if (normalizedName.length < 3) {
      return NextResponse.json(
        { error: 'Nome deve ter no mínimo 3 caracteres' },
        { status: 400 }
      );
    }

    // Formatar para armazenamento: Title Case (primeira letra de cada palavra maiúscula)
    const titleCaseName = normalizedName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    // Verificar se convidado já existe (busca por título case armazenado)
    const existingGuest = await prisma.guest.findFirst({
      where: {
        eventId: eventId,
        fullName: titleCaseName
      }
    });

    // IDEMPOTÊNCIA: Se já existe, retorna 200 com estado atual, não atualiza event
    if (existingGuest) {
      return NextResponse.json({
        success: true,
        guest: existingGuest,
        message: 'Convidado já estava na lista.'
      });
    }

    // Validação e normalização de tableNumber se fornecido
    let normalizedTableNumber: string | null = null;
    if (tableNumber) {
      const tableNum = typeof tableNumber === 'number' ? tableNumber : parseInt(String(tableNumber), 10);
      if (isNaN(tableNum) || tableNum < 1) {
        return NextResponse.json(
          { error: 'Número da mesa inválido' },
          { status: 400 }
        );
      }
      normalizedTableNumber = String(tableNum);
    }

    const normalizedCategory =
      typeof category === 'string' && category.trim().length > 0 ? category.trim() : 'outros';

    const normalizedIsPaying = typeof isPaying === 'boolean' ? isPaying : true;
    const normalizedIsChild = typeof isChild === 'boolean' ? isChild : false;

    let normalizedChildAge: number | null = null;
    if (normalizedIsChild) {
      if (childAge !== undefined && childAge !== null && String(childAge).trim() !== '') {
        const parsed = typeof childAge === 'number' ? childAge : parseInt(String(childAge), 10);
        if (Number.isNaN(parsed) || parsed < 0 || parsed > 120) {
          return NextResponse.json(
            { error: 'Idade da criança inválida' },
            { status: 400 }
          );
        }
        normalizedChildAge = parsed;
      }
    }

    // Salvar fullName em Title Case
    const savedFullName = titleCaseName;

    // Cria o convidado e atualiza event.updatedAt/lastChangeType
    let guest;
    await prisma.$transaction(async (tx) => {
      guest = await tx.guest.create({
        data: {
          fullName: savedFullName,
          eventId,
          category: normalizedCategory,
          tableNumber: normalizedTableNumber,
          isManual: true,
          checkedInAt: null,
          checkedInBy: null,
          isPaying: normalizedIsPaying,
          isChild: normalizedIsChild,
          childAge: normalizedIsChild ? normalizedChildAge : null
        },
        select: {
          id: true,
          fullName: true,
          category: true,
          tableNumber: true,
          checkedInAt: true,
          checkedInBy: true,
          isManual: true,
          isPaying: true,
          isChild: true,
          childAge: true
        }
      });
      await tx.event.update({
        where: { id: eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'CREATE',
        }
      });
    });
    return NextResponse.json({
      success: true,
      guest,
      message: 'Convidado adicionado com sucesso'
    }, { status: 201 });
  } catch (error: unknown) {
    console.error('ERRO AO CRIAR CONVIDADO:', error);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error(error.code, error.meta);
    }

    return NextResponse.json(
      { error: 'Erro interno ao criar convidado' },
      { status: 500 }
    );
  }
}

// DELETE - Excluir todos os convidados do evento (ADMIN ou USER vinculado)
export async function DELETE(
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
    const eventId = Number(id);

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

    // Autorização: ADMIN ou USER vinculado ao evento
    if (payload.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: Number(payload.userId),
            eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // Conta quantos convidados serão excluídos
    const guestCount = await prisma.guest.count({
      where: { eventId: eventId }
    });

    if (guestCount === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        message: 'Nenhum convidado para excluir'
      });
    }

    // Exclui todos os convidados do evento
    await prisma.$transaction(async (tx) => {
      await tx.guest.deleteMany({
        where: { eventId: eventId }
      });

      await tx.event.update({
        where: { id: eventId },
        data: {
          updated_at: new Date(),
          lastChangeType: 'DELETE',
        }
      });
    });

    return NextResponse.json({
      success: true,
      deletedCount: guestCount,
      message: `${guestCount} convidado(s) excluído(s) com sucesso`
    });
  } catch (error) {
    console.error('Erro ao excluir convidados:', error);
    return NextResponse.json(
      { error: 'Erro ao excluir convidados' },
      { status: 500 }
    );
  }
}