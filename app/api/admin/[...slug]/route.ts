import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

const createUserSchema = z.object({
    name: z.string().min(2).max(120),
    email: z.string().email().max(255),
    password: z.string().min(6).max(200),
    role: z.enum(['ADMIN', 'USER']).default('USER')
});

const updateUserSchema = z.object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().max(255).optional(),
    role: z.enum(['ADMIN', 'USER']).optional()
}).refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });

const changePasswordSchema = z.object({
    newPassword: z.string().min(6).max(200)
});

function getClientMeta(req: NextRequest) {
    return {
        ip: req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || undefined,
        userAgent: req.headers.get('user-agent') || undefined
    };
}

async function ensureAdmin(req: NextRequest) {
    const auth = await verifyAuth(req);
    if (!auth) return { ok: false as const, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
    if (auth.role !== 'ADMIN') return { ok: false as const, res: NextResponse.json({ error: 'Apenas administradores' }, { status: 403 }) };
    return { ok: true as const, auth };
}

async function isLastAdmin(userId: number) {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
        const isAdmin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
        return isAdmin?.role === 'ADMIN';
    }
    return false;
}

export async function GET(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    // GET /api/admin/users
    if (slug[0] === 'users' && slug.length === 1) {
        const { searchParams } = new URL(req.url);
        const q = (searchParams.get('q') || '').trim();
        const role = (searchParams.get('role') || '').trim();

        const users = await prisma.user.findMany({
            where: {
                ...(role === 'ADMIN' || role === 'USER' ? { role } : {}),
                ...(q ? { OR: [{ name: { contains: q } }, { email: { contains: q } }] } : {})
            },
            select: { id: true, name: true, email: true, role: true, created_at: true, updated_at: true },
            orderBy: [{ role: 'asc' }, { name: 'asc' }, { email: 'asc' }]
        });
        return NextResponse.json({ users });
    }

    // GET /api/admin/audit
    if (slug[0] === 'audit') {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action') || undefined;
        const entityType = searchParams.get('entityType') || undefined;
        const userId = searchParams.get('userId') || undefined;
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const limit = parseInt(searchParams.get('limit') || '100', 10);
        const offset = parseInt(searchParams.get('offset') || '0', 10);

        const where: any = {};
        if (action) where.action = action;
        if (entityType) where.entityType = entityType;
        if (userId) where.userId = { contains: userId };
        if (dateFrom || dateTo) {
            where.created_at = {};
            if (dateFrom) { const fromDate = new Date(dateFrom); fromDate.setHours(0, 0, 0, 0); where.created_at.gte = fromDate; }
            if (dateTo) { const toDate = new Date(dateTo); toDate.setHours(23, 59, 59, 999); where.created_at.lte = toDate; }
        }

        const [logs, total] = await Promise.all([
            (prisma as any).auditLog.findMany({ where, orderBy: { created_at: 'desc' }, take: limit, skip: offset }),
            (prisma as any).auditLog.count({ where })
        ]);

        return NextResponse.json({
            logs: (logs as any[]).map(log => ({
                ...log,
                before: typeof log.before === 'string' ? JSON.parse(log.before) : log.before,
                after: typeof log.after === 'string' ? JSON.parse(log.after) : log.after
            })),
            total, limit, offset, hasMore: offset + limit < total
        });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    // POST /api/admin/users
    if (slug[0] === 'users' && slug.length === 1) {
        const body = await req.json();
        const parsed = createUserSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });

        const { name, email, password, role } = parsed.data;
        if (await prisma.user.findUnique({ where: { email } })) return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 });

        const user = await prisma.user.create({
            data: { name, email, role, password_hash: await bcrypt.hash(password, 10) },
            select: { id: true, name: true, email: true, role: true, created_at: true, updated_at: true }
        });

        const meta = getClientMeta(req);
        await createAuditLog({
            userId: admin.auth.userId, role: admin.auth.role, action: 'CREATE_USER',
            entityType: 'User', entityId: String(user.id), before: null as any,
            after: { id: user.id, name: user.name, email: user.email, role: user.role },
            justification: 'Criação de usuário', ip: meta.ip, userAgent: meta.userAgent
        });
        return NextResponse.json({ user }, { status: 201 });
    }

    // POST /api/admin/users/[id]/password
    if (slug[0] === 'users' && slug.length === 3 && slug[2] === 'password') {
        const userId = Number(slug[1]);
        const body = await req.json();
        const parsed = changePasswordSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'Senha inválida' }, { status: 400 });

        const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true, name: true, role: true } });
        if (!target) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

        await prisma.user.update({ where: { id: userId }, data: { password_hash: await bcrypt.hash(parsed.data.newPassword, 10) } });

        const meta = getClientMeta(req);
        await createAuditLog({
            userId: admin.auth.userId, role: admin.auth.role, action: 'UPDATE_USER',
            entityType: 'User', entityId: String(target.id),
            before: target, after: { id: target.id },
            justification: 'Alteração de senha via admin', ip: meta.ip, userAgent: meta.userAgent
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function PUT(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    // PUT /api/admin/users/[id]
    if (slug[0] === 'users' && slug.length === 2) {
        const userId = Number(slug[1]);
        const beforeUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
        if (!beforeUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

        const body = await req.json();
        const parsed = updateUserSchema.safeParse(body);
        if (!parsed.success) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 });

        if (parsed.data.role && parsed.data.role !== beforeUser.role && beforeUser.role === 'ADMIN') {
            if (await isLastAdmin(beforeUser.id)) return NextResponse.json({ error: 'Não é possível remover o último ADMIN' }, { status: 400 });
        }

        if (parsed.data.email && parsed.data.email !== beforeUser.email) {
            if (await prisma.user.findUnique({ where: { email: parsed.data.email } })) return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 });
        }

        const user = await prisma.user.update({
            where: { id: userId },
            data: parsed.data,
            select: { id: true, name: true, email: true, role: true, created_at: true, updated_at: true }
        });

        const meta = getClientMeta(req);
        await createAuditLog({
            userId: admin.auth.userId, role: admin.auth.role, action: 'UPDATE_USER',
            entityType: 'User', entityId: String(user.id), before: beforeUser, after: user,
            justification: 'Edição de usuário', ip: meta.ip, userAgent: meta.userAgent
        });
        return NextResponse.json({ user });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function DELETE(req: NextRequest, { params }: { params: { slug: string[] } }) {
    const slug = params.slug;
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    // DELETE /api/admin/users/[id]
    if (slug[0] === 'users' && slug.length === 2) {
        const userId = Number(slug[1]);
        if (String(userId) === admin.auth.userId) return NextResponse.json({ error: 'Não pode excluir a si mesmo' }, { status: 400 });

        const beforeUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
        if (!beforeUser) return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });

        if (beforeUser.role === 'ADMIN' && await isLastAdmin(beforeUser.id)) return NextResponse.json({ error: 'Não pode excluir o último ADMIN' }, { status: 400 });

        await prisma.user.delete({ where: { id: userId } });

        const meta = getClientMeta(req);
        await createAuditLog({
            userId: admin.auth.userId, role: admin.auth.role, action: 'DELETE_USER',
            entityType: 'User', entityId: String(beforeUser.id), before: beforeUser, after: null as any,
            justification: 'Exclusão de usuário', ip: meta.ip, userAgent: meta.userAgent
        });
        return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}
