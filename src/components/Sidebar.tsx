import { useNavigate } from 'react-router-dom';
import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import Button from '@material-hu/components/design-system/Buttons/Button';
import { useUser } from '../providers/UserContext';
import {
  IconClipboardList,
  IconSettings,
  IconChartBar,
  IconLogout,
} from '@material-hu/icons/tabler';

export const Sidebar = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isEvaluator, hasEvaluations, logout } = useUser();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Stack sx={{
      width: '100%',
      gap: 2,
      p: 2,
      borderRight: '1px solid',
      borderColor: 'divider',
      minHeight: '100vh',
    }}>
      {/* Header */}
      <Stack sx={{ gap: 0.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {user?.name}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
          {isAdmin ? 'Administrador' : isEvaluator ? 'Evaluador' : 'Evaluado'}
        </Typography>
      </Stack>

      {/* Menu */}
      <Stack sx={{ gap: 1, flex: 1 }}>
        {/* Mis Evaluaciones - Solo si tiene asignaciones como evaluador */}
        {hasEvaluations && (
          <Button
            variant="text"
            size="medium"
            startIcon={<IconClipboardList size={18} />}
            onClick={() => navigate('/evaluador/ciclos')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Mis evaluaciones
          </Button>
        )}

        {/* Admin Menu */}
        {isAdmin && (
          <>
            <Button
              variant="text"
              size="medium"
              startIcon={<IconSettings size={18} />}
              onClick={() => navigate('/admin/ciclos')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Gestión de ciclos
            </Button>

            <Button
              variant="text"
              size="medium"
              startIcon={<IconSettings size={18} />}
              onClick={() => navigate('/admin/dimensiones')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Banco de dimensiones
            </Button>

            <Button
              variant="text"
              size="medium"
              startIcon={<IconChartBar size={18} />}
              onClick={() => navigate('/admin/resultados')}
              sx={{ justifyContent: 'flex-start' }}
            >
              Resultados
            </Button>
          </>
        )}

        {/* Mis Resultados - Solo evaluadores con asignaciones */}
        {isEvaluator && hasEvaluations && (
          <Button
            variant="text"
            size="medium"
            startIcon={<IconChartBar size={18} />}
            onClick={() => navigate('/admin/resultados')}
            sx={{ justifyContent: 'flex-start' }}
          >
            Mis resultados
          </Button>
        )}
      </Stack>

      {/* Logout */}
      <Button
        variant="text"
        size="medium"
        startIcon={<IconLogout size={18} />}
        onClick={handleLogout}
        sx={{ justifyContent: 'flex-start', color: 'error.main' }}
      >
        Cerrar sesión
      </Button>
    </Stack>
  );
};
