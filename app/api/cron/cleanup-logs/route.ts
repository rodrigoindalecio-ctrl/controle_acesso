import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * Cron Job para limpeza de logs de auditoria antigos (P4.1)
 * Deve ser configurado no vercel.json ou chamado via CRON externa.
 * 
 * Exemplo de vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/cleanup-logs",
 *     "schedule": "0 3 * * *" 
 *   }]
 * }
 */
export async function GET(req: NextRequest) {
    // Proteção básica via Header da Vercel ou Secret customizada
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        // Deleta logs mais antigos que 90 dias
        const result = await prisma.auditLog.deleteMany({
            where: {
                created_at: {
                    lt: ninetyDaysAgo,
                },
            },
        });

        console.log(`[CRON] Limpeza de logs concluída. ${result.count} registros removidos.`);

        return NextResponse.json({ 
            success: true, 
            removedCount: result.count,
            message: `Limpeza concluída: ${result.count} logs com mais de 90 dias foram removidos.`
        });

    } catch (error) {
        console.error('[CRON Error] Falha na limpeza de logs:', error);
        return NextResponse.json({ 
            error: 'Erro interno na limpeza de logs',
            details: error instanceof Error ? error.message : 'Erro desconhecido'
        }, { status: 500 });
    }
}
