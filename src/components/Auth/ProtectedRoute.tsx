import { type ReactNode } from 'react';

import Stack from '@material-hu/mui/Stack';

import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';

import { useAuth } from '../../contexts/Auth';
import { useUser } from '../../providers/UserContext';

import UnauthenticatedPage from './Unauthenticated';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const { isAdmin, isEvaluator } = useUser();

  if (isLoading) {
    return (
      <Stack
        sx={{ justifyContent: 'center', alignItems: 'center', height: '100vh' }}
      >
        <Spinner />
      </Stack>
    );
  }
  if (!user) return <UnauthenticatedPage />;
  if (!isAdmin && !isEvaluator) {
    return (
      <UnauthenticatedPage description="Tu usuario no tiene acceso a esta aplicación. Si creés que es un error, contactá a un administrador." />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;
