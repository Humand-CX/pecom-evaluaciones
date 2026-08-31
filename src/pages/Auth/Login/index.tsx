import { Navigate } from 'react-router-dom';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';

import humandLogo from '../../../assets/humand.svg';
import loginBanner from '../../../assets/login-banner.png';
import { useAuth } from '../../../contexts/Auth';
import { humandOAuthService } from '../../../services/humand';

export default function LoginPage() {
  const { user, isLoading: loading } = useAuth();

  if (loading) return <Spinner />;
  if (user)
    return (
      <Navigate
        to="/"
        replace
      />
    );

  const handleHumandLogin = () => {
    const loginUrl = humandOAuthService.getLoginUrl();
    window.location.href = loginUrl;
  };

  return (
    <Stack
      sx={{ minHeight: '100vh', flexDirection: { xs: 'column', md: 'row' } }}
    >
      <Stack
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '50%',
          backgroundImage: `url(${loginBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Stack
        sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', p: 4 }}
      >
        <Stack sx={{ width: 360, gap: 3 }}>
          <img
            src={humandLogo}
            alt="Evaluaciones Pecom"
            style={{ width: 120 }}
          />

          <Typography variant="h5">Iniciar sesión</Typography>

          <Typography
            variant="body2"
            sx={{ color: 'text.secondary' }}
          >
            Inicia sesión con tu cuenta de Humand para acceder a las
            evaluaciones.
          </Typography>

          <Button
            variant="primary"
            size="large"
            fullWidth
            onClick={handleHumandLogin}
          >
            Continuar con Humand
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
