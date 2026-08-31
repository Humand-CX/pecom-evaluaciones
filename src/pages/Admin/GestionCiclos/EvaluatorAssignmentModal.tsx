import { useState } from 'react';

import FormControl from '@material-hu/mui/FormControl';
import FormControlLabel from '@material-hu/mui/FormControlLabel';
import InputLabel from '@material-hu/mui/InputLabel';
import MenuItem from '@material-hu/mui/MenuItem';
import Radio from '@material-hu/mui/Radio';
import RadioGroup from '@material-hu/mui/RadioGroup';
import Select from '@material-hu/mui/Select';
import Stack from '@material-hu/mui/Stack';
import TextField from '@material-hu/mui/TextField';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import {
  useHumandUsers,
  useSegmentMembers,
} from '../../../hooks/useHumandSegmentation';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

import { CSVImportModal } from './CSVImportModal';

type EvaluatorAssignmentModalProps = {
  cycle: Cycle;
  onSuccess: () => void;
};

const fullName = (u: { firstName: string; lastName: string }) =>
  `${u.firstName} ${u.lastName}`.trim();

export const EvaluatorAssignmentModal = ({
  cycle,
  onSuccess,
}: EvaluatorAssignmentModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();

  const [mode, setMode] = useState<'manual' | 'masivo'>('manual');
  const [selectedEvaluator, setSelectedEvaluator] = useState('');
  const [evaluatorSearch, setEvaluatorSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const { members: cyclePersons } = useSegmentMembers(cycle.segmentIds);
  const { users: evaluatorOptions } = useHumandUsers(evaluatorSearch);

  const handleManualAssign = async () => {
    if (!selectedEvaluator) return;

    setLoading(true);
    try {
      const assignments = [];

      // Create assignment for each person x dimension combination
      cyclePersons.forEach(person => {
        cycle.dimensionIds.forEach(dimensionId => {
          assignments.push({
            id: `${cycle.id}-${dimensionId}-${selectedEvaluator}-${person.id}`,
            cycleId: cycle.id,
            dimensionId,
            evaluatorId: selectedEvaluator,
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
    return <CSVImportModal onImportSuccess={onSuccess} />;
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

            <TextField
              label="Buscar evaluador"
              placeholder="Nombre, apellido o email"
              value={evaluatorSearch}
              onChange={e => setEvaluatorSearch(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel>Evaluador*</InputLabel>
              <Select
                value={selectedEvaluator}
                onChange={e => setSelectedEvaluator(e.target.value)}
                label="Evaluador*"
              >
                {evaluatorOptions.map(evaluator => (
                  <MenuItem
                    key={evaluator.id}
                    value={String(evaluator.id)}
                  >
                    {fullName(evaluator)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

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
