'use client';

import { createContext, useContext } from 'react';
import { usePortalEscrow } from '@/lib/usePortalEscrow';

const PortalContext = createContext<ReturnType<typeof usePortalEscrow> | null>(null);

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const value = usePortalEscrow();
  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function usePortal() {
  const value = useContext(PortalContext);
  if (!value) throw new Error('PortalProvider missing');
  return value;
}
