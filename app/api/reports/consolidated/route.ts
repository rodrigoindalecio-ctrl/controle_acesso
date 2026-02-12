import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const globalForPrisma = global as unknown as { prisma: PrismaClient };
const prisma = globalForPrisma.prisma || new PrismaClient({ log: ['error'] });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Busca eventos que o usuário tem acesso
    let events;
    if (payload.role === 'ADMIN') {
      events = await prisma.event.findMany({
        include: {
          guests: {
            select: {
              id: true,
              fullName: true,
              checkedInAt: true,
              category: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });
    } else {
      const userEvents = await prisma.userEvent.findMany({
        where: { userId: payload.userId },
        select: { eventId: true }
      });
      const eventIds = userEvents.map(ue => ue.eventId);
      events = await prisma.event.findMany({
        where: { id: { in: eventIds } },
        include: {
          guests: {
            select: {
              id: true,
              fullName: true,
              checkedInAt: true,
              category: true
            }
          }
        },
        orderBy: { date: 'desc' }
      });
    }

    // 1. Comparativo de Eventos
    const comparativo = events.map(event => {
      const total = event.guests.length;
      const presentes = event.guests.filter(g => g.checkedInAt !== null).length;
      const ausentes = total - presentes;
      const taxa = total > 0 ? Math.round((presentes / total) * 100) : 0;

      return {
        id: event.id,
        nome: event.name,
        data: event.date,
        status: event.status,
        total,
        presentes,
        ausentes,
        taxa
      };
    }).sort((a, b) => b.taxa - a.taxa); // Ordena por taxa decrescente

    // 2. Histórico Mensal
    const historicoMap: Record<string, { eventos: number; convidados: number; presentes: number }> = {};
    
    events.forEach(event => {
      const date = new Date(event.date);
      const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!historicoMap[mesAno]) {
        historicoMap[mesAno] = { eventos: 0, convidados: 0, presentes: 0 };
      }
      
      historicoMap[mesAno].eventos++;
      historicoMap[mesAno].convidados += event.guests.length;
      historicoMap[mesAno].presentes += event.guests.filter(g => g.checkedInAt !== null).length;
    });

    const historicoMensal = Object.entries(historicoMap)
      .map(([mesAno, dados]) => {
        const [ano, mes] = mesAno.split('-');
        const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        return {
          mesAno,
          label: `${meses[parseInt(mes) - 1]}/${ano}`,
          ...dados,
          taxa: dados.convidados > 0 ? Math.round((dados.presentes / dados.convidados) * 100) : 0
        };
      })
      .sort((a, b) => a.mesAno.localeCompare(b.mesAno));

    // 3. No-shows (por evento) - convidados que não fizeram check-in
    const noShows = events.map(event => {
      const ausentes = event.guests
        .filter(g => g.checkedInAt === null)
        .map(g => ({
          id: g.id,
          nome: g.fullName,
          categoria: g.category
        }));

      return {
        eventoId: event.id,
        eventoNome: event.name,
        eventoData: event.date,
        totalConvidados: event.guests.length,
        totalAusentes: ausentes.length,
        ausentes
      };
    }).filter(e => e.totalAusentes > 0);

    // 4. Atividade de Usuários (baseado no AuditLog)
    const auditLogs = await prisma.auditLog.findMany({
      where: payload.role === 'ADMIN' ? {} : { userId: payload.userId },
      orderBy: { created_at: 'desc' },
      take: 500
    });

    // Buscar usuários para mapear IDs para nomes
    const userIds = [...new Set(auditLogs.map(log => log.userId))];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true }
    });
    const userMap = new Map(users.map(u => [u.id, u]));

    // Atividade por usuário
    const atividadeMap: Record<string, {
      userId: string;
      nome: string;
      email: string;
      checkins: number;
      unchecks: number;
      edicoes: number;
      criacoes: number;
      exclusoes: number;
      importacoes: number;
      total: number;
    }> = {};

    auditLogs.forEach(log => {
      if (!atividadeMap[log.userId]) {
        const user = userMap.get(log.userId);
        atividadeMap[log.userId] = {
          userId: log.userId,
          nome: user?.name || 'Desconhecido',
          email: user?.email || '',
          checkins: 0,
          unchecks: 0,
          edicoes: 0,
          criacoes: 0,
          exclusoes: 0,
          importacoes: 0,
          total: 0
        };
      }

      atividadeMap[log.userId].total++;

      switch (log.action) {
        case 'CHECKIN':
          atividadeMap[log.userId].checkins++;
          break;
        case 'UNCHECK':
          atividadeMap[log.userId].unchecks++;
          break;
        case 'EDIT_GUEST':
        case 'EDIT_EVENT':
        case 'EDIT_USER':
          atividadeMap[log.userId].edicoes++;
          break;
        case 'CREATE_GUEST':
        case 'CREATE_EVENT':
        case 'CREATE_USER':
          atividadeMap[log.userId].criacoes++;
          break;
        case 'DELETE_GUEST':
        case 'DELETE_EVENT':
        case 'DELETE_USER':
          atividadeMap[log.userId].exclusoes++;
          break;
        case 'IMPORT_GUESTS':
          atividadeMap[log.userId].importacoes++;
          break;
      }
    });

    const atividadeUsuarios = Object.values(atividadeMap)
      .sort((a, b) => b.total - a.total);

    // 5. Resumo de Auditoria (ações críticas)
    const acoesCriticas = ['DELETE_GUEST', 'DELETE_EVENT', 'DELETE_USER', 'UNCHECK', 'EDIT_USER'];
    const logsCriticos = auditLogs
      .filter(log => acoesCriticas.includes(log.action))
      .slice(0, 50)
      .map(log => {
        const user = userMap.get(log.userId);
        return {
          id: log.id,
          acao: log.action,
          tipo: log.entityType,
          usuario: user?.name || 'Desconhecido',
          justificativa: log.justification || null,
          data: log.created_at
        };
      });

    // Resumo por tipo de ação
    const resumoAcoes: Record<string, number> = {};
    auditLogs.forEach(log => {
      resumoAcoes[log.action] = (resumoAcoes[log.action] || 0) + 1;
    });

    const auditoria = {
      logsCriticos,
      resumoAcoes: Object.entries(resumoAcoes)
        .map(([acao, quantidade]) => ({ acao, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
      totalAcoes: auditLogs.length
    };

    return NextResponse.json({
      comparativo,
      historicoMensal,
      noShows,
      atividadeUsuarios,
      auditoria
    });
  } catch (error) {
    console.error('Erro ao gerar relatório consolidado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
