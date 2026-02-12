import { NextRequest } from 'next/server';
import { getTokenFromCookies, verifyToken, JWTPayload } from './auth';
import prisma from './prisma';

/**
 * Middleware para validar autenticação em API routes
 */
export async function authMiddleware(request: NextRequest): Promise<{
  success: boolean;
  userId: string | null;
  user: JWTPayload | null;
}> {
  try {
    // Extrair token do header Authorization
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return { success: false, userId: null, user: null };
    }

    const payload = verifyToken(token);
    if (!payload) {
      return { success: false, userId: null, user: null };
    }

    return { success: true, userId: payload.userId, user: payload };
  } catch (error) {
    return { success: false, userId: null, user: null };
  }
}

/**
 * Obtém o usuário autenticado do cookie JWT
 * Usado em componentes Server do Next.js 14
 */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  try {
    const token = await getTokenFromCookies();
    if (!token) return null;

    const payload = verifyToken(token);
    return payload || null;
  } catch (error) {
    return null;
  }
}

/**
 * Verifica se o usuário é administrador
 */
export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'ADMIN';
}

/**
 * Verifica se o usuário tem acesso a um evento específico
 * ADMIN: acesso a todos
 * USER: acesso apenas aos vinculados
 */
export async function hasEventAccess(eventId: string): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  // ADMIN tem acesso a todos os eventos
  if (user.role === 'ADMIN') return true;

  // USER precisa estar vinculado ao evento
  try {
    const userEvent = await prisma.userEvent.findUnique({
      where: {
        userId_eventId: {
          userId: user.userId,
          eventId: eventId
        }
      }
    });

    return !!userEvent;
  } catch (error) {
    console.error('Erro ao verificar acesso ao evento:', error);
    return false;
  }
}
