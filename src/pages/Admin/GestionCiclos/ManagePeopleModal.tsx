import { useState } from 'react';

import { IconX } from '@material-hu/icons/tabler';
import Alert from '@material-hu/mui/Alert';
import Autocomplete from '@material-hu/mui/Autocomplete';
import IconButton from '@material-hu/mui/IconButton';
import Stack from '@material-hu/mui/Stack';
import TextField from '@material-hu/mui/TextField';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import {
  type HumandUser,
  useCyclePeople,
  useHumandUsers,
} from '../../../hooks/useHumandSegmentation';
import { cyclesService } from '../../../services/supabase/cycles';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

import { toFrontendCycle } from './utils';

type ManagePeopleModalProps = {
  cycle: Cycle;
  onUpdated: (cycle: Cycle) => void;
};

const fullName = (u: HumandUser) => `${u.firstName} ${u.lastName}`.trim();

export const ManagePeopleModal = ({
  cycle,
  onUpdated,
}: ManagePeopleModalProps) => {
  const [addedPersonIds, setAddedPersonIds] = useState(cycle.addedPersonIds);
  const [excludedPersonIds, setExcludedPersonIds] = useState(
    cycle.excludedPersonIds,
  );
  const [personSearch, setPersonSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { members, loading } = useCyclePeople(
    cycle.segmentIds,
    addedPersonIds,
    excludedPersonIds,
  );
  const { users: searchResults, loading: searchLoading } =
    useHumandUsers(personSearch);

  const memberIds = new Set(members.map(m => String(m.id)));
  const isDirty =
    addedPersonIds.join(',') !== cycle.addedPersonIds.join(',') ||
    excludedPersonIds.join(',') !== cycle.excludedPersonIds.join(',');

  const handleRemove = (personId: string) => {
    if (addedPersonIds.includes(personId)) {
      setAddedPersonIds(prev => prev.filter(id => id !== personId));
    } else {
      setExcludedPersonIds(prev => [...prev, personId]);
    }
  };

  const handleAdd = (user: HumandUser | null) => {
    if (!user) return;
    const id = String(user.id);
    setExcludedPersonIds(prev => prev.filter(x => x !== id));
    setAddedPersonIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    setPersonSearch('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await cyclesService.update(cycle.id, {
        added_person_ids: addedPersonIds,
        excluded_person_ids: excludedPersonIds,
      });
      onUpdated(toFrontendCycle(updated));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'No se pudieron guardar los cambios.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="body2">
        Esta lista sale de los segmentos elegidos para el ciclo. Podés sacar a
        alguien puntual o agregar a alguien que no pertenezca a esos
        segmentos.
      </Typography>

      <Autocomplete
        options={searchResults.filter(u => !memberIds.has(String(u.id)))}
        getOptionLabel={fullName}
        isOptionEqualToValue={(a, b) => a.id === b.id}
        value={null}
        onChange={(_, value) => handleAdd(value)}
        inputValue={personSearch}
        onInputChange={(_, value) => setPersonSearch(value)}
        loading={searchLoading}
        renderInput={params => (
          <TextField
            {...params}
            label="Agregar persona"
            placeholder="Nombre, apellido o email"
          />
        )}
        fullWidth
      />

      {error && <Alert severity="error">{error}</Alert>}

      <CardContainer padding={16}>
        <Stack sx={{ gap: 1 }}>
          <Typography variant="subtitle2">
            {loading ? 'Cargando...' : `${members.length} personas en el ciclo`}
          </Typography>
          <Stack sx={{ gap: 0.5 }}>
            {members.map(person => (
              <Stack
                key={person.id}
                sx={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  py: 0.5,
                }}
              >
                <Stack>
                  <Typography variant="body2">{fullName(person)}</Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary' }}
                  >
                    {person.email}
                    {addedPersonIds.includes(String(person.id))
                      ? ' · Agregado a mano'
                      : ''}
                  </Typography>
                </Stack>
                <IconButton
                  size="small"
                  onClick={() => handleRemove(String(person.id))}
                >
                  <IconX size={16} />
                </IconButton>
              </Stack>
            ))}
            {!loading && members.length === 0 && (
              <Typography
                variant="body2"
                sx={{ color: 'text.secondary' }}
              >
                No hay personas en este ciclo.
              </Typography>
            )}
          </Stack>
        </Stack>
      </CardContainer>

      <Stack
        sx={{ flexDirection: 'row', gap: 1, justifyContent: 'flex-end', pt: 1 }}
      >
        <Button
          variant="primary"
          disabled={!isDirty || saving}
          onClick={handleSave}
        >
          {saving ? 'Guardando...' : 'Guardar cambios'}
        </Button>
      </Stack>
    </Stack>
  );
};
