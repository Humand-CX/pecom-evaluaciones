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
        const state = searchParams.get('state');
        const storedState = localStorage.getItem('oauth_state');

        // Validate state
        if (!state || state !== storedState) {
          throw new Error('Invalid state parameter');
        }

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
          id: humandUser.internalId,
          email: humandUser.email,
          name: humandUser.fullName,
          role: determineRole(humandUser.roles),
        });

        // Redirect to dashboard
        navigate('/admin/ciclos');
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
 * Determine user role based on Humand roles
 * This logic should match your authorization requirements
 */
function determineRole(humandRoles?: string[]): 'admin' | 'evaluator' | 'viewer' {
  if (!humandRoles) return 'viewer';

  // Customize this logic based on Humand roles
  if (humandRoles.includes('admin') || humandRoles.includes('pecom_admin')) {
    return 'admin';
  }
  if (humandRoles.includes('evaluator') || humandRoles.includes('pecom_evaluator')) {
    return 'evaluator';
  }

  return 'viewer';
}

export default AuthCallbackPage;
