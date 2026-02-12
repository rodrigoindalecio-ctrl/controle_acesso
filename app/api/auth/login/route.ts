import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, setAuthCookie } from '@/lib/auth';

const bcrypt = require('bcryptjs');

export async function POST(req: NextRequest) {
  try {
    // Validar Content-Type
    const contentType = req.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    // Validar que o body não está vazio
    const bodyText = await req.text();
    if (!bodyText || bodyText.trim() === '') {
      return NextResponse.json(
        { error: 'Request body cannot be empty' },
        { status: 400 }
      );
    }

    // Parse JSON com tratamento de erro
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (parseError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { email, password } = body;

    // Validação básica
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    // Buscar usuário
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Verificar senha
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Email ou senha inválidos.' },
        { status: 401 }
      );
    }

    // Gerar token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as 'ADMIN' | 'USER'
    });

    // Criar resposta
    const response = NextResponse.json(
      {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      },
      { status: 200 }
    );

    // Setar cookie
    setAuthCookie(response, token);

    return response;
  } catch (error) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 }
    );
  }
}
