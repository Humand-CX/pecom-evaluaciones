import { useState } from 'react';

import Autocomplete from '@material-hu/mui/Autocomplete';
import FormControlLabel from '@material-hu/mui/FormControlLabel';
import Radio from '@material-hu/mui/Radio';
import RadioGroup from '@material-hu/mui/RadioGroup';
import Stack from '@material-hu/mui/Stack';
import TextField from '@material-hu/mui/TextField';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import {
  type HumandUser,
  useHumandUsers,
  useSegmentMembers,
} from '../../../hooks/useHumandSegmentation';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

import { CSVImportModal } from './CSVImportModal';

type EvaluatorAssignmentModalProps = {
  cycle: Cycle;
  onSuccess: () => void;
};

const fullName = (u: HumandUser) => `${u.firstName} ${u.lastName}`.trim();

export const EvaluatorAssignmentModal = ({
  cycle,
  onSuccess,
}: EvaluatorAssignmentModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();

  const [mode, setMode] = useState<'manual' | 'masivo'>('manual');
  const [selectedEvaluator, setSelectedEvaluator] = useState<HumandUser | null>(
    null,
  );
  const [evaluatorSearch, setEvaluatorSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const { members: cyclePersons } = useSegmentMembers(cycle.segmentIds);
  const { users: evaluatorOptions, loading: evaluatorsLoading } =
    useHumandUsers(evaluatorSearch);

  const handleManualAssign = async () => {
    if (!selectedEvaluator) return;

    setLoading(true);
    try {
      const assignments = [];

      // Create assignment for each person x dimension combination
      cyclePersons.forEach(person => {
        cycle.dimensionIds.forEach(dimensionId => {
          assignments.push({
            id: `${cycle.id}-${dimensionId}-${selectedEvaluator.id}-${person.id}`,
            cycleId: cycle.id,
            dimensionId,
            evaluatorId: String(selectedEvaluator.id),
            personId: String(person.id),
          });
        });
      });

      addBulkAssignments(assignments);
      onSuccess();
    } finally {
      setLoading(false);
    }
  };

  if (mode === 'masivo') {
    return (
      <CSVImportModal
        cycle={cycle}
        onImportSuccess={onSuccess}
      />
    );
  }

  return (
    <Stack sx={{ gap: 3 }}>
      <Typography variant="body2">
        Seleccioná cómo asignar evaluadores para este ciclo
      </Typography>

      <CardContainer padding={16}>
        <Stack sx={{ gap: 2 }}>
          <Typography variant="subtitle2">Modo de asignación</Typography>
          <RadioGroup
            value={mode}
            onChange={e => setMode(e.target.value as 'manual' | 'masivo')}
          >
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Manual: Un evaluador para todo"
            />
            <FormControlLabel
              value="masivo"
              control={<Radio />}
              label="Masivo: Cargar por CSV"
            />
          </RadioGroup>
        </Stack>
      </CardContainer>

      {mode === 'manual' && (
        <CardContainer padding={16}>
          <Stack sx={{ gap: 2 }}>
            <Typography variant="subtitle2">
              Asignar a {cyclePersons.length} personas en{' '}
              {cycle.dimensionIds.length} dimensiones
            </Typography>

            <Autocomplete
              options={evaluatorOptions}
              getOptionLabel={fullName}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              value={selectedEvaluator}
              onChange={(_, value) => setSelectedEvaluator(value)}
              inputValue={evaluatorSearch}
              onInputChange={(_, value) => setEvaluatorSearch(value)}
              loading={evaluatorsLoading}
              renderInput={params => (
                <TextField
                  {...params}
                  label="Evaluador*"
                  placeholder="Nombre, apellido o email"
                />
              )}
              fullWidth
            />

            <Button
              variant="primary"
              disabled={!selectedEvaluator || loading}
              onClick={handleManualAssign}
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </Stack>
        </CardContainer>
      )}
    </Stack>
  );
};
