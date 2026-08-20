import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { IconClipboardList } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';

import StateCard from '@material-hu/components/composed-components/StateCard';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';
import Title from '@material-hu/components/design-system/Title';

import { useCurrentUser } from '../../../hooks/useCurrentUser';
import { DashboardLayout } from '../../../layouts/DashboardLayout';

import { CycleCard } from './components/CycleCard';
import { MOCK_CYCLES } from './constants';

interface Cycle {
  id: string;
  name: string;
  description?: string;
  status: string;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

export default function CiclosActivosPage() {
  const navigate = useNavigate();
  const { user, loading: userLoading, error: userError } = useCurrentUser();
  const [cycles] = useState<Cycle[]>(MOCK_CYCLES);
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
  }, []);

  if (userLoading || cyclesLoading) {
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
