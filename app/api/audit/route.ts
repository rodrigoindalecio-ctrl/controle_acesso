import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';

// Type para AuditLog até o Prisma client ser gerado corretamente
interface AuditLog {
  id: string;
  userId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string;
  before?: string;
  after?: string;
  justification?: string;
  ip?: string;
  userAgent?: string;
  created_at: Date;
}

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request);
    
    if (!authResult) {
      return NextResponse.json(
        { message: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se é admin
    if (authResult.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Acesso negado. Apenas administradores podem acessar logs de auditoria' },
        { status: 403 }
      );
    }

    // Extrair parâmetros de filtro
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || undefined;
    const entityType = searchParams.get('entityType') || undefined;
    const userId = searchParams.get('userId') || undefined;
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Construir filtros
    const where: any = {};

    if (action) {
      where.action = action;
    }

    if (entityType) {
      where.entityType = entityType;
    }

    if (userId) {
      where.userId = {
        contains: userId,
        mode: 'insensitive'
      };
    }

    if (dateFrom || dateTo) {
      where.created_at = {};
      
      if (dateFrom) {
        const fromDate = new Date(dateFrom);
        fromDate.setHours(0, 0, 0, 0);
        where.created_at.gte = fromDate;
      }
      
      if (dateTo) {
        const toDate = new Date(dateTo);
        toDate.setHours(23, 59, 59, 999);
        where.created_at.lte = toDate;
      }
    }

    const safeJsonParse = (value: unknown) => {
      if (typeof value !== 'string') return value;
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    };

    // Buscar logs - usando type casting para contornar erro de tipos do Prisma
    const logs = await (prisma as any).auditLog.findMany({
      where,
      orderBy: {
        created_at: 'desc'
      },
      take: limit,
      skip: offset
    });

    const parsedLogs = (logs as AuditLog[]).map((log) => ({
      ...log,
      before: log.before ? (safeJsonParse(log.before) as any) : undefined,
      after: log.after ? (safeJsonParse(log.after) as any) : undefined,
    }));

    const total = await (prisma as any).auditLog.count({ where });

    return NextResponse.json({
      logs: parsedLogs,
      total,
      limit,
      offset,
      hasMore: offset + limit < total
    });

  } catch (error) {
    console.error('Erro ao buscar logs de auditoria:', error);
    return NextResponse.json(
      { message: 'Erro ao buscar logs de auditoria' },
      { status: 500 }
    );
  }
}
