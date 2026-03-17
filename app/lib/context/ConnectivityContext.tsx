'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Wifi, WifiOff, CloudSync, CloudCheck } from 'lucide-react';
import { saveGuestsToCache } from '../offline-cache';

type SyncStatus = 'idle' | 'syncing' | 'synced' | 'error' | 'offline';

interface ConnectivityContextType {
  isOnline: boolean;
  syncStatus: SyncStatus;
  triggerEventSync: (eventId: string | number) => void;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  syncStatus: 'idle',
  triggerEventSync: () => {},
});

export const useConnectivity = () => useContext(ConnectivityContext);

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Sync background function to fetch all guests for a specific event
  const triggerEventSync = async (eventId: string | number) => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    try {
      const res = await fetch(`/api/events/${eventId}/guests`);
      if (res.ok) {
        const data = await res.json();
        saveGuestsToCache(eventId, data.guests || []);
        setSyncStatus('synced');
        // Reset to idle after 5s
        setTimeout(() => setSyncStatus('idle'), 5000);
      } else {
        setSyncStatus('error');
      }
    } catch (error) {
       setSyncStatus('error');
    }
  };

  return (
    <ConnectivityContext.Provider value={{ isOnline, syncStatus, triggerEventSync }}>
      <div style={{ position: 'fixed', top: '10px', right: '10px', zIndex: 9999, display: 'flex', gap: '8px' }}>
        {syncStatus === 'syncing' && (
          <div title="Sincronizando dados..." style={{ background: '#fef4e6', color: '#d9b57a', padding: '6px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CloudSync size={20} className="animate-spin" />
          </div>
        )}
        
        {syncStatus === 'synced' && (
          <div title="Dados sincronizados para uso offline" style={{ background: '#e8f5e9', color: '#6ba583', padding: '6px', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
            <CloudCheck size={20} />
          </div>
        )}

        {!isOnline && (
          <div title="Modo Offline Ativo" style={{ 
            background: '#ffebee', 
            color: '#c97e7e', 
            padding: '6px 12px', 
            borderRadius: '20px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px',
            fontSize: '12px',
            fontWeight: 'bold',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            border: '1px solid rgba(201, 126, 126, 0.2)'
          }}>
            <WifiOff size={16} /> Offline
          </div>
        )}
      </div>
      {children}
    </ConnectivityContext.Provider>
  );
}
