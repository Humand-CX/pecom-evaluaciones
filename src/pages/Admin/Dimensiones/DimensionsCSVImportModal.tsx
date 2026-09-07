import { useState } from 'react';

import Alert from '@material-hu/mui/Alert';
import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useDimensions } from '../../../providers/DimensionsContext';

type DimensionsCSVImportModalProps = {
  onImportSuccess: () => void;
};

type CSVRow = {
  dimension_name?: string;
  sub_dimension_name?: string;
  sub_dimension_description?: string;
};

type ValidationError = {
  row: number;
  message: string;
};

type ParsedEntry = {
  name: string;
  subDimensions: { name: string; description?: string }[];
};

// Parser simple que soporta campos entre comillas (para descripciones con comas)
const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result.map(v => v.trim());
};

const parseCSV = (text: string): CSVRow[] => {
  const lines = text.split('\n').filter(line => line.trim());
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase());
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line);
    const row: CSVRow = {};
    headers.forEach((header, idx) => {
      if (header === 'dimension_name') row.dimension_name = values[idx];
      else if (header === 'sub_dimension_name')
        row.sub_dimension_name = values[idx];
      else if (header === 'sub_dimension_description')
        row.sub_dimension_description = values[idx];
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

export const DimensionsCSVImportModal = ({
  onImportSuccess,
}: DimensionsCSVImportModalProps) => {
  const { bulkImport } = useDimensions();

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [parsed, setParsed] = useState<ParsedEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const handleDownloadTemplate = () => {
    const header =
      'dimension_name,sub_dimension_name,sub_dimension_description';
    const rows = [
      'Disciplina Operacional,Compromiso con la seguridad,Cumplimiento de normas y procedimientos de seguridad',
      'Disciplina Operacional,Puntualidad,Asistencia y cumplimiento de horarios',
      'Conocimiento Técnico,Manejo de herramientas,Uso correcto del equipamiento asignado',
    ];
    downloadCsv('plantilla-dimensiones.csv', [header, ...rows].join('\n'));
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const newFile = event.target.files?.[0];
    if (!newFile) return;

    setErrors([]);
    setParsed([]);
    setLoading(true);

    try {
      const text = await newFile.text();
      const rows = parseCSV(text);

      const validationErrors: ValidationError[] = [];
      rows.forEach((row, idx) => {
        const rowNum = idx + 2;
        if (!row.dimension_name) {
          validationErrors.push({ row: rowNum, message: 'Falta dimension_name' });
        }
        if (!row.sub_dimension_name) {
          validationErrors.push({
            row: rowNum,
            message: 'Falta sub_dimension_name',
          });
        }
      });

      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Agrupa filas por dimensión, preservando el orden de aparición
      const entries: ParsedEntry[] = [];
      const byName = new Map<string, ParsedEntry>();
      rows.forEach(row => {
        const dimName = row.dimension_name!;
        let entry = byName.get(dimName);
        if (!entry) {
          entry = { name: dimName, subDimensions: [] };
          byName.set(dimName, entry);
          entries.push(entry);
        }
        entry.subDimensions.push({
          name: row.sub_dimension_name!,
          description: row.sub_dimension_description || undefined,
        });
      });

      setParsed(entries);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    setLoading(true);
    try {
      await bulkImport(parsed);
      setParsed([]);
      onImportSuccess();
    } catch (err) {
      setErrors([
        {
          row: 0,
          message:
            err instanceof Error
              ? err.message
              : 'No se pudieron importar las dimensiones.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const totalSubDimensions = parsed.reduce(
    (sum, e) => sum + e.subDimensions.length,
    0,
  );

  return (
    <Stack sx={{ gap: 2 }}>
      <Typography variant="body2">
        Cargá un archivo CSV con las columnas:
        <br />
        <code>dimension_name,sub_dimension_name,sub_dimension_description</code>
        <br />
        Una fila por sub-dimensión — repetí el mismo{' '}
        <code>dimension_name</code> en varias filas para agrupar
        sub-dimensiones bajo la misma dimensión. Esto siempre crea
        dimensiones nuevas (no reutiliza una existente con el mismo nombre).
      </Typography>

      <Button
        variant="secondary"
        onClick={handleDownloadTemplate}
      >
        Descargar plantilla
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
                {error.row > 0 ? `Fila ${error.row}: ` : ''}
                {error.message}
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

      {parsed.length > 0 && errors.length === 0 && (
        <CardContainer padding={16}>
          <Stack sx={{ gap: 1 }}>
            <Typography variant="subtitle2">
              Preview ({parsed.length} dimensiones, {totalSubDimensions}{' '}
              sub-dimensiones)
            </Typography>
            {parsed.map((entry, idx) => (
              <Typography
                key={idx}
                variant="caption"
                sx={{ color: 'text.secondary' }}
              >
                {entry.name} — {entry.subDimensions.length}{' '}
                {entry.subDimensions.length === 1
                  ? 'sub-dimensión'
                  : 'sub-dimensiones'}
              </Typography>
            ))}
          </Stack>
        </CardContainer>
      )}

      <Stack
        sx={{ flexDirection: 'row', gap: 1, justifyContent: 'flex-end', pt: 2 }}
      >
        <Button
          variant="primary"
          disabled={!parsed.length || errors.length > 0 || loading}
          onClick={handleImport}
        >
          Importar
        </Button>
      </Stack>
    </Stack>
  );
};
