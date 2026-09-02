import { type ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  IconChartBar,
  IconClipboardList,
  IconRuler,
  IconSettings,
} from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';

import Button from '@material-hu/components/design-system/Buttons/Button';
import HomeHeader from '@material-hu/components/design-system/Header/Home';
import Sidebar from '@material-hu/components/design-system/Sidebar';
import {
  SIDEBAR_COLLAPSED_WIDTH,
  SIDEBAR_WIDTH,
} from '@material-hu/components/design-system/Sidebar/constants';
import { type NavSectionProps } from '@material-hu/components/design-system/Sidebar/types';

import humandLogo from '../../assets/humand.svg';
import { useAuth } from '../../contexts/Auth';
import { useUser } from '../../providers/UserContext';

const EVALUATOR_ITEMS: NavSectionProps['items'] = [
  {
    key: 'ciclos',
    title: 'Mis evaluaciones',
    path: '/evaluador/ciclos',
    icon: <IconClipboardList />,
  },
];

const ADMIN_ITEMS: NavSectionProps['items'] = [
  {
    key: 'gestion-ciclos',
    title: 'Gestión de ciclos',
    path: '/admin/ciclos',
    icon: <IconSettings />,
  },
  {
    key: 'dimensiones',
    title: 'Banco de dimensiones',
    path: '/admin/dimensiones',
    icon: <IconRuler />,
  },
  {
    key: 'resultados',
    title: 'Resultados',
    path: '/admin/resultados',
    icon: <IconChartBar />,
  },
];

type DashboardLayoutProps = {
  children: ReactNode;
};

export const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { pathname } = useLocation();
  const { logout } = useAuth();
  const { isAdmin } = useUser();

  const sidebarWidth = isCollapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;
  const sections: NavSectionProps[] = [
    {
      key: 'main',
      title: 'Main',
      items: isAdmin
        ? [...EVALUATOR_ITEMS, ...ADMIN_ITEMS]
        : EVALUATOR_ITEMS,
    },
  ];

  return (
    <Stack sx={{ minHeight: '100vh' }}>
      <HomeHeader
        onOpenMenu={() => setIsCollapsed(prev => !prev)}
        logoSrc={humandLogo}
        logoAlt="Humand"
        hideNotificationsButton
        hideSupportButton
        isAdmin={isAdmin}
        avatarProps={{ text: 'U' }}
        avatarPopoverContent={
          <Button
            onClick={() => logout()}
            variant="text"
          >
            Cerrar sesión
          </Button>
        }
        onOpenLanguageMenu={() => {}}
        supportButtonProps={{ href: '#' }}
        sx={{ position: 'sticky' }}
      />
      <Stack sx={{ flexDirection: 'row' }}>
        <Sidebar
          isCollapsed={isCollapsed}
          pathname={pathname}
          sections={sections}
          openMenu={() => setIsCollapsed(false)}
          sx={{
            position: 'sticky',
            top: '70px',
            bottom: 0,
            left: 0,
            height: 'calc(100vh - 70px)',
          }}
        />
        <Stack
          component="main"
          sx={{
            flex: 1,
            pt: 5,
            pb: 5,
            px: 12,
            maxWidth: `calc(100% - ${sidebarWidth}px)`,
            bgcolor: 'new.background.layout.default',
            minHeight: 'calc(100vh - 70px)',
          }}
        >
          {children}
        </Stack>
      </Stack>
    </Stack>
  );
};
