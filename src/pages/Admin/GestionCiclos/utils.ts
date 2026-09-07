import { type Cycle as SupabaseCycle } from '../../../services/supabase/cycles';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

export const toFrontendCycle = (row: SupabaseCycle): Cycle => ({
  id: row.id,
  name: row.name,
  project_name: row.project_name ?? '',
  start_date: row.start_date ?? '',
  end_date: row.end_date ?? '',
  status: row.status,
  dimensionIds: row.dimension_ids ?? [],
  segmentIds: row.segment_ids ?? [],
  addedPersonIds: row.added_person_ids ?? [],
  excludedPersonIds: row.excluded_person_ids ?? [],
});
