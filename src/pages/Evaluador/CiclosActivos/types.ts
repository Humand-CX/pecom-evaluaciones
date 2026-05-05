export type CycleStatus = 'active' | 'closed' | 'draft';

export type Cycle = {
  id: string;
  name: string;
  project_name: string;
  start_date: string;
  end_date: string;
  status: CycleStatus;
  dimensionIds: string[];
};
