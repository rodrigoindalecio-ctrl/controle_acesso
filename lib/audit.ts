import { prisma } from './prisma';

export type AuditAction = 
  | 'CHECKIN' 
  | 'UNCHECK' 
  | 'EDIT_GUEST' 
  | 'CREATE_GUEST' 
  | 'DELETE_GUEST' 
  | 'IMPORT_GUESTS'
  | 'CORRECT_GUEST';

export type AuditEntityType = 'Guest' | 'Event' | 'User';

interface CreateAuditLogParams {
  userId: string;
  role: string;
  action: AuditAction;
  entityType: AuditEntityType;
  entityId: string;
  before?: Record<string, any>;
  after?: Record<string, any>;
  justification?: string;
  ip?: string;
  userAgent?: string;
}

/**
 * Cria um registro de auditoria
 * @param params Parâmetros do log de auditoria
 */
export async function createAuditLog(params: CreateAuditLogParams): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        role: params.role,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        before: params.before ? JSON.stringify(params.before) : null,
        after: params.after ? JSON.stringify(params.after) : null,
        justification: params.justification || null,
        ip: params.ip || null,
        userAgent: params.userAgent || null,
      },
    });
  } catch (error) {
    // Log erro mas não falha a operação principal
    console.error('Erro ao criar auditLog:', error);
  }
}

/**
 * Busca logs de auditoria com filtros
 */
export async function getAuditLogs(filters: {
  userId?: string;
  action?: AuditAction;
  entityType?: AuditEntityType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}) {
  const {
    userId,
    action,
    entityType,
    startDate,
    endDate,
    limit = 50,
    offset = 0,
  } = filters;

  const logs = await prisma.auditLog.findMany({
    where: {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate || endDate) && {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
    },
    orderBy: { created_at: 'desc' },
    take: limit,
    skip: offset,
  });

  const total = await prisma.auditLog.count({
    where: {
      ...(userId && { userId }),
      ...(action && { action }),
      ...(entityType && { entityType }),
      ...(startDate || endDate) && {
        created_at: {
          ...(startDate && { gte: startDate }),
          ...(endDate && { lte: endDate }),
        },
      },
    },
  });

  return { logs, total };
}

/**
 * Busca histórico de alterações de um convidado
 */
export async function getGuestAuditHistory(guestId: string) {
  return await prisma.auditLog.findMany({
    where: {
      entityType: 'Guest',
      entityId: guestId,
    },
    orderBy: { created_at: 'desc' },
  });
}

/**
 * Verifica se há muitas correções seguidas (comportamento suspeito)
 */
export async function checkAnomalousCorrections(
  userId: string,
  eventId: string,
  timeWindowMinutes: number = 15
): Promise<{
  isAnomalous: boolean;
  correctionCount: number;
  threshold: number;
}> {
  const threshold = 10; // máximo 10 correções em 15 minutos
  
  const startTime = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

  const correctionCount = await prisma.auditLog.count({
    where: {
      userId,
      action: 'CORRECT_GUEST',
      created_at: {
        gte: startTime,
      },
    },
  });

  return {
    isAnomalous: correctionCount > threshold,
    correctionCount,
    threshold,
  };
}

/**
 * Busca todas as correções feitas em um convidado
 */
export async function getGuestCorrections(guestId: string) {
  return await prisma.auditLog.findMany({
    where: {
      entityType: 'Guest',
      entityId: guestId,
      action: 'CORRECT_GUEST',
    },
    orderBy: { created_at: 'desc' },
  });
}
