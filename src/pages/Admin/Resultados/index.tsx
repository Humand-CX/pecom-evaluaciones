import { useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
// @ts-ignore - xlsx package
import * as XLSX from 'xlsx';

import { IconAlertTriangle, IconDownload, IconChartBar, IconList, IconAlertCircle } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';
import Tab from '@material-hu/mui/Tab';
import Tabs from '@material-hu/mui/Tabs';
import Box from '@material-hu/mui/Box';
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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const ResultadosPage = () => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;

  const cyclesWithResults = MOCK_CYCLES.filter(c => MOCK_RESULTS.some(r => r.cycleId === c.id));
  const [selectedCycleId, setSelectedCycleId] = useState(cyclesWithResults[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState(0);

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

  const completedCount = useMemo(() => {
    return filteredPeople.filter(p => {
      const result = selectedResults.find(r => r.personId === p.id);
      return result && Object.values(result.scores).some(score => score !== undefined);
    }).length;
  }, [filteredPeople, selectedResults]);

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
              onClick={() => {
                setSelectedCycleId(cycle.id);
                setActiveTab(0);
              }}
            >
              {cycle.name}
            </Button>
          ))}
        </Stack>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={activeTab}
            onChange={(event, newValue) => setActiveTab(newValue)}
            aria-label="resultados tabs"
            sx={{
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: 14,
                fontWeight: 500,
                gap: 1,
              },
            }}
          >
            <Tab label="Dashboard" icon={<IconChartBar size={18} />} iconPosition="start" />
            <Tab label="Detalles" icon={<IconList size={18} />} iconPosition="start" />
            <Tab label="Alertas" icon={<IconAlertCircle size={18} />} iconPosition="start" />
          </Tabs>
        </Box>

        {/* TAB 1: Dashboard */}
        <TabPanel value={activeTab} index={0}>
          <Stack sx={{ gap: 3 }}>
            <Stack sx={{ flexDirection: 'row', gap: 2, flexWrap: 'wrap' }}>
              <CardContainer sx={{ flex: 1, minWidth: 200 }} padding={16} noHover>
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Evaluaciones completadas
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {completedCount}/{filteredPeople.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {filteredPeople.length > 0 ? Math.round((completedCount / filteredPeople.length) * 100) : 0}% del progreso
                  </Typography>
                </Stack>
              </CardContainer>

              <CardContainer sx={{ flex: 1, minWidth: 200 }} padding={16} noHover>
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Puntajes Nocivo (1)
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700, color: 'error.main' }}>
                    {nocivos.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Requieren atención inmediata
                  </Typography>
                </Stack>
              </CardContainer>

              <CardContainer sx={{ flex: 1, minWidth: 200 }} padding={16} noHover>
                <Stack sx={{ gap: 1 }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Dimensiones evaluadas
                  </Typography>
                  <Typography variant="h3" sx={{ fontWeight: 700 }}>
                    {activeD.length}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    Sub-dimensiones: {SUB_DIMENSIONS.length}
                  </Typography>
                </Stack>
              </CardContainer>
            </Stack>

            <CardContainer sx={{ width: '100%' }} padding={16} noHover>
              <Stack sx={{ gap: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  Desglose por Dimensión
                </Typography>
                <Stack sx={{ gap: 1 }}>
                  {activeD.map(dim => {
                    const avgScore = filteredPeople.length > 0
                      ? filteredPeople.reduce((sum, p) => {
                        const result = selectedResults.find(r => r.personId === p.id);
                        const dimScores = dim.subDimensions.map(sd => result?.scores[sd.id] ?? 0).filter(s => s > 0);
                        return sum + (dimScores.length > 0 ? dimScores.reduce((a, b) => a + b) / dimScores.length : 0);
                      }, 0) / filteredPeople.length
                      : 0;

                    return (
                      <Stack key={dim.id} sx={{ gap: 0.5 }}>
                        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {dim.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {avgScore.toFixed(1)}/5
                          </Typography>
                        </Stack>
                        <Box
                          sx={{
                            height: 8,
                            bgcolor: 'action.disabled',
                            borderRadius: 1,
                            overflow: 'hidden',
                          }}
                        >
                          <Box
                            sx={{
                              height: '100%',
                              bgcolor: avgScore >= 3 ? 'success.main' : avgScore >= 2 ? 'warning.main' : 'error.main',
                              width: `${(avgScore / 5) * 100}%`,
                              transition: 'width 0.3s ease',
                            }}
                          />
                        </Box>
                      </Stack>
                    );
                  })}
                </Stack>
              </Stack>
            </CardContainer>
          </Stack>
        </TabPanel>

        {/* TAB 2: Detalles (Filtros + Tabla) */}
        <TabPanel value={activeTab} index={1}>
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
        </TabPanel>

        {/* TAB 3: Alertas Nocivo */}
        <TabPanel value={activeTab} index={2}>
        <CardContainer sx={{ width: '100%', bgcolor: nocivos.length > 0 ? 'error.light' : 'success.light' }} padding={16} noHover>
          <Stack sx={{ gap: 2 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <IconAlertTriangle size={20} color={theme.palette.error.main} />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Alertas - Puntajes Nocivo
              </Typography>
              {nocivos.length > 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    bgcolor: theme.palette.error.main,
                    color: 'error.light',
                    borderRadius: '12px',
                    px: 1.5,
                    py: 0.5,
                    fontWeight: 700,
                    minWidth: 28,
                    textAlign: 'center',
                    ml: 'auto',
                  }}
                >
                  {nocivos.length}
                </Typography>
              )}
            </Stack>

            {nocivos.length === 0 ? (
              <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic' }}>
                ✓ No hay puntajes Nocivo en este ciclo.
              </Typography>
            ) : (
              <Stack sx={{ gap: 1 }}>
                {nocivos.map((n, idx) => (
                  <Stack
                    key={idx}
                    sx={{
                      flexDirection: 'row',
                      gap: 1.5,
                      p: 1,
                      bgcolor: 'background.paper',
                      borderLeft: '4px solid',
                      borderColor: 'error.main',
                      borderRadius: '4px',
                    }}
                  >
                    <Stack sx={{ flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {n.person?.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {n.person?.legajo}
                      </Typography>
                    </Stack>
                    <Stack sx={{ flex: 1 }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        Dimensión
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {n.subDim?.name}
                      </Typography>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            )}
          </Stack>
        </CardContainer>
        </TabPanel>
      </Stack>
    </DashboardLayout>
  );
};

export default ResultadosPage;
