export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // 1. GET /api/reports/stats (Dashboard stats)
    if (slug[0] === 'stats') {
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        const [totalEvents, totalGuests, nextEvent] = await Promise.all([
            prisma.event.count(),
            prisma.guest.count(),
            prisma.event.findFirst({ where: { date: { gte: new Date() }, status: 'ACTIVE' }, orderBy: { date: 'asc' }, select: { id: true, name: true, date: true } })
        ]);
        return NextResponse.json({ totalEvents, totalGuests, nextEvent: nextEvent ? { ...nextEvent, date: nextEvent.date.toISOString() } : null });
    }

    // 2. GET /api/reports/consolidated
    if (slug[0] === 'consolidated') {
        let events;
        if (payload.role === 'ADMIN') {
            events = await prisma.event.findMany({ include: { guests: { select: { id: true, fullName: true, checkedInAt: true, category: true } } }, orderBy: { date: 'desc' } });
        } else {
            const userEvents = await prisma.userEvent.findMany({ where: { userId: Number(payload.userId) }, select: { eventId: true } });
            events = await prisma.event.findMany({ where: { id: { in: userEvents.map(ue => ue.eventId) } }, include: { guests: { select: { id: true, fullName: true, checkedInAt: true, category: true } } }, orderBy: { date: 'desc' } });
        }

        const comparativo = events.map(event => {
            const total = event.guests.length;
            const presentes = event.guests.filter(g => g.checkedInAt !== null).length;
            const ausentes = total - presentes;
            const taxa = total > 0 ? Math.round((presentes / total) * 100) : 0;
            return { id: event.id, nome: event.name, data: event.date, status: event.status, total, presentes, ausentes, taxa };
        }).sort((a, b) => b.taxa - a.taxa);

        const historicoMap: Record<string, { eventos: number; convidados: number; presentes: number }> = {};
        events.forEach(event => {
            const date = new Date(event.date);
            const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!historicoMap[mesAno]) historicoMap[mesAno] = { eventos: 0, convidados: 0, presentes: 0 };
            historicoMap[mesAno].eventos++;
            historicoMap[mesAno].convidados += event.guests.length;
            historicoMap[mesAno].presentes += event.guests.filter(g => g.checkedInAt !== null).length;
        });

        const historicoMensal = Object.entries(historicoMap)
            .map(([mesAno, dados]) => {
                const [ano, mes] = mesAno.split('-');
                const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
                return { mesAno, label: `${meses[parseInt(mes) - 1]}/${ano}`, ...dados, taxa: dados.convidados > 0 ? Math.round((dados.presentes / dados.convidados) * 100) : 0 };
            }).sort((a, b) => a.mesAno.localeCompare(b.mesAno));

        const noShows = events.map(event => {
            const ausentes = event.guests.filter(g => g.checkedInAt === null).map(g => ({ id: g.id, nome: g.fullName, categoria: g.category || 'Outros' }));
            return { eventoId: event.id, eventoNome: event.name, eventoData: event.date, totalConvidados: event.guests.length, totalAusentes: ausentes.length, ausentes };
        }).filter(e => e.totalAusentes > 0);

        const auditLogs = await prisma.auditLog.findMany({
            where: payload.role === 'ADMIN' ? {} : { userId: Number(payload.userId) },
            orderBy: { created_at: 'desc' },
            take: 500
        });

        const userIds = [...new Set(auditLogs.map(log => log.userId))];
        const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } });
        const userMap = new Map(users.map(u => [u.id, u]));

        const atividadeMap: Record<number, any> = {};
        auditLogs.forEach(log => {
            if (!atividadeMap[log.userId]) {
                const user = userMap.get(log.userId);
                atividadeMap[log.userId] = { userId: log.userId, nome: user?.name || 'Desconhecido', email: user?.email || '', checkins: 0, unchecks: 0, edicoes: 0, criacoes: 0, exclusoes: 0, importacoes: 0, total: 0 };
            }
            atividadeMap[log.userId].total++;
            switch (log.action) {
                case 'CHECKIN': atividadeMap[log.userId].checkins++; break;
                case 'UNCHECK': atividadeMap[log.userId].unchecks++; break;
                case 'EDIT_GUEST': case 'EDIT_EVENT': case 'EDIT_USER': atividadeMap[log.userId].edicoes++; break;
                case 'CREATE_GUEST': case 'CREATE_EVENT': case 'CREATE_USER': atividadeMap[log.userId].criacoes++; break;
                case 'DELETE_GUEST': case 'DELETE_EVENT': case 'DELETE_USER': atividadeMap[log.userId].exclusoes++; break;
                case 'IMPORT_GUESTS': atividadeMap[log.userId].importacoes++; break;
            }
        });

        const atividadeUsuarios = Object.values(atividadeMap).sort((a: any, b: any) => b.total - a.total);

        const acoesCriticas = ['DELETE_GUEST', 'DELETE_EVENT', 'DELETE_USER', 'UNCHECK', 'EDIT_USER'];
        const logsCriticos = auditLogs
            .filter(log => acoesCriticas.includes(log.action))
            .slice(0, 50)
            .map(log => {
                const user = userMap.get(log.userId);
                return { id: log.id, acao: log.action, tipo: log.entityType, usuario: user?.name || 'Desconhecido', justificativa: log.justification || null, data: log.created_at };
            });

        const resumoAcoes: Record<string, number> = {};
        auditLogs.forEach(log => { resumoAcoes[log.action] = (resumoAcoes[log.action] || 0) + 1; });

        const auditoria = {
            logsCriticos,
            resumoAcoes: Object.entries(resumoAcoes).map(([acao, quantidade]) => ({ acao, quantidade })).sort((a, b) => b.quantidade - a.quantidade),
            totalAcoes: auditLogs.length
        };

        return NextResponse.json({ comparativo, historicoMensal, noShows, atividadeUsuarios, auditoria });
    }

    // 3. GET /api/reports/event/[id]
    if (slug[0] === 'event' && slug.length === 2) {
        const eventId = Number(slug[1]);
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, name: true, date: true, status: true } });
        if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

        const guests = await prisma.guest.findMany({ where: { eventId }, select: { id: true, fullName: true, category: true, tableNumber: true, checkedInAt: true, isChild: true, isPaying: true } });

        const total = guests.length;
        const checkedIn = guests.filter(g => g.checkedInAt !== null);
        const notCheckedIn = guests.filter(g => g.checkedInAt === null);
        const presentes = checkedIn.length;
        const ausentes = notCheckedIn.length;
        const taxaComparecimento = total > 0 ? Math.round((presentes / total) * 100) : 0;

        const categorias: Record<string, { total: number; checkedIn: number }> = {};
        guests.forEach(g => {
            const cat = g.category || 'Outros';
            if (!categorias[cat]) categorias[cat] = { total: 0, checkedIn: 0 };
            categorias[cat].total++;
            if (g.checkedInAt) categorias[cat].checkedIn++;
        });

        const mesas: Record<string, { total: number; checkedIn: number }> = {};
        guests.forEach(g => {
            const mesa = g.tableNumber || 'Sem mesa';
            if (!mesas[mesa]) mesas[mesa] = { total: 0, checkedIn: 0 };
            mesas[mesa].total++;
            if (g.checkedInAt) mesas[mesa].checkedIn++;
        });

        const checkInsPorHora: Record<string, number> = {};
        checkedIn.forEach(g => {
            if (g.checkedInAt) {
                const hora = new Date(g.checkedInAt).getHours();
                const horaFormatada = `${hora.toString().padStart(2, '0')}:00`;
                checkInsPorHora[horaFormatada] = (checkInsPorHora[horaFormatada] || 0) + 1;
            }
        });

        const horariosOrdenados = Object.entries(checkInsPorHora)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([hora, quantidade]) => ({ hora, quantidade }));

        const criancas = guests.filter(g => g.isChild).length;
        const pagantes = guests.filter(g => g.isPaying && g.checkedInAt).length;

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
            evento: event,
            resumo: { total, presentes, ausentes, taxaComparecimento, criancas, pagantes },
            distribuicao: {
                categorias: Object.entries(categorias).map(([nome, dados]) => ({ nome, ...dados, taxa: dados.total > 0 ? Math.round((dados.checkedIn / dados.total) * 100) : 0 })),
                mesas: Object.entries(mesas).map(([nome, dados]) => ({ nome, ...dados, taxa: dados.total > 0 ? Math.round((dados.checkedIn / dados.total) * 100) : 0 }))
            },
            checkInsPorHora: horariosOrdenados,
            listaConvidados
        });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
