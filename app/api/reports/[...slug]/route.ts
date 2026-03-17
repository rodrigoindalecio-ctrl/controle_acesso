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
        const isAdmin = payload.role === 'ADMIN';
        const userId = Number(payload.userId);

        // Filter events by user access
        const eventFilter = isAdmin ? {} : { users: { some: { userId } } };

        // 1. Get Event Summary (Stats only, no large data fetch)
        const events = await prisma.event.findMany({
            where: eventFilter,
            select: {
                id: true,
                name: true,
                date: true,
                status: true,
                _count: {
                    select: {
                        guests: true
                    }
                }
            },
            orderBy: { date: 'desc' }
        });

        // 2. Get Presence counts in bulk
        const presenceStats = await prisma.guest.groupBy({
            by: ['eventId'],
            where: {
                eventId: { in: events.map(e => e.id) },
                checkedInAt: { not: null }
            },
            _count: true
        });

        const presenceMap = new Map(presenceStats.map(s => [s.eventId, s._count]));

        const comparativo = events.map(event => {
            const total = event._count.guests;
            const presentes = presenceMap.get(event.id) || 0;
            const ausentes = total - presentes;
            const taxa = total > 0 ? Math.round((presentes / total) * 100) : 0;
            return { id: event.id, nome: event.name, data: event.date, status: event.status, total, presentes, ausentes, taxa };
        }).sort((a, b) => b.taxa - a.taxa);

        // 3. Get Monthly History (Aggregate directly in DB if possible, or grouped here)
        const historicoMap: Record<string, { eventos: number; convidados: number; presentes: number }> = {};
        events.forEach(event => {
            const date = new Date(event.date);
            const mesAno = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!historicoMap[mesAno]) historicoMap[mesAno] = { eventos: 0, convidados: 0, presentes: 0 };
            historicoMap[mesAno].eventos++;
            historicoMap[mesAno].convidados += event._count.guests;
            historicoMap[mesAno].presentes += presenceMap.get(event.id) || 0;
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
            }).sort((a, b) => a.mesAno.localeCompare(b.mesAno));

        // 4. Get No-Shows (This part still needs detail, so we fetch only ABSENT guests)
        // We limit this to the most recent 5 events to avoid massive payloads
        const recentEvents = events.slice(0, 5);
        const noShowsRaw = await prisma.guest.findMany({
            where: {
                eventId: { in: recentEvents.map(e => e.id) },
                checkedInAt: null
            },
            select: { id: true, fullName: true, category: true, eventId: true }
        });

        const noShows = recentEvents.map(event => {
            const ausentes = noShowsRaw
                .filter(g => g.eventId === event.id)
                .map(g => ({ id: g.id, nome: g.fullName, categoria: g.category || 'Outros' }));
            
            return { 
                eventoId: event.id, 
                eventoNome: event.name, 
                eventoData: event.date, 
                totalConvidados: event._count.guests, 
                totalAusentes: ausentes.length, 
                ausentes 
            };
        }).filter(e => e.totalAusentes > 0);

        // 5. Audit Log Stats (Better pagination/limit)
        const auditLogs = await prisma.auditLog.findMany({
            where: isAdmin ? {} : { userId: String(payload.userId) },
            orderBy: { created_at: 'desc' },
            take: 200 // Reduced from 500 for dashboard
        });

        // Map users for logs
        const userIds = [...new Set(auditLogs.map(log => Number(log.userId)))];
        const users = await prisma.user.findMany({ 
            where: { id: { in: userIds } }, 
            select: { id: true, name: true, email: true } 
        });
        const userMap = new Map(users.map(u => [u.id, u]));

        const atividadeMap: Record<string, any> = {};
        auditLogs.forEach(log => {
            if (!atividadeMap[log.userId]) {
                const user = userMap.get(Number(log.userId));
                atividadeMap[log.userId] = { 
                    userId: log.userId, 
                    nome: user?.name || 'Desconhecido', 
                    email: user?.email || '', 
                    checkins: 0, unchecks: 0, edicoes: 0, criacoes: 0, exclusoes: 0, importacoes: 0, total: 0 
                };
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

        const acoesCriticas = ['DELETE_GUEST', 'DELETE_EVENT', 'DELETE_USER', 'UNCHECK', 'EDIT_USER', 'IMPORT_GUESTS'];
        const logsCriticos = auditLogs
            .filter(log => acoesCriticas.includes(log.action))
            .slice(0, 30) // Only top 30 critical logs
            .map(log => {
                const user = userMap.get(Number(log.userId));
                return { 
                    id: log.id, 
                    acao: log.action, 
                    tipo: log.entityType, 
                    usuario: user?.name || 'Desconhecido', 
                    justificativa: log.justification || null, 
                    data: log.created_at 
                };
            });

        const resumoAcoes: Record<string, number> = {};
        auditLogs.forEach(log => { resumoAcoes[log.action] = (resumoAcoes[log.action] || 0) + 1; });

        const auditoria = {
            logsCriticos,
            resumoAcoes: Object.entries(resumoAcoes)
                .map(([acao, quantidade]) => ({ acao, quantidade }))
                .sort((a, b) => b.quantidade - a.quantidade),
            totalAcoes: auditLogs.length
        };

        return NextResponse.json({ comparativo, historicoMensal, noShows, atividadeUsuarios, auditoria });
    }

    // 3. GET /api/reports/event/[id]
    if (slug[0] === 'event' && slug.length === 2) {
        const eventId = Number(slug[1]);
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, name: true, date: true, status: true, users: { select: { userId: true } } }
        });
        if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });

        // Access check
        if (payload.role !== 'ADMIN') {
            const hasAccess = event.users.some(u => u.userId === Number(payload.userId));
            if (!hasAccess) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const guests = await prisma.guest.findMany({ where: { eventId }, select: { id: true, fullName: true, category: true, tableNumber: true, checkedInAt: true, isChild: true, isPaying: true, isStaff: true } });

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
        const staff = guests.filter(g => g.isStaff && g.checkedInAt).length;
        const pagantes = guests.filter(g => g.isPaying && !g.isStaff && g.checkedInAt).length;

        const listaConvidados = guests
            .map(g => ({
                id: g.id,
                nome: g.fullName,
                categoria: g.category || 'Outros',
                mesa: g.tableNumber || '-',
                presente: g.checkedInAt !== null,
                crianca: g.isChild,
                isStaff: g.isStaff
            }))
            .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        return NextResponse.json({
            evento: event,
            resumo: { total, presentes, ausentes, taxaComparecimento, criancas, pagantes, staff },
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
