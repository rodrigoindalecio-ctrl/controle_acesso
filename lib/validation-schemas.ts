import { z } from 'zod';

/**
 * Schema para validação de correção de convidado
 */
export const correctGuestSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome não pode exceder 255 caracteres')
    .optional(),
  
  phone: z
    .string()
    .max(20, 'Telefone não pode exceder 20 caracteres')
    .optional()
    .nullable(),
  
  category: z
    .string()
    .max(50, 'Categoria não pode exceder 50 caracteres')
    .optional(),
  
  notes: z
    .string()
    .max(500, 'Notas não podem exceder 500 caracteres')
    .optional()
    .nullable(),
  
  justification: z
    .string()
    .min(5, 'Motivo deve ter pelo menos 5 caracteres')
    .max(255, 'Motivo não pode exceder 255 caracteres'),
});

export type CorrectGuestInput = z.infer<typeof correctGuestSchema>;

/**
 * Schema para validação de filtros de auditoria
 */
export const auditLogsFilterSchema = z.object({
  userId: z.string().optional(),
  action: z
    .enum(['CHECKIN', 'UNCHECK', 'EDIT_GUEST', 'CREATE_GUEST', 'DELETE_GUEST', 'IMPORT_GUESTS', 'CORRECT_GUEST'])
    .optional(),
  entityType: z.enum(['Guest', 'Event', 'User']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0),
});

export type AuditLogsFilter = z.infer<typeof auditLogsFilterSchema>;
