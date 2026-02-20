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

        const comparativo = events.map(e => ({ id: e.id, nome: e.name, data: e.date, status: e.status, total: e.guests.length, presentes: e.guests.filter(g => g.checkedInAt).length }));
        return NextResponse.json({ comparativo });
    }

    // 3. GET /api/reports/event/[id]
    if (slug[0] === 'event' && slug.length === 2) {
        const eventId = Number(slug[1]);
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true, name: true, date: true, status: true } });
        if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
        const guests = await prisma.guest.findMany({ where: { eventId }, select: { id: true, fullName: true, category: true, tableNumber: true, checkedInAt: true, isChild: true, isPaying: true } });
        return NextResponse.json({ evento: event, resumo: { total: guests.length, presentes: guests.filter(g => g.checkedInAt).length } });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
