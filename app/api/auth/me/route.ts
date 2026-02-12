import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    const payload = verifyToken(token);

    if (!payload) {
      return NextResponse.json(
        { user: null },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        user: {
          userId: payload.userId,
          email: payload.email,
          name: payload.name,
          role: payload.role
        }
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro ao buscar sessão:', error);
    return NextResponse.json(
      { user: null },
      { status: 200 }
    );
  }
}
