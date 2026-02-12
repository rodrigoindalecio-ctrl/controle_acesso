import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const updateUserSchema = z
  .object({
    name: z.string().min(2).max(120).optional(),
    email: z.string().email().max(255).optional(),
    role: z.enum(['ADMIN', 'USER']).optional()
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nada para atualizar' });

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

async function isLastAdmin(userId: string) {
  const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  if (adminCount <= 1) {
    const isAdmin = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    return isAdmin?.role === 'ADMIN';
  }
  return false;
}

/**
 * PUT /api/admin/users/[id]
 * Atualiza nome/email/role (ADMIN)
 */
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const userId = params.id;

    const beforeUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!beforeUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const nextRole = parsed.data.role;
    if (nextRole && nextRole !== beforeUser.role) {
      if (beforeUser.role === 'ADMIN' && nextRole === 'USER') {
        const last = await isLastAdmin(beforeUser.id);
        if (last) {
          return NextResponse.json({ error: 'Não é possível remover o último ADMIN do sistema' }, { status: 400 });
        }
      }
    }

    if (parsed.data.email && parsed.data.email !== beforeUser.email) {
      const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
      if (existing) {
        return NextResponse.json({ error: 'Email já está em uso' }, { status: 409 });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(parsed.data.name ? { name: parsed.data.name } : {}),
        ...(parsed.data.email ? { email: parsed.data.email } : {}),
        ...(parsed.data.role ? { role: parsed.data.role } : {})
      },
      select: { id: true, name: true, email: true, role: true, created_at: true, updated_at: true }
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: admin.auth.userId,
      role: admin.auth.role,
      action: 'UPDATE_USER',
      entityType: 'User',
      entityId: user.id,
      before: beforeUser,
      after: { id: user.id, name: user.name, email: user.email, role: user.role },
      justification: 'Edição de usuário',
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return NextResponse.json({ user });
  } catch (error) {
    console.error('Erro ao atualizar usuário (admin):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Exclui usuário (ADMIN)
 */
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const userId = params.id;

    if (userId === admin.auth.userId) {
      return NextResponse.json({ error: 'Você não pode excluir seu próprio usuário' }, { status: 400 });
    }

    const beforeUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!beforeUser) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    if (beforeUser.role === 'ADMIN') {
      const last = await isLastAdmin(beforeUser.id);
      if (last) {
        return NextResponse.json({ error: 'Não é possível excluir o último ADMIN do sistema' }, { status: 400 });
      }
    }

    await prisma.user.delete({ where: { id: userId } });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: admin.auth.userId,
      role: admin.auth.role,
      action: 'DELETE_USER',
      entityType: 'User',
      entityId: beforeUser.id,
      before: beforeUser,
      after: null as any,
      justification: 'Exclusão de usuário',
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao excluir usuário (admin):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
