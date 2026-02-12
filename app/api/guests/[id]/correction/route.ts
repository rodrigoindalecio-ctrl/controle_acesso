import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { correctGuestSchema } from '@/lib/validation-schemas';
import { validateCorrectionRateLimit } from '@/lib/rate-limit';
import { verifyAuth } from '@/lib/auth';

/**
 * PATCH /api/guests/[id]/correction
 * Permite que USER e ADMIN corrijam dados do convidado com auditoria
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Autenticação
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const userId = authResult.userId;
    const role = authResult.role;

    // 2. Autorização - USER e ADMIN podem corrigir
    const allowedRoles = ['USER', 'ADMIN'];
    if (!allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Você não tem permissão para fazer isso' },
        { status: 403 }
      );
    }

    // 3. Buscar convidado existente
    const guest = await prisma.guest.findUnique({
      where: { id: params.id },
    });

    if (!guest) {
      return NextResponse.json(
        { error: 'Convidado não encontrado' },
        { status: 404 }
      );
    }

    // 3.1 Autorização por evento: USER precisa estar vinculado ao evento do convidado
    if (role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId,
            eventId: guest.eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { error: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // 4. Validar rate limit
    const rateLimit = await validateCorrectionRateLimit(userId, params.id);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { 
          error: 'Limite de correções atingido',
          reasons: rateLimit.reasons,
        },
        { status: 429 }
      );
    }

    // 5. Parse e validação do corpo da requisição
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return NextResponse.json(
        { error: 'Corpo da requisição inválido' },
        { status: 400 }
      );
    }

    // Validar com Zod
    const validationResult = correctGuestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: 'Dados inválidos',
          details: validationResult.error.issues,
        },
        { status: 400 }
      );
    }

    const data = validationResult.data;

    // 6. Preparar dados antes/depois para auditoria
    const before = {
      fullName: guest.fullName,
      phone: guest.phone,
      category: guest.category,
      notes: guest.notes,
    };

    const after = {
      fullName: data.fullName !== undefined ? data.fullName : guest.fullName,
      phone: data.phone !== undefined ? data.phone : guest.phone,
      category: data.category !== undefined ? data.category : guest.category,
      notes: data.notes !== undefined ? data.notes : guest.notes,
    };

    // Verificar se algo foi realmente alterado
    const hasChanges = Object.keys(after).some(
      (key) => before[key as keyof typeof before] !== after[key as keyof typeof after]
    );

    if (!hasChanges) {
      return NextResponse.json(
        { error: 'Nenhuma alteração foi feita' },
        { status: 400 }
      );
    }

    // 7. Atualizar convidado
    const updatedGuest = await prisma.guest.update({
      where: { id: params.id },
      data: {
        ...(data.fullName !== undefined && { fullName: data.fullName }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    });

    // 8. Criar log de auditoria
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown';
    const userAgent = request.headers.get('user-agent') || '';

    await createAuditLog({
      userId,
      role,
      action: 'CORRECT_GUEST',
      entityType: 'Guest',
      entityId: params.id,
      before,
      after: {
        fullName: updatedGuest.fullName,
        phone: updatedGuest.phone,
        category: updatedGuest.category,
        notes: updatedGuest.notes,
      },
      justification: data.justification,
      ip,
      userAgent,
    });

    // 9. Retornar sucesso
    return NextResponse.json(
      {
        success: true,
        message: 'Convidado corrigido com sucesso',
        data: updatedGuest,
        audit: {
          correctedAt: new Date().toISOString(),
          correctedBy: userId,
          justification: data.justification,
        },
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao corrigir convidado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
