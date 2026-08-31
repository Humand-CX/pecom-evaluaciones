import { createContext, type ReactNode, useContext } from 'react';

import { useAuth } from '../contexts/Auth';

export type UserRole = 'admin' | 'evaluator' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface UserContextType {
  user: AuthUser | null;
  isAdmin: boolean;
  isEvaluator: boolean;
  hasEvaluations: boolean; // True si tiene asignaciones como evaluador
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const { user: authUser, logout: authLogout } = useAuth();

  const isAdmin = authUser?.isAdmin ?? false;
  // TODO: evaluador se define por asignación explícita en Supabase (pendiente de migrar
  // desde localStorage) — hasta entonces, cualquier usuario logueado no-admin pasa como evaluador.
  const isEvaluator = !isAdmin;

  const user: AuthUser | null = authUser
    ? {
        id: authUser.sub,
        email: authUser.email ?? '',
        name: authUser.name ?? '',
        role: isAdmin ? 'admin' : 'evaluator',
      }
    : null;

  const value: UserContextType = {
    user,
    isAdmin,
    isEvaluator,
    hasEvaluations: isEvaluator,
    logout: () => {
      void authLogout();
    },
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser debe ser usado dentro de UserProvider');
  }
  return context;
};
