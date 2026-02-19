import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';
import { generateCheckInReport } from '@/lib/report/generateCheckInReport';
import { createAuditLog } from '@/lib/audit';

const checkInSchema = z.object({
    guestId: z.string().nonempty(),
    isPaying: z.boolean().optional().default(true),
});

const undoCheckInSchema = z.object({
    guestId: z.string().nonempty(),
    undoReason: z.string().min(5).max(255),
});

const normalizeEmail = (email: unknown) => {
    if (typeof email !== 'string') return '';
    return email.trim().toLowerCase();
};

export async function GET(req: NextRequest, { params }: { params: { slug?: string[] } }) {
    const slug = params.slug || [];
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // 1. GET /api/events
    if (slug.length === 0) {
        const events = await prisma.event.findMany({
            where: payload.role === 'ADMIN' ? {} : { users: { some: { userId: Number(payload.userId) } } },
            orderBy: { date: 'asc' }
        });
        return NextResponse.json({ events: events.map((e: any) => ({ ...e, date: e.date.toISOString() })) });
    }

    const eventId = Number(slug[0]);
    if (isNaN(eventId)) return NextResponse.json({ error: 'Invalid ID' }, { status: 400 });

    // 2. GET /api/events/[id]
    if (slug.length === 1) {
        const event = await prisma.event.findUnique({ where: { id: eventId }, include: { users: true } });
        if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
        if (payload.role !== 'ADMIN' && !event.users.some(ue => ue.userId === Number(payload.userId))) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        return NextResponse.json({ event: { ...event, date: event.date.toISOString() } });
    }

    // 3. GET /api/events/[id]/collaborators
    if (slug.length === 2 && slug[1] === 'collaborators') {
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        const assignments = await prisma.userEvent.findMany({ where: { eventId }, include: { user: { select: { id: true, email: true, name: true, role: true } } } });
        return NextResponse.json({ collaborators: assignments.map(a => ({ ...a.user, id: String(a.user.id) })) });
    }

    // 4. GET /api/events/[id]/guests
    if (slug.length === 2 && slug[1] === 'guests') {
        const guests = await prisma.guest.findMany({ where: { eventId }, orderBy: { fullName: 'asc' } });
        const stats = { total: guests.length, checkedIn: guests.filter(g => g.checkedInAt).length };
        return NextResponse.json({ guests, stats });
    }

    // 5. GET /api/events/[id]/checkin-report
    if (slug.length === 2 && slug[1] === 'checkin-report') {
        const guests = await prisma.guest.findMany({ where: { eventId }, orderBy: { fullName: 'asc' } });
        const report = generateCheckInReport(guests.map(g => ({ ...g, category: g.category ?? undefined, tableNumber: g.tableNumber ?? undefined, checkedInAt: g.checkedInAt?.toISOString() })));
        return NextResponse.json(report);
    }

    // 6. GET /api/events/[id]/sync
    if (slug.length === 2 && slug[1] === 'sync') {
        const event = await prisma.event.findUnique({ where: { id: eventId }, select: { updated_at: true, lastChangeType: true } });
        if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 });
        return NextResponse.json({ updatedAt: event.updated_at, lastChangeType: event.lastChangeType || null });
    }

    // 7. GET /api/events/[id]/guests/[guestId]/history
    if (slug.length === 4 && slug[1] === 'guests' && slug[3] === 'history') {
        const guestId = slug[2];
        const logs = await prisma.auditLog.findMany({
            where: { entityType: 'Guest', entityId: guestId },
            orderBy: { created_at: 'asc' }
        });
        return NextResponse.json({
            history: logs.map(l => ({
                type: l.action.toLowerCase() === 'checkin' || l.action === 'CHECKIN' ? 'checkin' : 'undo',
                timestamp: l.created_at.toISOString(),
                userId: l.userId,
                reason: l.justification
            }))
        });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: { slug?: string[] } }) {
    const slug = params.slug || [];
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 });

    // 1. POST /api/events
    if (slug.length === 0) {
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas ADMIN' }, { status: 403 });
        const { name, date, description, status } = await req.json();
        const event = await prisma.event.create({ data: { name, date: new Date(date), description, status } });
        await prisma.userEvent.create({ data: { userId: Number(payload.userId), eventId: event.id } });
        return NextResponse.json({ success: true, event }, { status: 201 });
    }

    const eventId = Number(slug[0]);

    // 2. POST /api/events/[id]/collaborators
    if (slug.length === 2 && slug[1] === 'collaborators') {
        if (payload.role !== 'ADMIN') return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        const { email } = await req.json();
        const user = await prisma.user.findFirst({ where: { email: normalizeEmail(email) } });
        if (!user) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
        await prisma.userEvent.create({ data: { userId: Number(user.id), eventId } });
        return NextResponse.json({ success: true }, { status: 201 });
    }

    // 3. POST /api/events/[id]/check-in
    if (slug.length === 2 && slug[1] === 'check-in') {
        const { guestId, isPaying } = checkInSchema.parse(await req.json());
        await prisma.$transaction([
            prisma.guest.update({ where: { id: guestId }, data: { checkedInAt: new Date(), checkedInBy: payload.userId, isPaying } }),
            prisma.event.update({ where: { id: eventId }, data: { updated_at: new Date(), lastChangeType: 'CHECKIN' } })
        ]);
        return NextResponse.json({ success: true });
    }

    // 4. POST /api/events/[id]/check-in/undo
    if (slug.length === 3 && slug[1] === 'check-in' && slug[2] === 'undo') {
        const { guestId, undoReason } = undoCheckInSchema.parse(await req.json());
        await prisma.$transaction([
            prisma.guest.update({ where: { id: guestId }, data: { checkedInAt: null, undoAt: new Date(), undoBy: payload.userId, undoReason } as any }),
            prisma.event.update({ where: { id: eventId }, data: { updated_at: new Date(), lastChangeType: 'UNCHECK' } })
        ]);
        await createAuditLog({ userId: payload.userId, role: payload.role, action: 'UNCHECK', entityType: 'Guest', entityId: guestId, before: {}, after: {}, justification: undoReason, ip: 'unknown', userAgent: 'unknown' });
        return NextResponse.json({ success: true });
    }

    // 5. POST /api/events/[id]/guests/manual
    if (slug.length === 3 && slug[1] === 'guests' && slug[2] === 'manual') {
        const { fullName, category } = await req.json();
        const guest = await prisma.guest.create({ data: { fullName: fullName.trim(), category, eventId, isManual: true, checkedInAt: new Date() } });
        await prisma.event.update({ where: { id: eventId }, data: { updated_at: new Date(), lastChangeType: 'CREATE' } });
        return NextResponse.json({ success: true, guest }, { status: 201 });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: { slug?: string[] } }) {
    const slug = params.slug || [];
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas ADMIN' }, { status: 403 });

    if (slug.length === 1) {
        const eventId = Number(slug[0]);
        const body = await req.json();
        const updated = await prisma.event.update({ where: { id: eventId }, data: { ...body, date: body.date ? new Date(body.date) : undefined } });
        return NextResponse.json({ success: true, event: updated });
    }
    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug?: string[] } }) {
    const slug = params.slug || [];
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
    const payload = verifyToken(token);
    if (!payload || payload.role !== 'ADMIN') return NextResponse.json({ error: 'Apenas ADMIN' }, { status: 403 });

    const eventId = Number(slug[0]);

    if (slug.length === 1) {
        await prisma.userEvent.deleteMany({ where: { eventId } });
        await prisma.event.delete({ where: { id: eventId } });
        return NextResponse.json({ success: true }, { status: 204 });
    }

    if (slug.length === 2 && slug[1] === 'collaborators') {
        const { userId } = await req.json();
        await prisma.userEvent.delete({ where: { userId_eventId: { userId: Number(userId), eventId } } });
        return NextResponse.json({ success: true });
    }

    if (slug.length === 2 && slug[1] === 'guests') {
        await prisma.guest.deleteMany({ where: { eventId } });
        await prisma.event.update({ where: { id: eventId }, data: { updated_at: new Date(), lastChangeType: 'DELETE' } });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
