import { NextRequest, NextResponse } from 'next/server';

// Define quais rotas precisam de autenticação
const protectedRoutes = ['/dashboard', '/events'];

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Verifica se a rota atual precisa de autenticação
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  if (isProtectedRoute) {
    // Obtém o token do cookie (sem validar aqui, pois Edge Runtime não suporta crypto)
    const token = request.cookies.get('auth-token')?.value;

    // Se não houver token, redireciona para a página de login (raiz)
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Token existe, permite acesso. Validação real será feita no layout/page server component
  }

  return NextResponse.next();
}

// Configuração de quais rotas o middleware deve processar
export const config = {
  matcher: ['/dashboard/:path*', '/events/:path*']
};
