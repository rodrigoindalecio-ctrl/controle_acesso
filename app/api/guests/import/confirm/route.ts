import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { createAuditLog } from '@/lib/audit';
import { z } from 'zod';
import type { ZodIssue } from 'zod';
import type { Prisma, ImportJob } from '@prisma/client';

interface GuestToImport {
  full_name: string;
  category?: string;
  phone?: string;
  notes?: string;
  table_number?: string;
}

type DuplicateStrategy = 'ignore' | 'update' | 'mark';

interface ImportResultItem {
  full_name: string;
  normalizedName: string;
  action: 'created' | 'updated' | 'skipped' | 'marked' | 'failed';
  reason?: string;
  guestId?: string;
}

// Zod schemas for request validation
// Aceita campos extras vindos da etapa de validação (id, status, etc.)
// mas mantém apenas os campos necessários para importação.
const GuestItemSchema = z.object({
  full_name: z.string().min(2).max(255),
  category: z.string().max(50).optional(),
  phone: z.string().max(20).optional(),
  notes: z.string().max(1000).optional(),
  table_number: z.string().max(20).optional()
}).passthrough().transform((obj: any) => ({
  full_name: obj.full_name,
  category: obj.category,
  phone: obj.phone,
  notes: obj.notes,
  table_number: obj.table_number
}));

const ConfirmBodySchema = z.object({
  // Prisma IDs here are `cuid()` (see prisma/schema.prisma), not UUID.
  // Accept any non-empty string to support cuid/uuid without rejecting valid event IDs.
  eventId: z.string().trim().min(1).max(64),
  guests: z.array(GuestItemSchema).min(1).max(5000),
  importMode: z.string().optional(),
  duplicateStrategy: z.enum(['ignore', 'update', 'mark']),
  idempotencyKey: z.string().max(255).optional()
});

/**
 * POST /api/guests/import/confirm
 * Confirma a importação e salva no banco
 */
export async function POST(request: NextRequest) {
  // track created import job id for failure handling
  let createdImportJobId: string | null = null;

  try {
    // Autenticação
    const authResult = await verifyAuth(request);
    if (!authResult) {
      return NextResponse.json({ message: 'Não autorizado' }, { status: 401 });
    }

    const body = await request.json();

    // Validate request body with Zod before any DB access
    const parsed = ConfirmBodySchema.safeParse(body);
    if (!parsed.success) {
      const zErr = parsed.error;
      const details = zErr.issues.map((e: ZodIssue) => ({ path: e.path.join('.'), message: e.message }));
      return NextResponse.json(
        { code: 'INVALID_REQUEST', message: 'Payload inválido', details },
        { status: 400 }
      );
    }

    const { eventId, guests, importMode = 'valid', duplicateStrategy, idempotencyKey } = parsed.data;

    // Normalização helpers
    const normalizeFullName = (s: string) => s.trim().replace(/\s+/g, ' ');
    const normalizeKey = (s: string) => normalizeFullName(s).toLowerCase();
    const normalizePhone = (p?: string) => (p || '').toString().replace(/\D/g, '').substring(0, 20);

    // Normalize payload data (do not mutate original shape beyond safe trimming)
    type NormalizedGuest = GuestToImport & { _normalizedName: string; _normalizedPhone?: string };
    const normalizedGuests: NormalizedGuest[] = guests.map(g => {
      const trimmed = {
        full_name: normalizeFullName(g.full_name),
        category: g.category?.trim() || undefined,
        phone: g.phone ? normalizePhone(g.phone) : undefined,
        notes: g.notes?.trim() || undefined,
        table_number: g.table_number?.trim() || undefined
      };

      return {
        ...trimmed,
        _normalizedName: normalizeKey(trimmed.full_name),
        _normalizedPhone: trimmed.phone
      };
    });

    // Verificar se evento existe (após validação)
    const event = await prisma.event.findUnique({ where: { id: eventId }, select: { id: true } });
    if (!event) {
      return NextResponse.json({ code: 'EVENT_NOT_FOUND', message: 'Evento não encontrado' }, { status: 404 });
    }

    // Autorização: ADMIN ou USER vinculado ao evento
    if (authResult.role !== 'ADMIN') {
      const userEvent = await prisma.userEvent.findUnique({
        where: {
          userId_eventId: {
            userId: authResult.userId,
            eventId
          }
        }
      });

      if (!userEvent) {
        return NextResponse.json(
          { code: 'FORBIDDEN', message: 'Acesso negado ao evento' },
          { status: 403 }
        );
      }
    }

    // Idempotency handling: if idempotencyKey provided, check ImportJob table
    let importJob: ImportJob | null = null;
    if (idempotencyKey) {
      importJob = await prisma.importJob.findUnique({
        where: {
          userId_eventId_idempotencyKey: {
            userId: authResult.userId,
            eventId,
            idempotencyKey
          }
        }
      });

      if (importJob) {
        if (importJob.status === 'completed') {
          try {
            const saved = importJob.result ? JSON.parse(importJob.result) : { message: 'Importação já processada' };
            return NextResponse.json(saved, { status: 200 });
          } catch {
            return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Erro lendo resultado de idempotência' }, { status: 500 });
          }
        }

        if (importJob.status === 'pending') {
          return NextResponse.json({ code: 'CONFLICT', message: 'Importação já em andamento' }, { status: 409 });
        }
      } else {
        // create pending job record
        importJob = await prisma.importJob.create({
          data: {
            userId: authResult.userId,
            eventId,
            idempotencyKey,
            status: 'pending'
          }
        });
        createdImportJobId = importJob.id;
      }
    }

    // Transaction para garantir atomicidade
    // Fetch existing guests for the event once, and build a map by normalized name
    const existingGuests = await prisma.guest.findMany({ where: { eventId }, select: { id: true, fullName: true, category: true, phone: true, notes: true, tableNumber: true } });
    const existingMap = new Map<string, { id: string; fullName: string; category: string | null; phone: string | null; notes: string | null; tableNumber: string | null }>();
    for (const eg of existingGuests) {
      const key = eg.fullName ? eg.fullName.trim().replace(/\s+/g, ' ').toLowerCase() : '';
      if (!existingMap.has(key)) existingMap.set(key, eg);
    }
    // detect duplicates within payload using normalized name
    const nameCount = new Map<string, number>();
    for (const g of normalizedGuests) {
      nameCount.set(g._normalizedName, (nameCount.get(g._normalizedName) || 0) + 1);
    }

    const results = (await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const txCreated: Array<{ id: string; fullName: string }> = [];
      const txUpdated: Array<{ id: string; fullName: string }> = [];
      const txSkipped: Array<{ name: string }> = [];
      const txFailed: Array<{ name: string; error: string }> = [];

      const perItemResults: ImportResultItem[] = [];

      for (const guest of normalizedGuests) {
        // internal CSV duplicate
        if ((nameCount.get(guest._normalizedName) || 0) > 1) {
          perItemResults.push({
            full_name: guest.full_name,
            normalizedName: guest._normalizedName,
            action: 'failed',
            reason: 'duplicate_in_csv'
          });
          txFailed.push({ name: guest.full_name, error: 'duplicate in CSV' });
          continue;
        }

        try {
          const existing = existingMap.get(guest._normalizedName) || null;

          if (existing) {
            if (duplicateStrategy === 'ignore') {
              perItemResults.push({
                full_name: guest.full_name,
                normalizedName: guest._normalizedName,
                action: 'skipped'
              });
              txSkipped.push({ name: guest.full_name });
              continue;
            }

            if (duplicateStrategy === 'update') {
              const updatedGuest = await tx.guest.update({
                where: { id: existing.id },
                data: {
                  category: guest.category || existing.category || 'Convidado',
                  phone: guest._normalizedPhone || existing.phone || null,
                  notes: guest.notes || existing.notes || null,
                  tableNumber: guest.table_number || existing.tableNumber || null
                }
              });

              perItemResults.push({
                full_name: guest.full_name,
                normalizedName: guest._normalizedName,
                action: 'updated',
                guestId: updatedGuest.id
              });
              txUpdated.push({ id: updatedGuest.id, fullName: updatedGuest.fullName });
              continue;
            }

            if (duplicateStrategy === 'mark') {
              const newNotes = `${guest.notes || ''}`.trim();
              const markedNotes = newNotes ? `${newNotes} (duplicado import)` : '(duplicado import)';

              const newGuest = await tx.guest.create({
                data: {
                  fullName: guest.full_name,
                  category: guest.category || 'Convidado',
                  phone: guest._normalizedPhone || null,
                  notes: markedNotes,
                  tableNumber: guest.table_number || null,
                  eventId,
                  isManual: false
                }
              });

              perItemResults.push({
                full_name: guest.full_name,
                normalizedName: guest._normalizedName,
                action: 'marked',
                guestId: newGuest.id
              });
              txCreated.push({ id: newGuest.id, fullName: newGuest.fullName });
              continue;
            }
          }

          // No existing guest: create
          const newGuest = await tx.guest.create({
            data: {
              fullName: guest.full_name,
              category: guest.category || 'Convidado',
              phone: guest._normalizedPhone || null,
              notes: guest.notes || null,
              tableNumber: guest.table_number || null,
              eventId,
              isManual: false
            }
          });

          perItemResults.push({
            full_name: guest.full_name,
            normalizedName: guest._normalizedName,
            action: 'created',
            guestId: newGuest.id
          });
          txCreated.push({ id: newGuest.id, fullName: newGuest.fullName });
        } catch (err) {
          const message = err instanceof Error ? err.message : 'unknown error';
          perItemResults.push({
            full_name: guest.full_name,
            normalizedName: guest._normalizedName,
            action: 'failed',
            reason: message
          });
          txFailed.push({ name: guest.full_name, error: message });
        }
      }

      return perItemResults;
    })) as ImportResultItem[];

    // Derive summary from per-item results
    const summary = results.reduce(
      (acc, r) => {
        if (r.action === 'created') acc.created++;
        if (r.action === 'updated') acc.updated++;
        if (r.action === 'skipped') acc.skipped++;
        if (r.action === 'marked') acc.marked++;
        if (r.action === 'failed') acc.failed++;
        return acc;
      },
      { created: 0, updated: 0, skipped: 0, marked: 0, failed: 0 }
    );

    // Registrar auditoria
    await createAuditLog({
      userId: authResult.userId,
      role: authResult.role,
      action: 'IMPORT_GUESTS',
      entityType: 'Event',
      entityId: eventId,
      justification: `Importação: created=${summary.created} updated=${summary.updated} skipped=${summary.skipped}`,
      before: { count: 0 },
      after: { created: summary.created, updated: summary.updated, skipped: summary.skipped, failed: summary.failed },
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    });

    // If idempotencyKey provided, persist the full results array in ImportJob (mark completed)
    if (importJob) {
      const savedResult = {
        message: `${summary.created} convidado(s) importado(s)`,
        summary,
        results,
        timestamp: new Date().toISOString()
      };

      await prisma.importJob.update({
        where: { id: createdImportJobId || importJob.id },
        data: { status: 'completed', result: JSON.stringify(savedResult) }
      });
    }

    // Response (keep backward compatibility fields and add `results`)
    const responsePayload = {
      message: `${summary.created} convidado(s) importado(s)`,
      summary: {
        created: summary.created,
        updated: summary.updated,
        skipped: summary.skipped,
        failed: summary.failed
      },
      // compatibility arrays derived from results
      created: results.filter(r => r.action === 'created').map(r => ({ id: r.guestId, fullName: r.full_name, status: 'importado' })),
      updated: results.filter(r => r.action === 'updated').map(r => ({ id: r.guestId, fullName: r.full_name, status: 'atualizado' })),
      skipped: results.filter(r => r.action === 'skipped').map(r => ({ name: r.full_name })),
      errors: results.filter(r => r.action === 'failed').map(r => ({ name: r.full_name, reason: r.reason })),
      timestamp: new Date().toISOString(),
      results
    };

    return NextResponse.json(responsePayload);

  } catch (error) {
    console.error('Erro ao confirmar importação:', error);
    // If we created an importJob, mark it as failed with the error (do not expose stack)
    try {
      if (createdImportJobId) {
        await prisma.importJob.update({ where: { id: createdImportJobId }, data: { status: 'failed', result: JSON.stringify({ error: 'Import failed' }) } });
      }
    } catch (e) {
      // ignore errors during error-handling
    }

    return NextResponse.json({ code: 'INTERNAL_ERROR', message: 'Erro ao importar convidados' }, { status: 500 });
  }
}
