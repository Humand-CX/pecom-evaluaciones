import { createContext, useContext, type ReactNode } from 'react';
import { MOCK_SEGMENTS } from '../pages/Evaluador/MatrizEvaluacion/constants';
import { type Segment } from '../types/segment';

type SegmentsContextValue = {
  segments: Segment[];
};

const SegmentsContext = createContext<SegmentsContextValue | null>(null);

export const SegmentsProvider = ({ children }: { children: ReactNode }) => {
  return (
    <SegmentsContext.Provider value={{ segments: MOCK_SEGMENTS }}>
      {children}
    </SegmentsContext.Provider>
  );
};

export const useSegments = () => {
  const ctx = useContext(SegmentsContext);
  if (!ctx) throw new Error('useSegments must be used within SegmentsProvider');
  return ctx;
};
