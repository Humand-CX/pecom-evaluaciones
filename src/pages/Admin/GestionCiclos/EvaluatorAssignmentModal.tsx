import { useState } from 'react';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import RadioGroup from '@material-hu/mui/RadioGroup';
import FormControlLabel from '@material-hu/mui/FormControlLabel';
import Radio from '@material-hu/mui/Radio';
import Select from '@material-hu/mui/Select';
import MenuItem from '@material-hu/mui/MenuItem';
import FormControl from '@material-hu/mui/FormControl';
import InputLabel from '@material-hu/mui/InputLabel';
import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import { useSegments } from '../../../providers/SegmentsContext';
import { useDimensions } from '../../../providers/DimensionsContext';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';
import { MOCK_EVALUATORS, MOCK_PEOPLE } from '../../Evaluador/MatrizEvaluacion/constants';
import { CSVImportModal } from './CSVImportModal';

type EvaluatorAssignmentModalProps = {
  cycle: Cycle;
  onSuccess: () => void;
};

export const EvaluatorAssignmentModal = ({ cycle, onSuccess }: EvaluatorAssignmentModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();
  const { segments } = useSegments();
  const { dimensions } = useDimensions();

  const [mode, setMode] = useState<'manual' | 'masivo'>('manual');
  const [selectedEvaluator, setSelectedEvaluator] = useState('');
  const [loading, setLoading] = useState(false);

  // Get persons from cycle segments
  const cyclePersons = MOCK_PEOPLE.filter(person =>
    segments
      .filter(seg => cycle.segmentIds.includes(seg.id))
      .some(seg => seg.personIds.includes(person.id))
  );

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
            personId: person.id,
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
          <RadioGroup value={mode} onChange={e => setMode(e.target.value as 'manual' | 'masivo')}>
            <FormControlLabel value="manual" control={<Radio />} label="Manual: Un evaluador para todo" />
            <FormControlLabel value="masivo" control={<Radio />} label="Masivo: Cargar por CSV" />
          </RadioGroup>
        </Stack>
      </CardContainer>

      {mode === 'manual' && (
        <CardContainer padding={16}>
          <Stack sx={{ gap: 2 }}>
            <Typography variant="subtitle2">
              Asignar a {cyclePersons.length} personas en {cycle.dimensionIds.length} dimensiones
            </Typography>

            <FormControl fullWidth>
              <InputLabel>Evaluador*</InputLabel>
              <Select
                value={selectedEvaluator}
                onChange={e => setSelectedEvaluator(e.target.value)}
                label="Evaluador*"
              >
                {MOCK_EVALUATORS.map(evaluator => (
                  <MenuItem key={evaluator.id} value={evaluator.id}>
                    {evaluator.name}
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
