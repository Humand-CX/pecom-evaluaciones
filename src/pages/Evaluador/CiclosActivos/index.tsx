import { useNavigate } from 'react-router-dom';

import Stack from '@material-hu/mui/Stack';
import Title from '@material-hu/components/design-system/Title';
import StateCard from '@material-hu/components/composed-components/StateCard';
import { IconClipboardList } from '@material-hu/icons/tabler';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { MOCK_CYCLES } from './constants';
import { CycleCard } from './components/CycleCard';

export default function CiclosActivosPage() {
  const navigate = useNavigate();
  const cycles = MOCK_CYCLES;

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Title
          title="Mis evaluaciones"
          description="Ciclos de evaluación asignados a tu cuadrilla."
          variant="L"
        />

        {cycles.length === 0 && (
          <StateCard
            slotProps={{
              title: {
                title: 'No tenés ciclos asignados',
                description: 'Cuando se abra un ciclo de evaluación, vas a verlo acá.',
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
