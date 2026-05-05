import type { Cycle, CycleStatus } from './types';

type PillType = 'error' | 'success' | 'warning' | 'info' | 'highlight' | 'neutral' | 'disabled';

export const STATUS_CONFIG: Record<CycleStatus, { label: string; type: PillType }> = {
  active: { label: 'ACTIVO', type: 'success' },
  closed: { label: 'CERRADO', type: 'neutral' },
  draft: { label: 'BORRADOR', type: 'warning' },
};

export const MOCK_CYCLES: Cycle[] = [
  {
    id: '1',
    name: 'Q2 2025 - LAJE',
    project_name: 'LAJE',
    start_date: '2025-04-01',
    end_date: '2025-06-30',
    status: 'active',
    dimensionIds: ['disciplina', 'conocimiento', 'actitud'],
  },
  {
    id: '2',
    name: 'Q2 2025 - HUB NORTE',
    project_name: 'HUB NORTE',
    start_date: '2025-04-01',
    end_date: '2025-07-31',
    status: 'active',
    dimensionIds: ['disciplina', 'conocimiento'],
  },
  {
    id: '3',
    name: 'Q1 2025 - CHIVILCOY',
    project_name: 'CHIVILCOY',
    start_date: '2025-01-01',
    end_date: '2025-03-31',
    status: 'closed',
    dimensionIds: ['disciplina', 'actitud'],
  },
];
