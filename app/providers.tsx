"use client";

import React, { ReactNode } from 'react';
import { ToastProvider } from './lib/context/ToastContext';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      {children}
    </ToastProvider>
  );
}
