import { useState } from 'react';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import Alert from '@material-hu/mui/Alert';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import { useDimensions } from '../../../providers/DimensionsContext';
import { MOCK_CYCLES } from '../../Evaluador/CiclosActivos/constants';
import { MOCK_PEOPLE } from '../../Evaluador/MatrizEvaluacion/constants';
import { type EvaluatorAssignment } from '../../../types/evaluatorAssignments';

type CSVImportModalProps = {
  onImportSuccess: () => void;
};

type CSVRow = {
  cycle_id?: string;
  dimension_id?: string;
  evaluator_id?: string;
  person_id?: string;
};

type ValidationError = {
  row: number;
  message: string;
};

export const CSVImportModal = ({ onImportSuccess }: CSVImportModalProps) => {
  const { addBulkAssignments } = useEvaluatorAssignments();
  const { dimensions } = useDimensions();

  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [preview, setPreview] = useState<CSVRow[]>([]);
  const [loading, setLoading] = useState(false);

  const parseCSV = (text: string): CSVRow[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim());
      const row: CSVRow = {};

      headers.forEach((header, idx) => {
        if (header === 'cycle_id') row.cycle_id = values[idx];
        else if (header === 'dimension_id') row.dimension_id = values[idx];
        else if (header === 'evaluator_id') row.evaluator_id = values[idx];
        else if (header === 'person_id') row.person_id = values[idx];
      });

      return row;
    });
  };

  const validateRows = (rows: CSVRow[]): { valid: boolean; errors: ValidationError[] } => {
    const validationErrors: ValidationError[] = [];

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // +1 for header, +1 for 1-based indexing

      if (!row.cycle_id) {
        validationErrors.push({ row: rowNum, message: 'Falta cycle_id' });
      } else if (!MOCK_CYCLES.find(c => c.id === row.cycle_id)) {
        validationErrors.push({ row: rowNum, message: `Ciclo no encontrado: ${row.cycle_id}` });
      }

      if (!row.dimension_id) {
        validationErrors.push({ row: rowNum, message: 'Falta dimension_id' });
      } else if (!dimensions.find(d => d.id === row.dimension_id)) {
        validationErrors.push({ row: rowNum, message: `Dimensión no encontrada: ${row.dimension_id}` });
      }

      if (!row.evaluator_id) {
        validationErrors.push({ row: rowNum, message: 'Falta evaluator_id' });
      }

      if (!row.person_id) {
        validationErrors.push({ row: rowNum, message: 'Falta person_id' });
      } else if (!MOCK_PEOPLE.find(p => p.id === row.person_id)) {
        validationErrors.push({ row: rowNum, message: `Persona no encontrada: ${row.person_id}` });
      }
    });

    return { valid: validationErrors.length === 0, errors: validationErrors };
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (!newFile) return;

    setFile(newFile);
    setErrors([]);
    setPreview([]);

    const text = await newFile.text();
    const rows = parseCSV(text);
    setPreview(rows);

    const { errors: validationErrors } = validateRows(rows);
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
    }
  };

  const handleImport = async () => {
    if (!preview.length) return;

    const { valid } = validateRows(preview);
    if (!valid) return;

    setLoading(true);

    try {
      const assignments: EvaluatorAssignment[] = preview
        .filter(row => row.cycle_id && row.dimension_id && row.evaluator_id && row.person_id)
        .map(row => ({
          id: `${row.cycle_id}-${row.dimension_id}-${row.evaluator_id}-${row.person_id}`,
          cycleId: row.cycle_id!,
          dimensionId: row.dimension_id!,
          evaluatorId: row.evaluator_id!,
          personId: row.person_id!,
        }));

      addBulkAssignments(assignments);
      setFile(null);
      setPreview([]);
      setErrors([]);
      onImportSuccess();
    } catch (error) {
      setErrors([{ row: 0, message: 'Error al importar: ' + (error instanceof Error ? error.message : 'desconocido') }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="body2">
        Cargá un archivo CSV con las siguientes columnas:
        <br />
        <code>cycle_id,dimension_id,evaluator_id,person_id</code>
      </Typography>

      <input
        type="file"
        accept=".csv"
        onChange={handleFileChange}
        style={{ width: '100%' }}
      />

      {errors.length > 0 && (
        <Alert severity="error">
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="subtitle2">Errores encontrados:</Typography>
            {errors.slice(0, 5).map((error, idx) => (
              <Typography key={idx} variant="caption">
                Fila {error.row}: {error.message}
              </Typography>
            ))}
            {errors.length > 5 && (
              <Typography variant="caption">... y {errors.length - 5} errores más</Typography>
            )}
          </Stack>
        </Alert>
      )}

      {preview.length > 0 && errors.length === 0 && (
        <CardContainer padding={12}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="subtitle2">Preview ({preview.length} filas)</Typography>
            {preview.slice(0, 3).map((row, idx) => (
              <Typography key={idx} variant="caption" sx={{ color: 'text.secondary' }}>
                {row.cycle_id} → {row.dimension_id} → {row.evaluator_id} eval a {row.person_id}
              </Typography>
            ))}
            {preview.length > 3 && (
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                ... y {preview.length - 3} filas más
              </Typography>
            )}
          </Stack>
        </CardContainer>
      )}

      <Stack sx={{ flexDirection: 'row', gap: 1, justifyContent: 'flex-end', pt: 2 }}>
        <Button
          variant="primary"
          disabled={!preview.length || errors.length > 0 || loading}
          onClick={handleImport}
        >
          {loading ? 'Importando...' : 'Importar'}
        </Button>
      </Stack>
    </Stack>
  );
};
