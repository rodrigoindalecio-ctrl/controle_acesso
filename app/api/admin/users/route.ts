import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const bcrypt = require('bcryptjs');

const createUserSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(255),
  password: z.string().min(6).max(200),
  role: z.enum(['ADMIN', 'USER']).default('USER')
});

function getClientMeta(req: NextRequest) {
  return {
    ip:
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      undefined,
    userAgent: req.headers.get('user-agent') || undefined
  };
}

async function ensureAdmin(req: NextRequest) {
  const auth = await verifyAuth(req);
  if (!auth) {
    return { ok: false as const, res: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) };
  }
  if (auth.role !== 'ADMIN') {
    return { ok: false as const, res: NextResponse.json({ error: 'Apenas administradores' }, { status: 403 }) };
  }
  return { ok: true as const, auth };
}

/**
 * GET /api/admin/users
 * Lista usuários do sistema (ADMIN)
 */
export async function GET(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim();
    const role = (searchParams.get('role') || '').trim();

    const users = await prisma.user.findMany({
      where: {
        ...(role === 'ADMIN' || role === 'USER' ? { role } : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' as const } },
                { email: { contains: q, mode: 'insensitive' as const } }
              ]
            }
          : {})
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      },
      orderBy: [{ role: 'asc' }, { name: 'asc' }, { email: 'asc' }]
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error('Erro ao listar usuários (admin):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/admin/users
 * Cria um usuário (ADMIN)
 */
export async function POST(req: NextRequest) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const body = await req.json().catch(() => null);
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const { name, email, password, role } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 });
    }

    const password_hash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        role,
        password_hash
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        created_at: true,
        updated_at: true
      }
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: admin.auth.userId,
      role: admin.auth.role,
      action: 'CREATE_USER',
      entityType: 'User',
      entityId: user.id,
      before: null as any,
      after: { id: user.id, name: user.name, email: user.email, role: user.role },
      justification: 'Criação de usuário',
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar usuário (admin):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
