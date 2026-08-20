// @humand-auth: janus-user
import { lazy, type ReactNode, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@material-hu/mui/styles';
import { createHuGoTheme } from '@material-hu/theme/hugo';

import { DialogLayerProvider } from '@material-hu/components/layers/Dialogs';
import { DrawerLayerProvider } from '@material-hu/components/layers/Drawers';
import { MenuLayerProvider } from '@material-hu/components/layers/Menus';

import { useAuth } from './providers/AuthContext';
import { DimensionsProvider } from './providers/DimensionsContext';
import { EvaluatorAssignmentsProvider } from './providers/EvaluatorAssignmentsContext';
import { SegmentsProvider } from './providers/SegmentsContext';
import { UserProvider, useUser } from './providers/UserContext';
import './i18n';
import AuthProvider from "./contexts/Auth";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AuthErrorPage from "./components/Auth/AuthError";

const LoginPage = lazy(() => import('./pages/Auth/Login'));
const AuthCallbackPage = lazy(() => import('./pages/Auth/Callback'));
const CiclosActivosPage = lazy(() => import('./pages/Evaluador/CiclosActivos'));
const MatrizEvaluacionPage = lazy(
  () => import('./pages/Evaluador/MatrizEvaluacion'),
);
const GestionCiclosPage = lazy(() => import('./pages/Admin/GestionCiclos'));
const DimensionesPage = lazy(() => import('./pages/Admin/Dimensiones'));
const ResultadosPage = lazy(() => import('./pages/Admin/Resultados'));

const theme = createHuGoTheme();
const queryClient = new QueryClient();

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { isAdmin } = useUser();
  if (import.meta.env.DEV) return <>{children}</>;
  if (loading) return null;
  if (!user)
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  if (!isAdmin)
    return (
      <Navigate
        to="/evaluador/ciclos"
        replace
      />
    );
  return <>{children}</>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <UserProvider>
          <DimensionsProvider>
            <SegmentsProvider>
              <EvaluatorAssignmentsProvider>
                <MenuLayerProvider>
                  <DialogLayerProvider>
                    <DrawerLayerProvider>
                      <BrowserRouter>
                        <AuthProvider>
                          <Suspense fallback={null}>
                            <Routes>
                              <Route
                                path="/login"
                                element={<ProtectedRoute><LoginPage /></ProtectedRoute>}
                              />
                              <Route
                                path="/auth/callback"
                                element={<ProtectedRoute><AuthCallbackPage /></ProtectedRoute>}
                              />
                              <Route
                                path="/"
                                element={
                                  <ProtectedRoute><Navigate
                                                                        to="/evaluador/ciclos"
                                                                        replace
                                                                      /></ProtectedRoute>
                                }
                              />
                              <Route
                                path="/evaluador/ciclos"
                                element={
                                  <ProtectedRoute>
                                    <CiclosActivosPage />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/evaluador/matriz/:cycleId"
                                element={
                                  <ProtectedRoute>
                                    <MatrizEvaluacionPage />
                                  </ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin/ciclos"
                                element={
                                  <ProtectedRoute><ProtectedAdminRoute>
                                                                        <GestionCiclosPage />
                                                                      </ProtectedAdminRoute></ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin/dimensiones"
                                element={
                                  <ProtectedRoute><ProtectedAdminRoute>
                                                                        <DimensionesPage />
                                                                      </ProtectedAdminRoute></ProtectedRoute>
                                }
                              />
                              <Route
                                path="/admin/resultados"
                                element={
                                  <ProtectedRoute><ProtectedAdminRoute>
                                                                        <ResultadosPage />
                                                                      </ProtectedAdminRoute></ProtectedRoute>
                                }
                              />
                            <Route path="/error" element={<AuthErrorPage />} />
        </Routes>
                          </Suspense>
                        </AuthProvider>
                      </BrowserRouter>
                    </DrawerLayerProvider>
                  </DialogLayerProvider>
                </MenuLayerProvider>
              </EvaluatorAssignmentsProvider>
            </SegmentsProvider>
          </DimensionsProvider>
        </UserProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
