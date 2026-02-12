import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';

const bcrypt = require('bcryptjs');

const changePasswordSchema = z.object({
  newPassword: z.string().min(6).max(200)
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
 * POST /api/admin/users/[id]/password
 * Atualiza a senha de um usuário (ADMIN)
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const admin = await ensureAdmin(req);
    if (!admin.ok) return admin.res;

    const userId = params.id;
    const body = await req.json().catch(() => null);
    const parsed = changePasswordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Dados inválidos', details: parsed.error.flatten() }, { status: 400 });
    }

    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true }
    });
    if (!target) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }

    const password_hash = await bcrypt.hash(parsed.data.newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password_hash }
    });

    const meta = getClientMeta(req);
    await createAuditLog({
      userId: admin.auth.userId,
      role: admin.auth.role,
      action: 'EDIT_GUEST', // ou outro valor permitido por AuditAction
      entityType: 'User',
      entityId: target.id,
      before: { id: target.id, email: target.email, name: target.name, role: target.role },
      after: { id: target.id },
      justification: 'Alteração de senha via admin',
      ip: meta.ip,
      userAgent: meta.userAgent
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erro ao alterar senha (admin):', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
