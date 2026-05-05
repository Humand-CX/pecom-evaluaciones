import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Navigate, useNavigate } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import Alert from '@material-hu/components/design-system/Alert';
import Button from '@material-hu/components/design-system/Buttons/Button';
import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';
import FormInputPassword from '@material-hu/components/design-system/Inputs/Password/form';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';

import loginBanner from '../../../assets/login-banner.png';
import humandLogo from '../../../assets/humand.svg';
import { useAuth } from '../../../providers/AuthContext';
import { loginSchema, type LoginInput } from './schema';

export default function LoginPage() {
  const { user, loading, login } = useAuth();
  const navigate = useNavigate();
  const [submitError, setSubmitError] = useState<string | null>(null);

  const methods = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { employeeInternalId: '', password: '' },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  if (loading) return <Spinner />;
  if (user) return <Navigate to="/" replace />;

  const onSubmit = handleSubmit(async ({ employeeInternalId, password }) => {
    setSubmitError(null);
    try {
      await login(employeeInternalId, password);
      navigate('/', { replace: true });
    } catch (err) {
      setSubmitError((err as Error).message);
    }
  });

  return (
    <Stack sx={{ minHeight: '100vh', flexDirection: { xs: 'column', md: 'row' } }}>
      <Stack
        sx={{
          display: { xs: 'none', md: 'flex' },
          width: '50%',
          backgroundImage: `url(${loginBanner})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Stack sx={{ flex: 1, alignItems: 'center', justifyContent: 'center', p: 4 }}>
        <Stack component="form" noValidate onSubmit={onSubmit} sx={{ width: 360, gap: 3 }}>
          <img src={humandLogo} alt="Evaluaciones Pecom" style={{ width: 120 }} />

          <Typography variant="h5">Iniciar sesión</Typography>

          {submitError && <Alert severity="error" title={submitError} />}

          <FormProvider {...methods}>
            <Stack sx={{ gap: 2 }}>
              <FormInputClassic
                name="employeeInternalId"
                inputProps={{
                  label: 'Usuario',
                  autoFocus: true,
                  hasCounter: false,
                  autoComplete: 'username',
                }}
                rules={{}}
              />
              <FormInputPassword
                name="password"
                inputProps={{
                  label: 'Contraseña',
                  autoComplete: 'current-password',
                }}
                rules={{}}
              />
            </Stack>
          </FormProvider>

          <Button
            type="submit"
            variant="primary"
            size="large"
            fullWidth
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            Ingresar
          </Button>
        </Stack>
      </Stack>
    </Stack>
  );
}
