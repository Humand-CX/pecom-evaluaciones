import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { type EvaluatorAssignment } from '../types/evaluatorAssignments';

const STORAGE_KEY = 'pecom-evaluator-assignments';

type EvaluatorAssignmentsContextValue = {
  assignments: EvaluatorAssignment[];
  addAssignment: (assignment: EvaluatorAssignment) => void;
  addBulkAssignments: (assignments: EvaluatorAssignment[]) => void;
  deleteAssignment: (id: string) => void;
  getAssignmentsByCycleDimension: (cycleId: string, dimensionId: string) => EvaluatorAssignment[];
  getAssignmentsByEvaluator: (evaluatorId: string) => EvaluatorAssignment[];
  deleteAssignmentsByCycle: (cycleId: string) => void;
};

const EvaluatorAssignmentsContext = createContext<EvaluatorAssignmentsContextValue | null>(null);

function loadFromStorage(): EvaluatorAssignment[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as EvaluatorAssignment[];
  } catch {}
  return [];
}

export const EvaluatorAssignmentsProvider = ({ children }: { children: ReactNode }) => {
  const [assignments, setAssignments] = useState<EvaluatorAssignment[]>(loadFromStorage);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assignments));
  }, [assignments]);

  const addAssignment = (assignment: EvaluatorAssignment) => {
    setAssignments(prev => [...prev, assignment]);
  };

  const addBulkAssignments = (newAssignments: EvaluatorAssignment[]) => {
    setAssignments(prev => [...prev, ...newAssignments]);
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const getAssignmentsByCycleDimension = (cycleId: string, dimensionId: string) => {
    return assignments.filter(a => a.cycleId === cycleId && a.dimensionId === dimensionId);
  };

  const getAssignmentsByEvaluator = (evaluatorId: string) => {
    return assignments.filter(a => a.evaluatorId === evaluatorId);
  };

  const deleteAssignmentsByCycle = (cycleId: string) => {
    setAssignments(prev => prev.filter(a => a.cycleId !== cycleId));
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
  if (!ctx) throw new Error('useEvaluatorAssignments must be used within EvaluatorAssignmentsProvider');
  return ctx;
};
