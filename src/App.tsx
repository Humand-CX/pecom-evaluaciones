import { lazy, type ReactNode, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@material-hu/mui/styles';
import { createHuGoTheme } from '@material-hu/theme/hugo';

import { DialogLayerProvider } from '@material-hu/components/layers/Dialogs';
import { DrawerLayerProvider } from '@material-hu/components/layers/Drawers';
import { MenuLayerProvider } from '@material-hu/components/layers/Menus';

import { HomePage } from './pages/Home';
import { AuthProvider, useAuth } from './providers/AuthContext';
import { DimensionsProvider } from './providers/DimensionsContext';
import { EvaluatorAssignmentsProvider } from './providers/EvaluatorAssignmentsContext';
import './i18n';

const LoginPage = lazy(() => import('./pages/Auth/Login'));
const CiclosActivosPage = lazy(() => import('./pages/Evaluador/CiclosActivos'));
const MatrizEvaluacionPage = lazy(() => import('./pages/Evaluador/MatrizEvaluacion'));
const GestionCiclosPage = lazy(() => import('./pages/Admin/GestionCiclos'));
const DimensionesPage = lazy(() => import('./pages/Admin/Dimensiones'));
const ResultadosPage = lazy(() => import('./pages/Admin/Resultados'));

const theme = createHuGoTheme();
const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (import.meta.env.DEV) return <>{children}</>;
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <MenuLayerProvider>
          <DialogLayerProvider>
            <DrawerLayerProvider>
              <BrowserRouter>
                <EvaluatorAssignmentsProvider>
                  <DimensionsProvider>
                    <AuthProvider>
                    <Suspense fallback={null}>
                      <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <HomePage />
                            </ProtectedRoute>
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
                            <ProtectedRoute>
                              <GestionCiclosPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/dimensiones"
                          element={
                            <ProtectedRoute>
                              <DimensionesPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/resultados"
                          element={
                            <ProtectedRoute>
                              <ResultadosPage />
                            </ProtectedRoute>
                          }
                        />
                      </Routes>
                    </Suspense>
                    </AuthProvider>
                  </DimensionsProvider>
                </EvaluatorAssignmentsProvider>
              </BrowserRouter>
            </DrawerLayerProvider>
          </DialogLayerProvider>
        </MenuLayerProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
