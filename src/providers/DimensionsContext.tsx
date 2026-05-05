import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { DIMENSIONS } from '../pages/Evaluador/MatrizEvaluacion/constants';
import { type Dimension } from '../pages/Evaluador/MatrizEvaluacion/types';

const STORAGE_KEY = 'pecom-dimensions';

type DimensionsContextValue = {
  dimensions: Dimension[];
  addDimension: (name: string) => void;
  updateDimension: (id: string, name: string) => void;
  deleteDimension: (id: string) => void;
  addSubDimension: (dimensionId: string, name: string) => void;
  updateSubDimension: (dimensionId: string, subId: string, name: string) => void;
  deleteSubDimension: (dimensionId: string, subId: string) => void;
  duplicateDimension: (id: string) => void;
};

const DimensionsContext = createContext<DimensionsContextValue | null>(null);

function loadFromStorage(): Dimension[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Dimension[];
  } catch {}
  return DIMENSIONS;
}

export const DimensionsProvider = ({ children }: { children: ReactNode }) => {
  const [dimensions, setDimensions] = useState<Dimension[]>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dimensions));
  }, [dimensions]);

  const addDimension = (name: string) => {
    setDimensions(prev => [...prev, { id: crypto.randomUUID(), name, subDimensions: [] }]);
  };

  const updateDimension = (id: string, name: string) => {
    setDimensions(prev => prev.map(d => d.id === id ? { ...d, name } : d));
  };

  const deleteDimension = (id: string) => {
    setDimensions(prev => prev.filter(d => d.id !== id));
  };

  const addSubDimension = (dimensionId: string, name: string) => {
    setDimensions(prev => prev.map(d =>
      d.id === dimensionId
        ? { ...d, subDimensions: [...d.subDimensions, { id: crypto.randomUUID(), name }] }
        : d,
    ));
  };

  const updateSubDimension = (dimensionId: string, subId: string, name: string) => {
    setDimensions(prev => prev.map(d =>
      d.id === dimensionId
        ? { ...d, subDimensions: d.subDimensions.map(sd => sd.id === subId ? { ...sd, name } : sd) }
        : d,
    ));
  };

  const deleteSubDimension = (dimensionId: string, subId: string) => {
    setDimensions(prev => prev.map(d =>
      d.id === dimensionId
        ? { ...d, subDimensions: d.subDimensions.filter(sd => sd.id !== subId) }
        : d,
    ));
  };

  const duplicateDimension = (id: string) => {
    const dimensionToDuplicate = dimensions.find(d => d.id === id);
    if (!dimensionToDuplicate) return;

    const newDimension: Dimension = {
      id: crypto.randomUUID(),
      name: `${dimensionToDuplicate.name} (Copia)`,
      subDimensions: dimensionToDuplicate.subDimensions.map(sd => ({
        id: crypto.randomUUID(),
        name: sd.name,
      })),
    };

    setDimensions(prev => [...prev, newDimension]);
  };

  return (
    <DimensionsContext.Provider value={{ dimensions, addDimension, updateDimension, deleteDimension, addSubDimension, updateSubDimension, deleteSubDimension, duplicateDimension }}>
      {children}
    </DimensionsContext.Provider>
  );
};

export const useDimensions = () => {
  const ctx = useContext(DimensionsContext);
  if (!ctx) throw new Error('useDimensions must be used within DimensionsProvider');
  return ctx;
};
