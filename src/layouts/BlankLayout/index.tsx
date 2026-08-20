import { type ReactNode } from 'react';

import Stack from '@material-hu/mui/Stack';

interface BlankLayoutProps {
  children: ReactNode;
}

const BlankLayout = ({ children }: BlankLayoutProps) => {
  return (
    <Stack
      sx={{
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
      }}
    >
      {children}
    </Stack>
  );
};

export default BlankLayout;
