import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { authMiddleware } from '@/lib/auth-server';
import { createAuditLog } from '@/lib/audit';

export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  try {
    const authResult = await authMiddleware(request);
    if (!authResult.success || !authResult.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.eventId;
    const body = await request.json();
    const { guestId } = body as { guestId?: string };

    if (!guestId) {
      return NextResponse.json({ error: 'Missing guestId' }, { status: 400 });
    }

    // Verify user has access to the event
    const userEvent = await prisma.userEvent.findFirst({
      where: { userId: authResult.userId, eventId },
    });
    if (!userEvent) {
      return NextResponse.json({ error: 'Event not found or access denied' }, { status: 404 });
    }

    // Find guest
    const guest = await prisma.guest.findUnique({ where: { id: guestId } });
    if (!guest || guest.eventId !== eventId) {
      return NextResponse.json({ error: 'Guest not found' }, { status: 404 });
    }

    // If not checked in, return 409
    if (guest.checkedInAt === null) {
      return NextResponse.json({ error: 'Este convidado ainda não realizou check-in.' }, { status: 409 });
    }

    // Persist undo
    const before = {
      id: guest.id,
      fullName: guest.fullName,
      checkedInAt: guest.checkedInAt,
    };

    const updated = await prisma.guest.update({
      where: { id: guestId },
      data: { checkedInAt: null },
      select: { id: true, fullName: true, checkedInAt: true },
    });

    // Audit if available
    try {
      await createAuditLog({
        userId: authResult.userId,
        role: (authResult.user && (authResult.user as any).role) || 'USER',
        action: 'UNCHECK',
        entityType: 'Guest',
        entityId: guestId,
        before,
        after: { id: updated.id, fullName: updated.fullName, checkedInAt: updated.checkedInAt },
        ip: request.headers.get('x-forwarded-for') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      });
    } catch (err) {
      console.error('Audit log failed:', err);
    }

    return NextResponse.json({ success: true, guest: updated, message: 'Check-in desfeito' });
  } catch (error) {
    console.error('Error undoing check-in:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
