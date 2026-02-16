import { createContext, useContext, ReactNode } from 'react';
import { usePlatform, PlatformInfo } from '@/hooks/usePlatform';

const PlatformContext = createContext<PlatformInfo | undefined>(undefined);

export function PlatformProvider({ children }: { children: ReactNode }) {
  const platformInfo = usePlatform();

  return (
    <PlatformContext.Provider value={platformInfo}>
      {children}
    </PlatformContext.Provider>
  );
}

export function usePlatformContext() {
  const context = useContext(PlatformContext);
  if (context === undefined) {
    throw new Error('usePlatformContext must be used within a PlatformProvider');
  }
  return context;
}
