import { prisma } from './prisma';

interface RateLimitConfig {
  maxCorrectionsPerHour: number;
  maxCorrectionsPerGuestPerDay: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxCorrectionsPerHour: 30,        // 30 correções por hora
  maxCorrectionsPerGuestPerDay: 5,  // 5 correções por dia no mesmo convidado
};

/**
 * Verifica se o usuário excedeu o limite de correções por hora
 */
export async function checkRateLimitPerHour(
  userId: string,
  config = DEFAULT_CONFIG
): Promise<{
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}> {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

  const correctionCount = await prisma.auditLog.count({
    where: {
      userId,
      action: 'CORRECT_GUEST',
      created_at: {
        gte: oneHourAgo,
      },
    },
  });

  const allowed = correctionCount < config.maxCorrectionsPerHour;
  const remaining = Math.max(0, config.maxCorrectionsPerHour - correctionCount);
  const resetTime = new Date(oneHourAgo.getTime() + 60 * 60 * 1000);

  return {
    allowed,
    remaining,
    resetTime,
  };
}

/**
 * Verifica se o usuário excedeu o limite de correções para um convidado específico
 */
export async function checkRateLimitPerGuest(
  userId: string,
  guestId: string,
  config = DEFAULT_CONFIG
): Promise<{
  allowed: boolean;
  correctionCount: number;
  maxAllowed: number;
  guestId: string;
}> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const correctionCount = await prisma.auditLog.count({
    where: {
      userId,
      action: 'CORRECT_GUEST',
      entityId: guestId,
      created_at: {
        gte: oneDayAgo,
      },
    },
  });

  const allowed = correctionCount < config.maxCorrectionsPerGuestPerDay;

  return {
    allowed,
    correctionCount,
    maxAllowed: config.maxCorrectionsPerGuestPerDay,
    guestId,
  };
}

/**
 * Realiza verificação completa de rate limit
 */
export async function validateCorrectionRateLimit(
  userId: string,
  guestId: string,
  config = DEFAULT_CONFIG
): Promise<{
  allowed: boolean;
  reasons: string[];
}> {
  const perHour = await checkRateLimitPerHour(userId, config);
  const perGuest = await checkRateLimitPerGuest(userId, guestId, config);

  const reasons: string[] = [];

  if (!perHour.allowed) {
    reasons.push(
      `Limite de ${config.maxCorrectionsPerHour} correções por hora excedido. Tente novamente em ${Math.ceil((perHour.resetTime.getTime() - Date.now()) / 60000)} minutos.`
    );
  }

  if (!perGuest.allowed) {
    reasons.push(
      `Este convidado já foi corrigido ${perGuest.correctionCount} vezes hoje (máximo: ${config.maxCorrectionsPerGuestPerDay}).`
    );
  }

  return {
    allowed: perHour.allowed && perGuest.allowed,
    reasons,
  };
}
