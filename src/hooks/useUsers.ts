import { useEffect, useState } from 'react';

export interface User {
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

export function useUsers(instanceId?: string) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const url = instanceId
          ? `/api/users?instanceId=${instanceId}`
          : '/api/users';
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Usuario no autenticado');
          } else {
            setError('Error al obtener lista de usuarios');
          }
          setUsers([]);
          return;
        }

        const usersData = await response.json();
        setUsers(usersData);
        setError(null);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Error de conexión');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [instanceId]);

  return { users, loading, error };
}
