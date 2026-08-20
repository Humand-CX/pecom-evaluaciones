import { IconAlertTriangle } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';

import StateCard from '@material-hu/components/design-system/StateCard';

import BlankLayout from '../../layouts/BlankLayout';

const HUMAND_APP_URL =
  import.meta.env.VITE_HUMAND_APP_URL ?? 'https://app.humand.co';

const AuthErrorPage = () => {
  return (
    <BlankLayout>
      <Stack sx={{ padding: 2 }}>
        <StateCard
          title="Algo no funcionó"
          description="No pudimos completar el inicio de sesión. Por favor, volvé a intentarlo desde Humand."
          variant="primary"
          icon={IconAlertTriangle}
          primaryAction={{
            label: 'Volver a Humand',
            onClick: () => {
              window.location.href = HUMAND_APP_URL;
            },
          }}
        />
      </Stack>
    </BlankLayout>
  );
};

export default AuthErrorPage;
