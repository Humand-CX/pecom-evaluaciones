import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IconClipboardList } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';

import StateCard from '@material-hu/components/composed-components/StateCard';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';
import Title from '@material-hu/components/design-system/Title';

import { useUser } from '../../../providers/UserContext';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { cyclesService, type Cycle as SupabaseCycle } from '../../../services/supabase/cycles';

import { CycleCard } from './components/CycleCard';
import { type Cycle } from './types';

const toFrontendCycle = (row: SupabaseCycle): Cycle => ({
  id: row.id,
  name: row.name,
  project_name: row.project_name ?? '',
  start_date: row.start_date ?? '',
  end_date: row.end_date ?? '',
  status: row.status,
  dimensionIds: row.dimension_ids ?? [],
  segmentIds: row.segment_ids ?? [],
});

export default function CiclosActivosPage() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);

  useEffect(() => {
    cyclesService
      .getAll()
      .then(rows => setCycles(rows.map(toFrontendCycle)))
      .finally(() => setCyclesLoading(false));
  }, []);

  if (cyclesLoading) {
    return (
      <DashboardLayout>
        <Stack
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
          }}
        >
          <Spinner />
        </Stack>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Title
          title={`Hola, ${user?.name || 'usuario'}!`}
          description="Ciclos de evaluación asignados a tu cuadrilla."
          variant="L"
        />

        {cycles.length === 0 && (
          <StateCard
            slotProps={{
              title: {
                title: 'No tenés ciclos asignados',
                description:
                  'Cuando se abra un ciclo de evaluación, vas a verlo acá.',
                variant: 'M',
              },
              avatar: {
                Icon: IconClipboardList,
                color: 'default',
              },
            }}
          />
        )}

        {cycles.length > 0 && (
          <Stack sx={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
            {cycles.map(cycle => (
              <CycleCard
                key={cycle.id}
                cycle={cycle}
                onClick={() => navigate(`/evaluador/matriz/${cycle.id}`)}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </DashboardLayout>
  );
}
