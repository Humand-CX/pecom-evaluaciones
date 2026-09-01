import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  dimensionsService,
  type DimensionRow,
} from '../services/supabase/dimensions';
import { type Dimension } from '../pages/Evaluador/MatrizEvaluacion/types';

type DimensionsContextValue = {
  dimensions: Dimension[];
  addDimension: (name: string) => void;
  updateDimension: (id: string, name: string) => void;
  deleteDimension: (id: string) => void;
  addSubDimension: (
    dimensionId: string,
    name: string,
    description?: string,
  ) => void;
  updateSubDimension: (
    dimensionId: string,
    subId: string,
    name: string,
    description?: string,
  ) => void;
  deleteSubDimension: (dimensionId: string, subId: string) => void;
  duplicateDimension: (id: string) => void;
};

const DimensionsContext = createContext<DimensionsContextValue | null>(null);

const toFrontend = (row: DimensionRow): Dimension => ({
  id: row.id,
  name: row.name,
  subDimensions: (row.sub_dimensions ?? []).map(sd => ({
    id: sd.id,
    name: sd.name,
    description: sd.description ?? undefined,
  })),
});

export const DimensionsProvider = ({ children }: { children: ReactNode }) => {
  const [dimensions, setDimensions] = useState<Dimension[]>([]);

  useEffect(() => {
    dimensionsService.getAll().then(rows => setDimensions(rows.map(toFrontend)));
  }, []);

  const addDimension = (name: string) => {
    const id = crypto.randomUUID();
    dimensionsService.create(id, name).then(() => {
      setDimensions(prev => [...prev, { id, name, subDimensions: [] }]);
    });
  };

  const updateDimension = (id: string, name: string) => {
    dimensionsService.update(id, name).then(() => {
      setDimensions(prev => prev.map(d => (d.id === id ? { ...d, name } : d)));
    });
  };

  const deleteDimension = (id: string) => {
    dimensionsService.delete(id).then(() => {
      setDimensions(prev => prev.filter(d => d.id !== id));
    });
  };

  const addSubDimension = (
    dimensionId: string,
    name: string,
    description?: string,
  ) => {
    const id = crypto.randomUUID();
    dimensionsService
      .addSubDimension(id, dimensionId, name, description)
      .then(() => {
        setDimensions(prev =>
          prev.map(d =>
            d.id === dimensionId
              ? {
                  ...d,
                  subDimensions: [...d.subDimensions, { id, name, description }],
                }
              : d,
          ),
        );
      });
  };

  const updateSubDimension = (
    dimensionId: string,
    subId: string,
    name: string,
    description?: string,
  ) => {
    dimensionsService.updateSubDimension(subId, name, description).then(() => {
      setDimensions(prev =>
        prev.map(d =>
          d.id === dimensionId
            ? {
                ...d,
                subDimensions: d.subDimensions.map(sd =>
                  sd.id === subId ? { ...sd, name, description } : sd,
                ),
              }
            : d,
        ),
      );
    });
  };

  const deleteSubDimension = (dimensionId: string, subId: string) => {
    dimensionsService.deleteSubDimension(subId).then(() => {
      setDimensions(prev =>
        prev.map(d =>
          d.id === dimensionId
            ? {
                ...d,
                subDimensions: d.subDimensions.filter(sd => sd.id !== subId),
              }
            : d,
        ),
      );
    });
  };

  const duplicateDimension = async (id: string) => {
    const dimensionToDuplicate = dimensions.find(d => d.id === id);
    if (!dimensionToDuplicate) return;

    const newId = crypto.randomUUID();
    await dimensionsService.create(
      newId,
      `${dimensionToDuplicate.name} (Copia)`,
    );
    const newSubDimensions = [];
    for (const sd of dimensionToDuplicate.subDimensions) {
      const subId = crypto.randomUUID();
      await dimensionsService.addSubDimension(
        subId,
        newId,
        sd.name,
        sd.description,
      );
      newSubDimensions.push({ id: subId, name: sd.name, description: sd.description });
    }

    setDimensions(prev => [
      ...prev,
      {
        id: newId,
        name: `${dimensionToDuplicate.name} (Copia)`,
        subDimensions: newSubDimensions,
      },
    ]);
  };

  return (
    <DimensionsContext.Provider
      value={{
        dimensions,
        addDimension,
        updateDimension,
        deleteDimension,
        addSubDimension,
        updateSubDimension,
        deleteSubDimension,
        duplicateDimension,
      }}
    >
      {children}
    </DimensionsContext.Provider>
  );
};

export const useDimensions = () => {
  const ctx = useContext(DimensionsContext);
  if (!ctx)
    throw new Error('useDimensions must be used within DimensionsProvider');
  return ctx;
};
