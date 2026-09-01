import { useState } from 'react';

import Alert from '@material-hu/mui/Alert';
import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import { useSegmentMembers } from '../../../hooks/useHumandSegmentation';
import { postgrest } from '../../../services/postgrest';
import { type EvaluatorAssignment } from '../../../types/evaluatorAssignments';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

type CSVImportModalProps = {
  cycle: Cycle;
  onImportSuccess: () => void;
};

type CSVRow = {
  evaluator_internal_id?: string;
  person_internal_id?: string;
};

type ValidationError = {
  row: number;
  message: string;
};

interface HumandUserLookup {
  id: number;
  employeeInternalId: string;
  firstName: string;
  lastName: string;
}

const parseCSV = (text: string): CSVRow[] => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row: CSVRow = {};

    headers.forEach((header, idx) => {
      if (header === 'evaluator_internal_id')
        row.evaluator_internal_id = values[idx];
      else if (header === 'person_internal_id')
        row.person_internal_id = values[idx];
    });

    return row;
  });
};

const downloadCsv = (filename: string, content: string) => {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const CSVImportModal = ({
  cycle,
  onImportSuccess,
}: CSVImportModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();
  const { members: cyclePersons } = useSegmentMembers(cycle.segmentIds);

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [resolved, setResolved] = useState<
    { evaluator: HumandUserLookup; person: HumandUserLookup }[]
  >([]);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = () => {
    const header = 'evaluator_internal_id,person_internal_id';
    const rows = cyclePersons.map(
      p => `,${p.employeeInternalId ?? p.id}`,
    );
    downloadCsv(`plantilla-${cycle.name}.csv`, [header, ...rows].join('\n'));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newFile = event.target.files?.[0];
    if (!newFile) return;

    setErrors([]);
    setPreview([]);
    setResolved([]);
    setLoading(true);

    try {
      const text = await newFile.text();
      const rows = parseCSV(text);
      setPreview(rows);

      const validationErrors: ValidationError[] = [];
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        if (!row.evaluator_internal_id) {
          validationErrors.push({
            row: rowNum,
            message: 'Falta evaluator_internal_id',
          });
        }
        if (!row.person_internal_id) {
          validationErrors.push({
            row: rowNum,
            message: 'Falta person_internal_id',
          });
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      const internalIds = [
        ...new Set(
          rows.flatMap(r => [r.evaluator_internal_id!, r.person_internal_id!]),
        ),
      ];
      const { data: users } = await postgrest.get<HumandUserLookup>('users', {
        employeeInternalId: `in.(${internalIds.join(',')})`,
        select: 'id,employeeInternalId,firstName,lastName',
      });
      const byInternalId = new Map(users.map(u => [u.employeeInternalId, u]));

      const rowResults = rows.map((row, idx) => {
        const rowNum = idx + 2;
        const evaluator = byInternalId.get(row.evaluator_internal_id!);
        const person = byInternalId.get(row.person_internal_id!);
        if (!evaluator) {
          validationErrors.push({
            row: rowNum,
            message: `Evaluador no encontrado: ${row.evaluator_internal_id}`,
          });
        }
        if (!person) {
          validationErrors.push({
            row: rowNum,
            message: `Persona no encontrada: ${row.person_internal_id}`,
          });
        }
        return { evaluator, person };
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setResolved(
        rowResults as { evaluator: HumandUserLookup; person: HumandUserLookup }[],
      );
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    const assignments: EvaluatorAssignment[] = resolved.flatMap(
      ({ evaluator, person }) =>
        cycle.dimensionIds.map(dimensionId => ({
          id: `${cycle.id}-${dimensionId}-${evaluator.id}-${person.id}`,
          cycleId: cycle.id,
          dimensionId,
          evaluatorId: String(evaluator.id),
          personId: String(person.id),
        })),
    );

    setLoading(true);
    try {
      await addBulkAssignments(assignments);
      setPreview([]);
      setResolved([]);
      onImportSuccess();
    } catch (err) {
      setErrors([
        {
          row: 0,
          message:
            err instanceof Error
              ? err.message
              : 'No se pudo importar las asignaciones.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="body2">
        Cargá un archivo CSV con las columnas:
        <br />
        <code>evaluator_internal_id,person_internal_id</code>
        <br />
        Usá el mismo identificador que cada persona tiene en Humand (email,
        DNI, legajo, etc. — el que use tu comunidad).
      </Typography>

      <Button
        variant="secondary"
        onClick={handleDownloadTemplate}
      >
        Descargar plantilla ({cyclePersons.length} personas del segmento)
      </Button>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ width: '100%' }}
      />

      {loading && <Typography variant="caption">Procesando...</Typography>}

      {errors.length > 0 && (
        <Alert severity="error">
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="subtitle2">Errores encontrados:</Typography>
            {errors.slice(0, 5).map((error, idx) => (
              <Typography
                key={idx}
                variant="caption"
              >
                Fila {error.row}: {error.message}
              </Typography>
            ))}
            {errors.length > 5 && (
              <Typography variant="caption">
                ... y {errors.length - 5} errores más
              </Typography>
            )}
          </Stack>
        </Alert>
      )}

      {resolved.length > 0 && errors.length === 0 && (
        <CardContainer padding={16}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="subtitle2">
              Preview ({resolved.length} filas)
            </Typography>
            {resolved.slice(0, 5).map((r, idx) => (
              <Typography
                key={idx}
                variant="caption"
                sx={{ color: 'text.secondary' }}
              >
                {r.evaluator.firstName} {r.evaluator.lastName} evalúa a{' '}
                {r.person.firstName} {r.person.lastName}
              </Typography>
            ))}
            {resolved.length > 5 && (
              <Typography
                variant="caption"
                sx={{ color: 'text.secondary' }}
              >
                ... y {resolved.length - 5} filas más
              </Typography>
            )}
          </Stack>
        </CardContainer>
      )}

      <Stack
        sx={{ flexDirection: 'row', gap: 1, justifyContent: 'flex-end', pt: 2 }}
      >
        <Button
          variant="primary"
          disabled={!resolved.length || errors.length > 0 || loading}
          onClick={handleImport}
        >
          Importar
        </Button>
      </Stack>
    </Stack>
  );
};
