export interface OfflineAction {
    id: string; // ID único para a ação na fila (ex: timestamp + random)
    actionType: 'CHECK_IN' | 'UNDO_CHECK_IN' | 'CREATE_GUEST' | 'DELETE_GUEST';
    payload: any; // Os dados que precisam ser enviados
    endpoint: string;
    method: string;
    timestamp: number;
}

const QUEUE_KEY = 'rsvp_offline_queue';

// Lê toda a fila do navegador
export function getOfflineQueue(): OfflineAction[] {
    if (typeof window === 'undefined') return [];
    try {
        const data = localStorage.getItem(QUEUE_KEY);
        return data ? JSON.parse(data) : [];
    } catch (error) {
        console.error('Erro ao ler fila offline:', error);
        return [];
    }
}

// Salva a fila completa no navegador
export function saveOfflineQueue(queue: OfflineAction[]): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
        console.error('Erro ao salvar fila offline:', error);
    }
}

// Embala e insere uma nova ação no final da fila (Cofre)
export function enqueueAction(actionType: OfflineAction['actionType'], endpoint: string, method: string, payload: any): void {
    const queue = getOfflineQueue();
    const newAction: OfflineAction = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        actionType,
        endpoint,
        method,
        payload,
        timestamp: Date.now(),
    };

    queue.push(newAction);
    saveOfflineQueue(queue);
}

// Retira uma ação específica da fila após sucesso
export function removeActionFromQueue(actionId: string): void {
    const queue = getOfflineQueue();
    const filtered = queue.filter(action => action.id !== actionId);
    saveOfflineQueue(filtered);
}

export function clearQueue(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(QUEUE_KEY);
}
