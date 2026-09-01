import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

import {
  assignmentsService,
  type EvaluatorAssignment as SupabaseAssignment,
} from '../services/supabase/assignments';
import { type EvaluatorAssignment } from '../types/evaluatorAssignments';

type EvaluatorAssignmentsContextValue = {
  assignments: EvaluatorAssignment[];
  addAssignment: (assignment: EvaluatorAssignment) => void;
  addBulkAssignments: (assignments: EvaluatorAssignment[]) => Promise<void>;
  deleteAssignment: (id: string) => void;
  getAssignmentsByCycleDimension: (
    cycleId: string,
    dimensionId: string,
  ) => EvaluatorAssignment[];
  getAssignmentsByEvaluator: (evaluatorId: string) => EvaluatorAssignment[];
  deleteAssignmentsByCycle: (cycleId: string) => void;
};

const EvaluatorAssignmentsContext =
  createContext<EvaluatorAssignmentsContextValue | null>(null);

const toFrontend = (row: SupabaseAssignment): EvaluatorAssignment => ({
  id: row.id,
  cycleId: row.cycle_id,
  dimensionId: row.dimension_id,
  evaluatorId: row.evaluator_id,
  personId: row.person_id,
});

const toSupabase = (a: EvaluatorAssignment): SupabaseAssignment => ({
  id: a.id,
  cycle_id: a.cycleId,
  dimension_id: a.dimensionId,
  evaluator_id: a.evaluatorId,
  person_id: a.personId,
});

export const EvaluatorAssignmentsProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>([]);

  useEffect(() => {
    assignmentsService.getAll().then(rows => setAssignments(rows.map(toFrontend)));
  }, []);

  const addAssignment = (assignment: EvaluatorAssignment) => {
    assignmentsService.create(toSupabase(assignment)).then(row => {
      setAssignments(prev => [...prev, toFrontend(row)]);
    });
  };

  const addBulkAssignments = async (newAssignments: EvaluatorAssignment[]) => {
    if (newAssignments.length === 0) return;

    const cycleId = newAssignments[0].cycleId;
    const dimensionIds = [...new Set(newAssignments.map(a => a.dimensionId))];
    const personIds = [...new Set(newAssignments.map(a => a.personId))];

    await assignmentsService.deleteByCycleDimensionsPersons(
      cycleId,
      dimensionIds,
      personIds,
    );
    const created = await assignmentsService.bulkCreate(
      newAssignments.map(toSupabase),
    );

    const replacedKeys = new Set(
      newAssignments.map(a => `${a.cycleId}|${a.dimensionId}|${a.personId}`),
    );
    setAssignments(prev => [
      ...prev.filter(
        a => !replacedKeys.has(`${a.cycleId}|${a.dimensionId}|${a.personId}`),
      ),
      ...created.map(toFrontend),
    ]);
  };

  const deleteAssignment = (id: string) => {
    assignmentsService.delete(id).then(() => {
      setAssignments(prev => prev.filter(a => a.id !== id));
    });
  };

  const getAssignmentsByCycleDimension = (
    cycleId: string,
    dimensionId: string,
  ) => {
    return assignments.filter(
      a => a.cycleId === cycleId && a.dimensionId === dimensionId,
    );
  };

  const getAssignmentsByEvaluator = (evaluatorId: string) => {
    return assignments.filter(a => a.evaluatorId === evaluatorId);
  };

  const deleteAssignmentsByCycle = (cycleId: string) => {
    assignmentsService.deleteByCycle(cycleId).then(() => {
      setAssignments(prev => prev.filter(a => a.cycleId !== cycleId));
    });
  };

  return (
    <EvaluatorAssignmentsContext.Provider
      value={{
        assignments,
        addAssignment,
        addBulkAssignments,
        deleteAssignment,
        getAssignmentsByCycleDimension,
        getAssignmentsByEvaluator,
        deleteAssignmentsByCycle,
      }}
    >
      {children}
    </EvaluatorAssignmentsContext.Provider>
  );
};

export const useEvaluatorAssignments = () => {
  const ctx = useContext(EvaluatorAssignmentsContext);
  if (!ctx)
    throw new Error(
      'useEvaluatorAssignments must be used within EvaluatorAssignmentsProvider',
    );
  return ctx;
};
