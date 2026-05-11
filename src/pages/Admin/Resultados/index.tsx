import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import * as XLSX from 'xlsx';

import { IconAlertTriangle, IconDownload } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';
import { useTheme } from '@material-hu/mui/styles';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';
import FormAutocomplete from '@material-hu/components/design-system/Inputs/Autocomplete/form';
import Table from '@material-hu/components/design-system/Table';
import TableBody from '@material-hu/components/design-system/Table/components/TableBody';
import TableCell from '@material-hu/components/design-system/Table/components/TableCell';
import TableContainer from '@material-hu/components/design-system/Table/components/TableContainer';
import TableHead from '@material-hu/components/design-system/Table/components/TableHead';
import TableRow from '@material-hu/components/design-system/Table/components/TableRow';
import Title from '@material-hu/components/design-system/Title';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';
import { MOCK_CYCLES } from '../../Evaluador/CiclosActivos/constants';
import { DIMENSIONS, MOCK_EVALUATORS, MOCK_PEOPLE } from '../../Evaluador/MatrizEvaluacion/constants';
import { MOCK_RESULTS } from './constants';

import type { Theme } from '@material-hu/mui/styles';

const getScoreStyle = (score: number | undefined, theme: Theme) => {
  const base = { fontSize: 13, fontWeight: 600 };
  if (!score) return base;
  if (score === 1) return { ...base, color: theme.palette.error.main, fontWeight: 700 };
  if (score <= 3) return { ...base, color: theme.palette.warning.dark };
  return { ...base, color: theme.palette.success.dark };
};

type FilterOption = { value: string; label: string };

type FilterValues = {
  buscarPersona: string;
  evaluador: FilterOption | null;
  proyecto: FilterOption | null;
  area: FilterOption | null;
  departamento: FilterOption | null;
  provincia: FilterOption | null;
};

const toOptions = (values: (string | undefined)[]) =>
  Array.from(new Set(values.filter(Boolean) as string[])).sort().map(v => ({ value: v, label: v }));

export const ResultadosPage = () => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;

  const cyclesWithResults = MOCK_CYCLES.filter(c => MOCK_RESULTS.some(r => r.cycleId === c.id));
  const [selectedCycleId, setSelectedCycleId] = useState(cyclesWithResults[0]?.id ?? '');

  const selectedCycle = MOCK_CYCLES.find(c => c.id === selectedCycleId);
  const activeD =
    selectedCycle?.dimensionIds?.length
      ? allDimensions.filter(d => selectedCycle.dimensionIds.includes(d.id))
      : allDimensions;
  const SUB_DIMENSIONS = activeD.flatMap(d => d.subDimensions);

  const selectedResults = MOCK_RESULTS.filter(r => r.cycleId === selectedCycleId);

  // Filter options
  const evaluadorOptions = MOCK_EVALUATORS.map(e => ({ value: e.id, label: e.name }));
  const proyectoOptions = toOptions(MOCK_PEOPLE.map(p => p.proyecto));
  const areaOptions = toOptions(MOCK_PEOPLE.map(p => p.area));
  const departamentoOptions = toOptions(MOCK_PEOPLE.map(p => p.departamento));
  const provinciaOptions = toOptions(MOCK_PEOPLE.map(p => p.provincia));

  const methods = useForm<FilterValues>({
    defaultValues: {
      buscarPersona: '',
      evaluador: null,
      proyecto: null,
      area: null,
      departamento: null,
      provincia: null,
    },
  });
  const filters = methods.watch();

  // Filtered people
  const filteredPeople = useMemo(() => {
    return MOCK_PEOPLE.filter(person => {
      const result = selectedResults.find(r => r.personId === person.id);

      if (filters.buscarPersona) {
        const q = filters.buscarPersona.toLowerCase();
        if (!person.name.toLowerCase().includes(q) && !person.legajo.includes(q)) return false;
      }
      if (filters.evaluador && result?.evaluatorId !== filters.evaluador.value) return false;
      if (filters.proyecto && person.proyecto !== filters.proyecto.value) return false;
      if (filters.area && person.area !== filters.area.value) return false;
      if (filters.departamento && person.departamento !== filters.departamento.value) return false;
      if (filters.provincia && person.provincia !== filters.provincia.value) return false;

      return true;
    });
  }, [selectedResults, filters]);

  const nocivos = useMemo(() => {
    return filteredPeople
      .flatMap(person => {
        const result = selectedResults.find(r => r.personId === person.id);
        return Object.entries(result?.scores ?? {})
          .filter(([, score]) => score === 1)
          .map(([subDimId]) => ({
            person,
            subDim: SUB_DIMENSIONS.find(sd => sd.id === subDimId),
          }));
      })
      .filter(n => n.subDim);
  }, [filteredPeople, selectedResults]);

  const handleExportExcel = () => {
    const cycleName = selectedCycle?.name ?? selectedCycleId;
    const headers = [
      'Nombre', 'Legajo', 'Proyecto', 'Área', 'Departamento', 'Provincia', 'Evaluador',
      ...SUB_DIMENSIONS.map(sd => sd.name),
    ];
    const rows = filteredPeople.map(person => {
      const result = selectedResults.find(r => r.personId === person.id);
      const evaluador = MOCK_EVALUATORS.find(e => e.id === result?.evaluatorId);
      return [
        person.name,
        person.legajo,
        person.proyecto ?? '',
        person.area ?? '',
        person.departamento ?? '',
        person.provincia ?? '',
        evaluador?.name ?? '',
        ...SUB_DIMENSIONS.map(sd => result?.scores[sd.id] ?? ''),
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map((_, i) => ({ wch: i < 7 ? 20 : 12 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, `resultados-${cycleName}.xlsx`);
  };

  const activeFiltersCount = [
    filters.buscarPersona,
    filters.evaluador,
    filters.proyecto,
    filters.area,
    filters.departamento,
    filters.provincia,
  ].filter(Boolean).length;

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title
            title="Resultados de evaluación"
            description="Revisá los puntajes enviados por los evaluadores."
            variant="L"
          />
          <Button
            variant="secondary"
            size="large"
            startIcon={<IconDownload size={20} />}
            onClick={handleExportExcel}
          >
            Exportar Excel
          </Button>
        </Stack>

        {/* Selector de ciclo */}
        <Stack sx={{ flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
          {cyclesWithResults.map(cycle => (
            <Button
              key={cycle.id}
              variant={selectedCycleId === cycle.id ? 'primary' : 'secondary'}
              size="small"
              onClick={() => setSelectedCycleId(cycle.id)}
            >
              {cycle.name}
            </Button>
          ))}
        </Stack>

        {/* Filtros */}
        <FormProvider {...methods}>
          <CardContainer padding={16} noHover sx={{ width: '100%' }}>
            <Stack sx={{ gap: 2 }}>
              <Stack sx={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Typography variant="subtitle2">
                  Filtros{activeFiltersCount > 0 ? ` (${activeFiltersCount} activos)` : ''}
                </Typography>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => methods.reset()}
                  >
                    Limpiar filtros
                  </Button>
                )}
              </Stack>
              <Stack sx={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
                <Stack sx={{ flex: '1 1 200px', minWidth: 180 }}>
                  <FormInputClassic
                    name="buscarPersona"
                    inputProps={{ label: 'Buscar persona', placeholder: 'Nombre o legajo', hasCounter: false }}
                    rules={{}}
                  />
                </Stack>
                <Stack sx={{ flex: '1 1 180px', minWidth: 160 }}>
                  <FormAutocomplete
                    name="evaluador"
                    autocompleteProps={{ label: 'Evaluador' }}
                    options={evaluadorOptions}
                    rules={{}}
                  />
                </Stack>
                <Stack sx={{ flex: '1 1 160px', minWidth: 140 }}>
                  <FormAutocomplete
                    name="proyecto"
                    autocompleteProps={{ label: 'Proyecto' }}
                    options={proyectoOptions}
                    rules={{}}
                  />
                </Stack>
                <Stack sx={{ flex: '1 1 160px', minWidth: 140 }}>
                  <FormAutocomplete
                    name="area"
                    autocompleteProps={{ label: 'Área' }}
                    options={areaOptions}
                    rules={{}}
                  />
                </Stack>
                <Stack sx={{ flex: '1 1 160px', minWidth: 140 }}>
                  <FormAutocomplete
                    name="departamento"
                    autocompleteProps={{ label: 'Departamento' }}
                    options={departamentoOptions}
                    rules={{}}
                  />
                </Stack>
                <Stack sx={{ flex: '1 1 160px', minWidth: 140 }}>
                  <FormAutocomplete
                    name="provincia"
                    autocompleteProps={{ label: 'Provincia' }}
                    options={provinciaOptions}
                    rules={{}}
                  />
                </Stack>
              </Stack>
            </Stack>
          </CardContainer>
        </FormProvider>

        {/* Resultado count */}
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          {filteredPeople.length} {filteredPeople.length === 1 ? 'persona' : 'personas'}
        </Typography>

        {/* Tabla */}
        <TableContainer sx={{ overflowX: 'auto' }}>
          <Table sx={{ tableLayout: 'fixed', minWidth: 1200 }}>
            <colgroup>
              <col style={{ width: 140 }} />
              {SUB_DIMENSIONS.map(sd => (
                <col key={sd.id} style={{ width: 52 }} />
              ))}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell headerCell rowSpan={2} sx={{ verticalAlign: 'middle' }}>
                  Nombre / Legajo
                </TableCell>
                {activeD.map(dim => (
                  <TableCell
                    key={dim.id}
                    headerCell
                    colSpan={dim.subDimensions.length}
                    sx={{ textAlign: 'center', borderBottom: 0, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', fontSize: 11, px: 0.5 }}
                  >
                    {dim.name}
                  </TableCell>
                ))}
              </TableRow>
              <TableRow>
                {SUB_DIMENSIONS.map(sd => (
                  <TableCell
                    key={sd.id}
                    headerCell
                    sx={{ textAlign: 'center', verticalAlign: 'bottom', pb: 1, px: 0, overflow: 'hidden' }}
                  >
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', writingMode: 'vertical-rl', transform: 'rotate(180deg)', whiteSpace: 'nowrap', fontSize: 10, fontWeight: 600, lineHeight: 1.2, height: 160, overflow: 'hidden' }}
                    >
                      {sd.name}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPeople.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={SUB_DIMENSIONS.length + 1} sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      No hay resultados para los filtros seleccionados.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPeople.map(person => {
                  const result = selectedResults.find(r => r.personId === person.id);
                  return (
                    <TableRow key={person.id}>
                      <TableCell sx={{ overflow: 'hidden' }}>
                        <Stack>
                          <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {person.name}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            {person.legajo}
                          </Typography>
                        </Stack>
                      </TableCell>
                      {SUB_DIMENSIONS.map(sd => {
                        const score = result?.scores[sd.id];
                        return (
                          <TableCell key={sd.id} sx={{ textAlign: 'center', px: 0 }}>
                            {score != null ? (
                              <Typography variant="body2" sx={getScoreStyle(score, theme)}>
                                {score}
                              </Typography>
                            ) : '—'}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Alertas nocivo */}
        <CardContainer sx={{ width: '100%' }} padding={16} noHover>
          <Stack sx={{ gap: 2 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <IconAlertTriangle size={20} color={theme.palette.error.main} />
              <Typography variant="subtitle1">Alertas Nocivo</Typography>
              {nocivos.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{ bgcolor: theme.palette.error.light, color: theme.palette.error.dark, borderRadius: '4px', px: 1, fontWeight: 700 }}
                >
                  {nocivos.length}
                </Typography>
              )}
            </Stack>
            {nocivos.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                No hay puntajes Nocivo en este ciclo.
              </Typography>
            ) : (
              <Stack sx={{ gap: 0.5 }}>
                {nocivos.map((n, idx) => (
                  <Typography key={idx} variant="body2">
                    {n.person?.name} – {n.subDim?.name}
                  </Typography>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContainer>
      </Stack>
    </DashboardLayout>
  );
};

export default ResultadosPage;
