import { createContext, type ReactNode, useContext, useState } from 'react';

export type UserRole = 'admin' | 'evaluator' | 'viewer';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

interface UserContextType {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  isAdmin: boolean;
  isEvaluator: boolean;
  hasEvaluations: boolean; // True si tiene asignaciones como evaluador
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  // Por ahora usamos usuario hardcodeado para testing
  // Cuando llegue la API de Humand, traeremos el usuario real
  const [user, setUser] = useState<AuthUser | null>({
    id: 'user-1',
    email: 'sofia.gonzalez@pecomenergia.com.ar',
    name: 'Sofia González',
    role: 'admin', // Cambiar a 'evaluator' para testear evaluadores
  });

  const logout = () => {
    setUser(null);
  };

  // Por ahora asumimos que los evaluadores siempre tienen evaluaciones
  // Cuando conectemos Humand, verificaremos si tienen asignaciones
  const hasEvaluations = user?.role === 'evaluator';

  const value: UserContextType = {
    user,
    setUser,
    isAdmin: user?.role === 'admin',
    isEvaluator: user?.role === 'evaluator',
    hasEvaluations,
    logout,
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
