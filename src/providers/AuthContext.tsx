import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type AuthUser = {
  employeeInternalId: string;
};

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (employeeInternalId: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = 'pecom-auth-user';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) setUser(JSON.parse(stored) as AuthUser);
    } catch {}
    setLoading(false);
  }, []);

  const login = async (employeeInternalId: string, password: string) => {
    if (!employeeInternalId || !password) {
      throw new Error('Usuario y contraseña son requeridos');
    }
    const authUser: AuthUser = { employeeInternalId };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(authUser));
    setUser(authUser);
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
