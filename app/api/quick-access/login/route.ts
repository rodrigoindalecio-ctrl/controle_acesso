import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateToken, setAuthCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { token, name } = await req.json();

        if (!token || !name) {
            return NextResponse.json({ message: 'Token e nome são obrigatórios' }, { status: 400 });
        }

        // Find the token
        const quickAccess = await prisma.quickAccess.findUnique({
            where: { token }
        });

        if (!quickAccess) {
            return NextResponse.json({ message: 'Token inválido' }, { status: 404 });
        }

        // Check expiry
        if (new Date() > quickAccess.expiresAt) {
            return NextResponse.json({ message: 'Token expirado' }, { status: 403 });
        }

        // Generate JWT for the assistant
        const jwtPayload = {
            userId: `temp_${quickAccess.id}`,
            email: `temp_${token}@event.com`,
            name: name,
            role: 'TEMP_STAFF' as const,
            eventId: quickAccess.eventId
        };

        const authToken = generateToken(jwtPayload);
        const response = NextResponse.json({
            success: true,
            role: 'TEMP_STAFF',
            eventId: quickAccess.eventId
        });

        setAuthCookie(response, authToken);

        return response;

    } catch (error) {
        console.error('Error in quick access login:', error);
        return NextResponse.json({ message: 'Erro ao processar acesso' }, { status: 500 });
    }
}
