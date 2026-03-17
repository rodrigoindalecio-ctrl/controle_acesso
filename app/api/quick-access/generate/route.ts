import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyAuth } from '@/lib/auth';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    const auth = await verifyAuth(req);
    if (!auth) {
        return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    try {
        const { eventId } = await req.json();

        if (!eventId) {
            return NextResponse.json({ message: 'eventId é obrigatório' }, { status: 400 });
        }

        // Se não for ADMIN, verifica se tem acesso ao evento
        if (auth.role !== 'ADMIN') {
            const assignment = await prisma.userEvent.findUnique({
                where: { userId_eventId: { userId: Number(auth.userId), eventId: Number(eventId) } }
            });
            if (!assignment) {
                return NextResponse.json({ message: 'Acesso negado ao evento' }, { status: 403 });
            }
        }

        // Generate a random token
        const token = crypto.randomBytes(16).toString('hex');

        // 3 hours expiry
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 3);

        const quickAccess = await prisma.quickAccess.create({
            data: {
                token,
                eventId: Number(eventId),
                expiresAt,
            }
        });

        // Generate full URL
        const origin = new URL(req.url).origin;
        const url = `${origin}/quick-access/${token}`;

        return NextResponse.json({
            success: true,
            url,
            token,
            expiresAt
        });

    } catch (error) {
        console.error('Error generating quick access:', error);
        return NextResponse.json({ message: 'Erro interno ao gerar acesso' }, { status: 500 });
    }
}
