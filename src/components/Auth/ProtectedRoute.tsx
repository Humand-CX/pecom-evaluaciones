import { type ReactNode } from 'react';

import Stack from '@material-hu/mui/Stack';

import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';

import { useAuth } from '../../contexts/Auth';

import UnauthenticatedPage from './Unauthenticated';

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();

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

  return <>{children}</>;
};

export default ProtectedRoute;
