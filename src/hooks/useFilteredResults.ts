import { useMemo } from 'react';
import { useUser } from '../providers/UserContext';

interface ResultFilter {
  canViewAllResults: boolean;
  assignedCycleIds: string[];
  evaluatorId?: string;
}

export const useFilteredResults = (): ResultFilter => {
  const { user, isAdmin, isEvaluator } = useUser();

  return useMemo(() => {
    // Admin ve todos los resultados
    if (isAdmin) {
      return {
        canViewAllResults: true,
        assignedCycleIds: [],
      };
    }

    // Evaluador ve solo resultados de ciclos asignados
    if (isEvaluator && user?.id) {
      return {
        canViewAllResults: false,
        assignedCycleIds: [], // Esto se llenará desde assignments cuando conectemos Humand
        evaluatorId: user.id,
      };
    }

    // Otros (evaluado/viewer) no ven resultados
    return {
      canViewAllResults: false,
      assignedCycleIds: [],
    };
  }, [isAdmin, isEvaluator, user?.id]);
};
