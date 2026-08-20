import Card from '@material-hu/mui/Card';
import CardContent from '@material-hu/mui/CardContent';
import CardActionArea from '@material-hu/mui/CardActionArea';
import Typography from '@material-hu/mui/Typography';
import Stack from '@material-hu/mui/Stack';

interface CycleCardProps {
  cycle: {
    id: string;
    name: string;
    description?: string;
    status?: string;
    [key: string]: any;
  };
  onClick: () => void;
}

export const CycleCard: React.FC<CycleCardProps> = ({ cycle, onClick }) => {
  return (
    <Card sx={{ width: 300 }}>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="h6" component="div">
              {cycle.name}
            </Typography>
            {cycle.description && (
              <Typography variant="body2" color="text.secondary">
                {cycle.description}
              </Typography>
            )}
            {cycle.status && (
              <Typography variant="caption" color="text.secondary">
                Estado: {cycle.status}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
};
