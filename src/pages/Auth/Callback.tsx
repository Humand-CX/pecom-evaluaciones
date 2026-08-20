import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '../../providers/UserContext';
import { humandUsersService, humandOAuthService } from '../../services/humand';
import Stack from '@material-hu/mui/Stack';
import CircularProgress from '@material-hu/mui/CircularProgress';
import Typography from '@material-hu/mui/Typography';

export const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useUser();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code');

        if (!code) {
          throw new Error('No authorization code received');
        }

        // Exchange code for token via backend endpoint
        const tokenResponse = await fetch('/api/auth/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code }),
        });

        if (!tokenResponse.ok) {
          throw new Error('Failed to exchange code for token');
        }

        const { accessToken, refreshToken, expiresIn } = await tokenResponse.json();

        // Store tokens
        humandOAuthService.storeTokens(accessToken, refreshToken, expiresIn);

        // Get current user info
        const humandUser = await humandUsersService.getCurrentUser(accessToken);

        // Update UserContext with real user data
        setUser({
          id: humandUser.employeeInternalId,
          email: humandUser.email,
          name: humandUser.fullName,
          role: determineRole(humandUser.email),
        });

        // Redirect to dashboard
        navigate('/evaluador/ciclos');
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Authentication failed');
        // Redirect to login after 3 seconds
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, setUser, navigate]);

  if (error) {
    return (
      <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
        <Typography variant="h6" sx={{ color: 'error.main' }}>
          {error}
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Redirigiendo a login...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack sx={{ alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: 2 }}>
      <CircularProgress />
      <Typography variant="body1">Autenticando...</Typography>
    </Stack>
  );
};

/**
 * Determine user role based on email
 * Hardcoded admins for now - in production, fetch from Supabase users table
 */
function determineRole(email: string): 'admin' | 'evaluator' | 'viewer' {
  const adminEmails = [
    'sofia.gonzalez@pecomenergia.com.ar',
    'ana.cevnia@pecomenergia.com.ar',
  ];

  if (adminEmails.includes(email)) {
    return 'admin';
  }

  // TODO: Fetch from Supabase users table to check if admin
  return 'evaluator';
}

export default AuthCallbackPage;
