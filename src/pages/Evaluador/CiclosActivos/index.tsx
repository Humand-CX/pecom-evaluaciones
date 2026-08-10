import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

import Stack from '@material-hu/mui/Stack';
import Title from '@material-hu/components/design-system/Title';
import StateCard from '@material-hu/components/composed-components/StateCard';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';
import { IconClipboardList } from '@material-hu/icons/tabler';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { MOCK_CYCLES } from './constants';
import { CycleCard } from './components/CycleCard';
import { useCurrentUser } from '../../../hooks/useCurrentUser';

interface Cycle {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'pending' | 'completed';
  startDate?: string;
  endDate?: string;
}

export default function CiclosActivosPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const [cycles, setCycles] = useState<Cycle[]>(MOCK_CYCLES);
  const [cyclesLoading, setCyclesLoading] = useState(false);

  useEffect(() => {
    // TODO: Obtener ciclos asignados del usuario desde Supabase
    // Por ahora usamos MOCK_CYCLES
    setCyclesLoading(true);
    // Simulamos una pequeña demora
    setTimeout(() => {
      setCyclesLoading(false);
      // setCycles(datosDesdeSupabase);
    }, 500);
  }, [user?.userId]);

  if (userLoading || cyclesLoading) {
    return (
      <DashboardLayout>
        <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
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

        {userError && (
          <StateCard
            slotProps={{
              title: {
                title: 'Error',
                description: userError,
                variant: 'M',
              },
              avatar: {
                Icon: IconClipboardList,
                color: 'error',
              },
            }}
          />
        )}

        {cycles.length === 0 && !userError && (
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
