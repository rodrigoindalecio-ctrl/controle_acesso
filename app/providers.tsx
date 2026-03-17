"use client";

import React, { ReactNode } from 'react';
import { ToastProvider } from './lib/context/ToastContext';
import { ConnectivityProvider } from './lib/context/ConnectivityContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConnectivityProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ConnectivityProvider>
  );
}
