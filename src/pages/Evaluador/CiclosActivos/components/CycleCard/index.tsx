import Typography from '@material-hu/mui/Typography';
import Stack from '@material-hu/mui/Stack';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import Pills from '@material-hu/components/design-system/Pills';

import { STATUS_CONFIG } from '../../constants';
import type { Cycle } from '../../types';

type CycleCardProps = {
  cycle: Cycle;
  onClick: () => void;
};

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });

export const CycleCard = ({ cycle, onClick }: CycleCardProps) => {
  const status = STATUS_CONFIG[cycle.status];

  return (
    <CardContainer onClick={onClick} padding={16} sx={{ width: 320, cursor: 'pointer' }}>
      <Stack sx={{ gap: 1.5 }}>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="subtitle1">{cycle.name}</Typography>
          <Pills label={status.label} type={status.type} size="small" />
        </Stack>
        <Typography variant="body2" color="text.secondary">
          {cycle.project_name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {formatDate(cycle.start_date)} — {formatDate(cycle.end_date)}
        </Typography>
      </Stack>
    </CardContainer>
  );
};
