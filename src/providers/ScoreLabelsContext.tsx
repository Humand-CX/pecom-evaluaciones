import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import { scoreLabelsService } from '../services/supabase/scoreLabels';

type ScoreLabelsContextValue = {
  labels: Record<number, string>;
  updateLabel: (score: number, label: string) => void;
  loading: boolean;
};

const DEFAULT_LABELS: Record<number, string> = {
  1: 'Nocivo',
  2: 'Malo',
  3: 'Regular',
  4: 'Bueno',
  5: 'Muy bueno',
};

const ScoreLabelsContext = createContext<ScoreLabelsContextValue | null>(null);

export const ScoreLabelsProvider = ({ children }: { children: ReactNode }) => {
  const [labels, setLabels] = useState<Record<number, string>>(DEFAULT_LABELS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scoreLabelsService
      .getAll()
      .then(rows => {
        if (rows.length === 0) return;
        const map: Record<number, string> = {};
        rows.forEach(r => {
          map[r.score] = r.label;
        });
        setLabels(map);
      })
      .finally(() => setLoading(false));
  }, []);

  const updateLabel = (score: number, label: string) => {
    scoreLabelsService.update(score, label).then(() => {
      setLabels(prev => ({ ...prev, [score]: label }));
    });
  };

  return (
    <ScoreLabelsContext.Provider value={{ labels, updateLabel, loading }}>
      {children}
    </ScoreLabelsContext.Provider>
  );
};

export const useScoreLabels = () => {
  const ctx = useContext(ScoreLabelsContext);
  if (!ctx)
    throw new Error('useScoreLabels must be used within ScoreLabelsProvider');
  return ctx;
};
