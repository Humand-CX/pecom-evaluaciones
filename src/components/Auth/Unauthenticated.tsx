import { IconLock } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';

import StateCard from '@material-hu/components/design-system/StateCard';

import BlankLayout from '../../layouts/BlankLayout';

const HUMAND_APP_URL =
  import.meta.env.VITE_HUMAND_APP_URL ?? 'https://app.humand.co';

const UnauthenticatedPage = () => {
  return (
    <BlankLayout>
      <Stack sx={{ padding: 2 }}>
        <StateCard
          title="Acceso restringido"
          description="Para acceder a esta aplicación debés iniciar sesión desde Humand."
          variant="primary"
          icon={IconLock}
          primaryAction={{
            label: 'Ir a Humand',
            onClick: () => {
              window.location.href = HUMAND_APP_URL;
            },
          }}
        />
      </Stack>
    </BlankLayout>
  );
};

export default UnauthenticatedPage;
