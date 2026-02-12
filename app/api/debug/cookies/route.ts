import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('[DEBUG] /api/debug/cookies called');
  console.log('[DEBUG] All request cookies:', Array.from(req.cookies.getAll()).map(c => ({ name: c.name, value: c.value.slice(0, 50) + '...' })));
  
  const authToken = req.cookies.get('auth-token');
  console.log('[DEBUG] auth-token present:', !!authToken);
  
  return NextResponse.json({
    cookies: Array.from(req.cookies.getAll()).map(c => ({ name: c.name, length: c.value.length })),
    authToken: authToken ? { name: 'auth-token', length: authToken.value.length } : null
  });
}
