import { useEffect, useState } from 'react';

import Alert from '@material-hu/mui/Alert';
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
  useCyclePeople,
  useDirectBosses,
  useHumandUsers,
} from '../../../hooks/useHumandSegmentation';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

import { CSVImportModal } from './CSVImportModal';

type EvaluatorAssignmentModalProps = {
  cycle: Cycle;
  onSuccess: () => void;
};

const fullName = (u: HumandUser) => `${u.firstName} ${u.lastName}`.trim();

type AssignmentMode = 'manual' | 'individual' | 'masivo';

const PersonEvaluatorRow = ({
  person,
  boss,
  value,
  onChange,
}: {
  person: HumandUser;
  boss: HumandUser | null;
  value: HumandUser | null;
  onChange: (user: HumandUser | null) => void;
}) => {
  const [search, setSearch] = useState('');
  const { users: options, loading } = useHumandUsers(search);

  return (
    <Stack
      sx={{
        flexDirection: 'row',
        gap: 2,
        alignItems: 'center',
        py: 1,
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2">{fullName(person)}</Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          {boss ? `Jefe directo: ${fullName(boss)}` : 'Sin jefe directo cargado'}
        </Typography>
      </Stack>
      <Stack sx={{ flex: 1, minWidth: 0 }}>
        <Autocomplete
          size="small"
          options={options}
          getOptionLabel={fullName}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          value={value}
          onChange={(_, val) => onChange(val)}
          inputValue={search}
          onInputChange={(_, val) => setSearch(val)}
          loading={loading}
          renderInput={params => (
            <TextField
              {...params}
              placeholder="Evaluador"
            />
          )}
          fullWidth
        />
      </Stack>
    </Stack>
  );
};

export const EvaluatorAssignmentModal = ({
  cycle,
  onSuccess,
}: EvaluatorAssignmentModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();

  const [mode, setMode] = useState<AssignmentMode>('manual');
  const [selectedEvaluator, setSelectedEvaluator] = useState<HumandUser | null>(
    null,
  );
  const [evaluatorSearch, setEvaluatorSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members: cyclePersons } = useCyclePeople(
    cycle.segmentIds,
    cycle.addedPersonIds,
    cycle.excludedPersonIds,
  );
  const { users: evaluatorOptions, loading: evaluatorsLoading } =
    useHumandUsers(evaluatorSearch);

  const personIds = cyclePersons.map(p => String(p.id));
  const { bosses, loading: bossesLoading } = useDirectBosses(personIds);
  const [individualSelection, setIndividualSelection] = useState<
    Record<string, HumandUser | null>
  >({});

  // Precarga cada persona con su jefe directo como sugerencia editable
  useEffect(() => {
    if (bossesLoading) return;
    setIndividualSelection(prev => {
      const next = { ...prev };
      let changed = false;
      personIds.forEach(pid => {
        if (!(pid in next)) {
          next[pid] = bosses[pid] ?? null;
          changed = true;
        }
      });
      return changed ? next : prev;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [personIds.join(','), bossesLoading]);

  const handleManualAssign = async () => {
    if (!selectedEvaluator) return;

    setLoading(true);
    setError(null);
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

      await addBulkAssignments(assignments);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la asignación.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleUseDirectBossForAll = () => {
    setIndividualSelection(prev => {
      const next = { ...prev };
      personIds.forEach(pid => {
        next[pid] = bosses[pid] ?? null;
      });
      return next;
    });
  };

  const individualAssignedCount = personIds.filter(
    pid => individualSelection[pid],
  ).length;

  const handleIndividualAssign = async () => {
    setLoading(true);
    setError(null);
    try {
      const assignments = [];

      cyclePersons.forEach(person => {
        const evaluator = individualSelection[String(person.id)];
        if (!evaluator) return;
        cycle.dimensionIds.forEach(dimensionId => {
          assignments.push({
            id: `${cycle.id}-${dimensionId}-${evaluator.id}-${person.id}`,
            cycleId: cycle.id,
            dimensionId,
            evaluatorId: String(evaluator.id),
            personId: String(person.id),
          });
        });
      });

      if (assignments.length === 0) {
        setError('Elegí al menos un evaluador para alguna persona.');
        return;
      }

      await addBulkAssignments(assignments);
      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo guardar la asignación.',
      );
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
            onChange={e => setMode(e.target.value as AssignmentMode)}
          >
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Manual: Un evaluador para todo"
            />
            <FormControlLabel
              value="individual"
              control={<Radio />}
              label="Individual: Elegir evaluador por persona"
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

            {error && <Alert severity="error">{error}</Alert>}

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

      {mode === 'individual' && (
        <CardContainer padding={16}>
          <Stack sx={{ gap: 2 }}>
            <Stack
              sx={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <Typography variant="subtitle2">
                {individualAssignedCount} de {cyclePersons.length} personas con
                evaluador elegido
              </Typography>
              <Button
                variant="text"
                size="small"
                onClick={handleUseDirectBossForAll}
                disabled={bossesLoading}
              >
                Usar jefe directo para todos
              </Button>
            </Stack>

            <Stack sx={{ maxHeight: 400, overflowY: 'auto' }}>
              {cyclePersons.map(person => (
                <PersonEvaluatorRow
                  key={person.id}
                  person={person}
                  boss={bosses[String(person.id)] ?? null}
                  value={individualSelection[String(person.id)] ?? null}
                  onChange={user =>
                    setIndividualSelection(prev => ({
                      ...prev,
                      [String(person.id)]: user,
                    }))
                  }
                />
              ))}
            </Stack>

            {error && <Alert severity="error">{error}</Alert>}

            <Button
              variant="primary"
              disabled={individualAssignedCount === 0 || loading}
              onClick={handleIndividualAssign}
            >
              {loading ? 'Asignando...' : 'Asignar'}
            </Button>
          </Stack>
        </CardContainer>
      )}
    </Stack>
  );
};
