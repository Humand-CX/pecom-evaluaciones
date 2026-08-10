import { useEffect, useState } from 'react';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  status: string;
  managerEmployeeInternalId?: string;
  segmentations?: Array<{
    id: string;
    name: string;
  }>;
}

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/users/me');

        if (!response.ok) {
          if (response.status === 401) {
            setError('Usuario no autenticado');
          } else {
            setError('Error al obtener datos del usuario');
          }
          setUser(null);
          return;
        }

        const userData = await response.json();
        setUser(userData);
        setError(null);
      } catch (err) {
        console.error('Error fetching current user:', err);
        setError('Error de conexión');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading, error };
}
