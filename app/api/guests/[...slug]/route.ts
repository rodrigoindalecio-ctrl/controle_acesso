export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { parseCSV, readFileAsString, isValidCSVFile, isFileSizeValid, filterBlankRows, isXLSXFile, parseXLSX } from '@/lib/import-parser';
import { validateImportData, generateErrorCSV } from '@/lib/import-validation';
import { correctGuestSchema } from '@/lib/validation-schemas';
import { validateCorrectionRateLimit } from '@/lib/rate-limit';

// --- SCHEMAS ---
const GuestItemSchema = z.object({
    full_name: z.string().min(2).max(255),
    category: z.string().max(50).optional(),
    phone: z.string().max(20).optional(),
    notes: z.string().max(1000).optional(),
    table_number: z.string().max(20).optional()
}).passthrough();

const ConfirmBodySchema = z.object({
    eventId: z.string().trim().min(1).max(64),
    guests: z.array(GuestItemSchema).min(1).max(5000),
    duplicateStrategy: z.enum(['ignore', 'update', 'mark']),
    idempotencyKey: z.string().max(255).optional()
});

// --- HELPERS ---
function getClientMeta(req: NextRequest) {
    return {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown',
        userAgent: req.headers.get('user-agent') || 'unknown'
    };
}

// --- HANDLERS ---

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    // GET /api/guests/export?eventId=...
    if (slug[0] === 'export') {
        const eventId = new URL(req.url).searchParams.get('eventId');
        if (!eventId) return NextResponse.json({ message: 'eventId é obrigatório' }, { status: 400 });

        const event = await prisma.event.findUnique({ where: { id: Number(eventId) }, select: { id: true, name: true } });
        if (!event) return NextResponse.json({ message: 'Evento não encontrado' }, { status: 404 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: Number(eventId) } } });
            if (!ue) return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
        }

        const guests = await prisma.guest.findMany({ where: { eventId: Number(eventId) }, orderBy: { fullName: 'asc' } });
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Convidados');
        ws.columns = [
            { header: 'Qtd', key: 'qtd', width: 6 },
            { header: 'Nome Completo', key: 'fullName', width: 35 },
            { header: 'Categoria', key: 'category', width: 18 },
            { header: 'Mesa', key: 'tableNumber', width: 10 },
            { header: 'Status', key: 'status', width: 14 }
        ];
        guests.forEach((g, i) => ws.addRow({ qtd: i + 1, fullName: g.fullName, category: g.category, tableNumber: g.tableNumber, status: g.checkedInAt ? 'check-in' : 'faltante' }));

        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(Buffer.from(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': `attachment; filename="convidados_${event.name}.xlsx"`
            }
        });
    }

    // GET /api/guests/import/template
    if (slug[0] === 'import' && slug[1] === 'template') {
        const workbook = new ExcelJS.Workbook();
        const ws = workbook.addWorksheet('Convidados');
        ws.columns = [
            { header: 'Nome Completo', key: 'fullName', width: 35 },
            { header: 'Categoria', key: 'category', width: 20 },
            { header: 'Mesa', key: 'tableNumber', width: 12 }
        ];
        ws.addRow({ fullName: 'Exemplo', category: 'VIP', tableNumber: '1' });
        const buffer = await workbook.xlsx.writeBuffer();
        return new NextResponse(Buffer.from(buffer), {
            headers: {
                'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition': 'attachment; filename="template_convidados.xlsx"'
            }
        });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });

    // POST /api/guests/import/validate
    if (slug[0] === 'import' && slug[1] === 'validate') {
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const eventId = formData.get('eventId') as string;

        if (!file || !eventId) return NextResponse.json({ message: 'Arquivo e eventId são obrigatórios' }, { status: 400 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: Number(eventId) } } });
            if (!ue) return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
        }

        let csvData: any[];
        if (isXLSXFile(file)) csvData = await parseXLSX(file);
        else csvData = parseCSV(await readFileAsString(file));

        csvData = filterBlankRows(csvData);
        const existing = await prisma.guest.findMany({ where: { eventId: Number(eventId) }, select: { fullName: true } });
        const existingNames = new Set(existing.map(g => g.fullName.toLowerCase()));
        const validation = validateImportData(csvData, existingNames);

        return NextResponse.json({
            summary: { total: csvData.length, valid: validation.valid.length, invalid: validation.invalid.length, duplicates: validation.duplicates.length },
            data: { valid: validation.valid, invalid: validation.invalid, duplicates: validation.duplicates }
        });
    }

    // POST /api/guests/import/confirm
    if (slug[0] === 'import' && slug[1] === 'confirm') {
        const body = await req.json();
        const parsed = ConfirmBodySchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

        const { eventId, guests, duplicateStrategy } = parsed.data;

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: Number(eventId) } } });
            if (!ue) return NextResponse.json({ message: 'Acesso negado' }, { status: 403 });
        }

        const results = await prisma.$transaction(async (tx) => {
            const list = [];
            for (const g of guests) {
                const existing = await tx.guest.findFirst({ where: { eventId: Number(eventId), fullName: { equals: g.full_name } } });
                if (existing && duplicateStrategy === 'ignore') continue;
                if (existing && duplicateStrategy === 'update') {
                    await tx.guest.update({ where: { id: existing.id }, data: { category: g.category, phone: g.phone, notes: g.notes, tableNumber: g.table_number } });
                    list.push({ name: g.full_name, action: 'updated' });
                } else {
                    await tx.guest.create({ data: { fullName: g.full_name, category: g.category || 'Convidado', phone: g.phone, notes: g.notes, tableNumber: g.table_number, eventId: Number(eventId) } });
                    list.push({ name: g.full_name, action: 'created' });
                }
            }
            return list;
        });

        const meta = getClientMeta(req);
        await createAuditLog({ userId: auth.userId, role: auth.role, action: 'IMPORT_GUESTS', entityType: 'Event', entityId: String(eventId), justification: `Importação de ${results.length} convidados`, ip: meta.ip, userAgent: meta.userAgent });

        return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // PUT /api/guests/[id]
    if (slug.length === 1) {
        const id = slug[0];
        const { fullName, category, tableNumber, isPaying, isChild, childAge } = await req.json();
        const guest = await prisma.guest.findUnique({ where: { id } });
        if (!guest) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: guest.eventId } } });
            if (!ue) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const updated = await prisma.guest.update({
            where: { id },
            data: { fullName, category, tableNumber, isPaying, isChild, childAge }
        });
        return NextResponse.json({ success: true, guest: updated });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function PATCH(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // PATCH /api/guests/[id]/attendance
    if (slug.length === 2 && slug[1] === 'attendance') {
        const id = slug[0];
        const { present, isPaying = true } = await req.json();
        const guest = await prisma.guest.findUnique({ where: { id } });
        if (!guest) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: guest.eventId } } });
            if (!ue) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        await prisma.$transaction([
            prisma.guest.update({ where: { id }, data: { checkedInAt: present ? new Date() : null, isPaying: present ? isPaying : true } }),
            prisma.event.update({ where: { id: guest.eventId }, data: { updated_at: new Date(), lastChangeType: present ? 'CHECKIN' : 'UNDO' } })
        ]);
        return NextResponse.json({ success: true });
    }

    // PATCH /api/guests/[id]/correction
    if (slug.length === 2 && slug[1] === 'correction') {
        const id = slug[0];
        const guest = await prisma.guest.findUnique({ where: { id } });
        if (!guest) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: guest.eventId } } });
            if (!ue) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        const rateLimit = await validateCorrectionRateLimit(auth.userId, id);
        if (!rateLimit.allowed) return NextResponse.json({ error: 'Limite atingido' }, { status: 429 });

        const body = await req.json();
        const parsed = correctGuestSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

        const updated = await prisma.guest.update({ where: { id }, data: { fullName: parsed.data.fullName, phone: parsed.data.phone, category: parsed.data.category, notes: parsed.data.notes } });

        const meta = getClientMeta(req);
        await createAuditLog({ userId: auth.userId, role: auth.role, action: 'CORRECT_GUEST', entityType: 'Guest', entityId: id, before: guest, after: updated, justification: parsed.data.justification, ip: meta.ip, userAgent: meta.userAgent });

        return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const auth = await verifyAuth(req);
    if (!auth) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });

    // DELETE /api/guests/[id]
    if (slug.length === 1) {
        const id = slug[0];
        const guest = await prisma.guest.findUnique({ where: { id } });
        if (!guest) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });

        if (auth.role !== 'ADMIN') {
            const ue = await prisma.userEvent.findUnique({ where: { userId_eventId: { userId: Number(auth.userId), eventId: guest.eventId } } });
            if (!ue) return NextResponse.json({ error: 'Acesso negado' }, { status: 403 });
        }

        await prisma.$transaction([
            prisma.guest.delete({ where: { id } }),
            prisma.event.update({ where: { id: guest.eventId }, data: { updated_at: new Date(), lastChangeType: 'DELETE' } })
        ]);
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
