/**
 * Utilitário para tradução de status de eventos
 */

export const statusTranslation: Record<string, string> = {
  'ACTIVE': 'Ativo',
  'PENDING': 'Pendente',
  'COMPLETED': 'Concluído',
  'CANCELLED': 'Cancelado',
  'DRAFT': 'Rascunho',
};

/**
 * Traduz o status do evento para PT-BR
 * @param status - Status em inglês (ACTIVE, PENDING, etc.)
 * @returns Status traduzido para PT-BR
 */
export function translateStatus(status: string | undefined | null): string {
  if (!status) return '-';
  const upperStatus = status.toUpperCase();
  return statusTranslation[upperStatus] || status;
}
