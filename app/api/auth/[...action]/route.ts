import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, setAuthCookie, clearAuthCookie, verifyToken } from '@/lib/auth';
import * as bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { action: string[] } }) {
    const action = params.action[0];

    if (action === 'me') {
        return handleMe(req);
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

export async function POST(req: NextRequest, { params }: { params: { action: string[] } }) {
    const action = params.action[0];

    if (action === 'login') {
        return handleLogin(req);
    }

    if (action === 'logout') {
        return handleLogout();
    }

    return NextResponse.json({ error: 'Not Found' }, { status: 404 });
}

async function handleLogin(req: NextRequest) {
    try {
        const body = await req.json().catch(() => ({}));
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email e senha são obrigatórios.' }, { status: 400 });
        }

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return NextResponse.json({ error: 'Email ou senha inválidos.' }, { status: 401 });
        }

        const token = generateToken({
            userId: String(user.id),
            email: user.email,
            name: user.name,
            role: user.role as 'ADMIN' | 'USER'
        });

        const response = NextResponse.json({
            success: true,
            user: { id: user.id, email: user.email, name: user.name, role: user.role }
        });

        setAuthCookie(response, token);
        return response;
    } catch (error) {
        console.error('Erro no login:', error);
        return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 });
    }
}

async function handleLogout() {
    const response = NextResponse.json({ success: true, message: 'Logout realizado com sucesso.' });
    clearAuthCookie(response);
    return response;
}

async function handleMe(req: NextRequest) {
    const token = req.cookies.get('auth-token')?.value;
    if (!token) return NextResponse.json({ user: null });

    const payload = verifyToken(token);
    if (!payload) return NextResponse.json({ user: null });

    return NextResponse.json({
        user: {
            userId: payload.userId,
            email: payload.email,
            name: payload.name,
            role: payload.role
        }
    });
}
