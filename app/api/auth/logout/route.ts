import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: 'Logout realizado com sucesso.' },
    { status: 200 }
  );

  clearAuthCookie(response);

  return response;
}
