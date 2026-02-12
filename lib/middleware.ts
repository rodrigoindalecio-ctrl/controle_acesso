import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export const withAuth = async (
  req: NextRequest,
  handler: (req: NextRequest, payload: JWTPayload) => Promise<NextResponse>
) => {
  const token = req.cookies.get('auth-token')?.value;

  if (!token) {
    return NextResponse.json(
      { error: 'Não autorizado. Token ausente.' },
      { status: 401 }
    );
  }

  const payload = verifyToken(token);

  if (!payload) {
    return NextResponse.json(
      { error: 'Token inválido ou expirado.' },
      { status: 401 }
    );
  }

  return handler(req, payload);
};

export const withRole = (allowedRoles: string[]) => {
  return async (
    req: NextRequest,
    handler: (req: NextRequest, payload: JWTPayload) => Promise<NextResponse>
  ) => {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Não autorizado. Token ausente.' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);

    if (!payload || !allowedRoles.includes(payload.role)) {
      return NextResponse.json(
        { error: 'Acesso negado. Papel de usuário insuficiente.' },
        { status: 403 }
      );
    }

    return handler(req, payload);
  };
};
