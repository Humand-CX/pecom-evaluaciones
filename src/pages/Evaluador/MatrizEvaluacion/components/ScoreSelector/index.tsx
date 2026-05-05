import { useTheme } from '@material-hu/mui/styles';
import Stack from '@material-hu/mui/Stack';

import Button from '@material-hu/components/design-system/Buttons/Button';

import { type ScoreValue } from '../../types';
import { SCORE_LABELS } from '../../constants';

type ScoreSelectorProps = {
  value: ScoreValue | null;
  onChange: (score: ScoreValue) => void;
  disabled?: boolean;
};

const SCORES: ScoreValue[] = [1, 2, 3, 4, 5];

export const ScoreSelector = ({ value, onChange, disabled = false }: ScoreSelectorProps) => {
  const theme = useTheme();

  return (
    <Stack
      sx={{ flexDirection: 'row', gap: 0.5, flexShrink: 0 }}
      title={value != null ? SCORE_LABELS[value] : undefined}
    >
      {SCORES.map(score => {
        const isSelected = value === score;
        const isNocivo = score === 1 && isSelected;

        return (
          <Button
            key={score}
            variant={isSelected ? 'primary' : 'secondary'}
            size="small"
            onClick={() => onChange(score)}
            disabled={disabled}
            sx={
              isNocivo
                ? {
                    bgcolor: theme.palette.error.main,
                    borderColor: theme.palette.error.main,
                    '&:hover': { bgcolor: theme.palette.error.dark },
                  }
                : undefined
            }
          >
            {score}
          </Button>
        );
      })}
    </Stack>
  );
};
