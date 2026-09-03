import { useEffect, useState } from 'react';

import { assignmentsService } from '../services/supabase/assignments';
import { useUser } from '../providers/UserContext';

interface ResultFilter {
  canViewAllResults: boolean;
  assignedCycleIds: string[];
  evaluatorId?: string;
  loading: boolean;
}

export const useFilteredResults = (): ResultFilter => {
  const { user, isAdmin, isEvaluator } = useUser();
  const evaluatorId = user?.humandUserId ? String(user.humandUserId) : undefined;
  const [assignedCycleIds, setAssignedCycleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin || !isEvaluator || !evaluatorId) {
      setLoading(false);
      return;
    }
    assignmentsService
      .getByEvaluator(evaluatorId)
      .then(rows => {
        setAssignedCycleIds([...new Set(rows.map(r => r.cycle_id))]);
      })
      .finally(() => setLoading(false));
  }, [isAdmin, isEvaluator, evaluatorId]);

  if (isAdmin) {
    return { canViewAllResults: true, assignedCycleIds: [], loading: false };
  }

  return { canViewAllResults: false, assignedCycleIds, evaluatorId, loading };
};
