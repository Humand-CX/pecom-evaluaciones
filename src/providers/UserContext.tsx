import { createContext, type ReactNode, useContext } from 'react';

import { useAuth } from '../contexts/Auth';

export type UserRole = 'admin' | 'evaluator' | 'viewer';

export interface AuthUser {
  id: string;
  humandUserId: number | null;
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
  const isEvaluator = authUser?.isEvaluator ?? false;

  const user: AuthUser | null = authUser
    ? {
        id: authUser.sub,
        humandUserId: authUser.humandUserId,
        email: authUser.email ?? '',
        name: authUser.name ?? '',
        role: isAdmin ? 'admin' : isEvaluator ? 'evaluator' : 'viewer',
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
