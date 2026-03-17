/**
 * Utilitários para cache de convidados offline (P6.1)
 * Armazena no localStorage os dados pegos da API para consulta rápida offline.
 */

const CACHE_PREFIX = 'rsvp_guests_cache_';
const LAST_SYNC_PREFIX = 'rsvp_last_sync_';

export function saveGuestsToCache(eventId: string | number, guests: any[]) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(`${CACHE_PREFIX}${eventId}`, JSON.stringify(guests));
        localStorage.setItem(`${LAST_SYNC_PREFIX}${eventId}`, new Date().toISOString());
    } catch (e) {
        console.warn('[Cache] Erro ao salvar cache offline:', e);
    }
}

export function getGuestsFromCache(eventId: string | number): any[] | null {
    if (typeof window === 'undefined') return null;
    try {
        const data = localStorage.getItem(`${CACHE_PREFIX}${eventId}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        return null;
    }
}

export function getLastSyncTime(eventId: string | number): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(`${LAST_SYNC_PREFIX}${eventId}`);
}

export function clearGuestCache(eventId: string | number) {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(`${CACHE_PREFIX}${eventId}`);
    localStorage.removeItem(`${LAST_SYNC_PREFIX}${eventId}`);
}
