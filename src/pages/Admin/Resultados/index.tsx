import { useEffect, useMemo, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import * as XLSX from 'xlsx';
import {
  IconAlertCircle,
  IconAlertTriangle,
  IconChartBar,
  IconDownload,
  IconList,
} from '@material-hu/icons/tabler';
import Box from '@material-hu/mui/Box';
import FormControl from '@material-hu/mui/FormControl';
import InputLabel from '@material-hu/mui/InputLabel';
import MenuItem from '@material-hu/mui/MenuItem';
import Select from '@material-hu/mui/Select';
import Stack from '@material-hu/mui/Stack';
import { type Theme, useTheme } from '@material-hu/mui/styles';
import Tab from '@material-hu/mui/Tab';
import Tabs from '@material-hu/mui/Tabs';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import FormAutocomplete from '@material-hu/components/design-system/Inputs/Autocomplete/form';
import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';
import Pagination from '@material-hu/components/design-system/Inputs/Pagination';
import Pills from '@material-hu/components/design-system/Pills';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';
import Table from '@material-hu/components/design-system/Table';
import TableBody from '@material-hu/components/design-system/Table/components/TableBody';
import TableCell from '@material-hu/components/design-system/Table/components/TableCell';
import TableContainer from '@material-hu/components/design-system/Table/components/TableContainer';
import TableHead from '@material-hu/components/design-system/Table/components/TableHead';
import TableRow from '@material-hu/components/design-system/Table/components/TableRow';
import Title from '@material-hu/components/design-system/Title';
import { useDrawerLayer } from '@material-hu/components/layers/Drawers';

import { useFilteredResults } from '../../../hooks/useFilteredResults';
import {
  type HumandUser,
  useHumandUsersByIds,
  useSegmentMembers,
  useSegmentationGroups,
  useSegmentationItems,
} from '../../../hooks/useHumandSegmentation';
import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';
import { type Dimension } from '../../Evaluador/MatrizEvaluacion/types';
import { assignmentsService } from '../../../services/supabase/assignments';
import { cyclesService, type Cycle as SupabaseCycle } from '../../../services/supabase/cycles';
import {
  evaluationResultsService,
  type EvaluationResultRow,
} from '../../../services/supabase/evaluationResults';

const fullName = (u: HumandUser) => `${u.firstName} ${u.lastName}`.trim();

const getScoreStyle = (score: number | undefined, theme: Theme) => {
  const base = { fontSize: 13, fontWeight: 600 };
  if (!score) return base;
  if (score === 1)
    return { ...base, color: theme.palette.error.main, fontWeight: 700 };
  if (score <= 3) return { ...base, color: theme.palette.warning.dark };
  return { ...base, color: theme.palette.success.dark };
};

const averageOf = (scores: Record<string, number | null> | undefined) => {
  if (!scores) return null;
  const values = Object.values(scores).filter(
    (v): v is number => v != null && v > 0,
  );
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
};

const ROWS_PER_PAGE = 25;

type FilterOption = { value: string; label: string };

type FilterValues = {
  buscarPersona: string;
  evaluador: FilterOption | null;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

interface PersonDetailProps {
  person: HumandUser;
  activeD: Dimension[];
  scores: Record<string, number | null>;
  evaluatorName?: string;
  theme: Theme;
}

function PersonDetailContent({
  person,
  activeD,
  scores,
  evaluatorName,
  theme,
}: PersonDetailProps) {
  return (
    <Stack sx={{ gap: 2 }}>
      <Stack>
        <Typography variant="subtitle1">{fullName(person)}</Typography>
        <Typography
          variant="caption"
          sx={{ color: 'text.secondary' }}
        >
          {person.email}
          {evaluatorName ? ` · Evaluador: ${evaluatorName}` : ''}
        </Typography>
      </Stack>
      {activeD.map(dim => (
        <CardContainer
          key={dim.id}
          padding={16}
          noHover
        >
          <Stack sx={{ gap: 1.5 }}>
            <Typography
              variant="subtitle2"
              sx={{ fontWeight: 700 }}
            >
              {dim.name}
            </Typography>
            {dim.subDimensions.map((sd, idx) => {
              const score = scores[sd.id];
              return (
                <Stack
                  key={sd.id}
                  sx={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    py: 1,
                    borderTop: idx > 0 ? '1px solid' : 'none',
                    borderColor: 'divider',
                  }}
                >
                  <Typography variant="body2">{sd.name}</Typography>
                  <Typography
                    variant="body2"
                    sx={getScoreStyle(score ?? undefined, theme)}
                  >
                    {score != null ? score : '—'}
                  </Typography>
                </Stack>
              );
            })}
          </Stack>
        </CardContainer>
      ))}
    </Stack>
  );
}

export const ResultadosPage = () => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const { openDrawer, closeDrawer } = useDrawerLayer();
  const { canViewAllResults, assignedCycleIds, evaluatorId, loading: filterLoading } =
    useFilteredResults();

  const [allCycles, setAllCycles] = useState<SupabaseCycle[]>([]);
  const [cyclesLoading, setCyclesLoading] = useState(true);

  useEffect(() => {
    cyclesService
      .getAll()
      .then(setAllCycles)
      .finally(() => setCyclesLoading(false));
  }, []);

  const cyclesWithAccess = useMemo(() => {
    if (canViewAllResults) return allCycles;
    return allCycles.filter(c => assignedCycleIds.includes(c.id));
  }, [allCycles, canViewAllResults, assignedCycleIds]);

  const [selectedCycleId, setSelectedCycleId] = useState('');
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!selectedCycleId && cyclesWithAccess.length > 0) {
      setSelectedCycleId(cyclesWithAccess[0].id);
    }
  }, [cyclesWithAccess, selectedCycleId]);

  const selectedCycle = allCycles.find(c => c.id === selectedCycleId) ?? null;
  const activeD = useMemo(() => {
    const ids = selectedCycle?.dimension_ids ?? [];
    return ids.length > 0 ? dimensions.filter(d => ids.includes(d.id)) : [];
  }, [selectedCycle, dimensions]);
  const subDimensions = activeD.flatMap(d => d.subDimensions);

  // Assignments for the selected cycle (who evaluates whom)
  const [cycleAssignments, setCycleAssignments] = useState<
    { evaluator_id: string; person_id: string }[]
  >([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  useEffect(() => {
    if (!selectedCycleId) {
      setCycleAssignments([]);
      setAssignmentsLoading(false);
      return;
    }
    setAssignmentsLoading(true);
    const fetch = canViewAllResults
      ? assignmentsService.getByCycle(selectedCycleId)
      : evaluatorId
        ? assignmentsService
            .getByEvaluator(evaluatorId)
            .then(rows => rows.filter(r => r.cycle_id === selectedCycleId))
        : Promise.resolve([]);

    fetch.then(setCycleAssignments).finally(() => setAssignmentsLoading(false));
  }, [selectedCycleId, canViewAllResults, evaluatorId]);

  const personIds = useMemo(
    () => [...new Set(cycleAssignments.map(a => a.person_id))],
    [cycleAssignments],
  );
  const evaluatorIdsInCycle = useMemo(
    () => [...new Set(cycleAssignments.map(a => a.evaluator_id))],
    [cycleAssignments],
  );

  const { users: people } = useHumandUsersByIds(personIds);
  const { users: evaluatorsInCycle } = useHumandUsersByIds(evaluatorIdsInCycle);

  // Real results for the selected cycle
  const [selectedResults, setSelectedResults] = useState<EvaluationResultRow[]>(
    [],
  );
  useEffect(() => {
    if (!selectedCycleId) {
      setSelectedResults([]);
      return;
    }
    const fetch = canViewAllResults
      ? evaluationResultsService.getByCycle(selectedCycleId)
      : evaluatorId
        ? evaluationResultsService.getByCycleAndEvaluator(
            selectedCycleId,
            evaluatorId,
          )
        : Promise.resolve([]);
    fetch.then(setSelectedResults);
  }, [selectedCycleId, canViewAllResults, evaluatorId]);

  // Segmentation filter (2-step: group -> item)
  const { groups: segGroups } = useSegmentationGroups();
  const [segGroupId, setSegGroupId] = useState<number | null>(null);
  const { items: segItems } = useSegmentationItems(segGroupId);
  const [segItemId, setSegItemId] = useState<number | null>(null);
  const { members: segMembers } = useSegmentMembers(
    segItemId != null ? [String(segItemId)] : [],
  );
  const segMemberIds = useMemo(
    () => new Set(segMembers.map(m => String(m.id))),
    [segMembers],
  );

  const evaluadorOptions: FilterOption[] = evaluatorsInCycle.map(e => ({
    value: String(e.id),
    label: fullName(e),
  }));

  const methods = useForm<FilterValues>({
    defaultValues: { buscarPersona: '', evaluador: null },
  });
  const filters = methods.watch();

  useEffect(() => {
    setPage(1);
  }, [filters.buscarPersona, filters.evaluador, segItemId]);

  const filteredPeople = useMemo(() => {
    return people.filter(person => {
      if (filters.buscarPersona) {
        const q = filters.buscarPersona.toLowerCase();
        const name = fullName(person).toLowerCase();
        if (!name.includes(q) && !(person.email ?? '').toLowerCase().includes(q))
          return false;
      }
      if (filters.evaluador) {
        const hasThisEvaluator = cycleAssignments.some(
          a =>
            a.person_id === String(person.id) &&
            a.evaluator_id === filters.evaluador!.value,
        );
        if (!hasThisEvaluator) return false;
      }
      if (segItemId != null && !segMemberIds.has(String(person.id))) {
        return false;
      }
      return true;
    });
  }, [people, filters, cycleAssignments, segItemId, segMemberIds]);

  const resultFor = (personId: number) =>
    selectedResults.find(r => r.person_id === String(personId));

  const evaluatorNameById = (id: string) => {
    const ev = evaluatorsInCycle.find(e => String(e.id) === id);
    return ev ? fullName(ev) : undefined;
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredPeople.length / ROWS_PER_PAGE),
  );
  const paginatedPeople = filteredPeople.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE,
  );

  const handleViewDetail = (person: HumandUser) => {
    const result = resultFor(person.id);
    const assignment = cycleAssignments.find(
      a => a.person_id === String(person.id),
    );
    openDrawer({
      title: fullName(person),
      size: 'medium',
      children: (
        <PersonDetailContent
          person={person}
          activeD={activeD}
          scores={result?.scores ?? {}}
          evaluatorName={
            assignment ? evaluatorNameById(assignment.evaluator_id) : undefined
          }
          theme={theme}
        />
      ),
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: {
        children: 'Cerrar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const nocivos = useMemo(() => {
    return filteredPeople
      .flatMap(person => {
        const result = resultFor(person.id);
        return Object.entries(result?.scores ?? {})
          .filter(([, score]) => score === 1)
          .map(([subDimId]) => ({
            person,
            subDim: subDimensions.find(sd => sd.id === subDimId),
          }));
      })
      .filter(n => n.subDim);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPeople, selectedResults, subDimensions]);

  const handleExportExcel = () => {
    const cycleName = selectedCycle?.name ?? selectedCycleId;
    const FIXED_COLS = ['Nombre', 'Email', 'Evaluador', 'Estado'];

    // Fila 1: nombre de cada dimensión, ocupando sus sub-dimensiones + su promedio
    // Fila 2: columnas fijas + nombre de cada sub-dimensión + "Promedio" (por dimensión) + "Promedio general"
    const groupRow: (string | number)[] = [...FIXED_COLS.map(() => '')];
    const headerRow: (string | number)[] = [...FIXED_COLS];
    const merges: { s: { r: number; c: number }; e: { r: number; c: number } }[] =
      FIXED_COLS.map((_, i) => ({
        s: { r: 0, c: i },
        e: { r: 1, c: i },
      }));

    activeD.forEach(dim => {
      const start = headerRow.length;
      dim.subDimensions.forEach(sd => {
        groupRow.push('');
        headerRow.push(sd.name);
      });
      groupRow.push(dim.name);
      headerRow.push('Promedio');
      const span = dim.subDimensions.length + 1;
      merges.push({
        s: { r: 0, c: start },
        e: { r: 0, c: start + span - 1 },
      });
    });

    const totalCol = headerRow.length;
    groupRow.push('');
    headerRow.push('Promedio general');
    merges.push({ s: { r: 0, c: totalCol }, e: { r: 1, c: totalCol } });

    const rows = filteredPeople.map(person => {
      const result = resultFor(person.id);
      const assignment = cycleAssignments.find(
        a => a.person_id === String(person.id),
      );
      const evaluatorName = assignment
        ? (evaluatorNameById(assignment.evaluator_id) ?? '')
        : '';
      const estado = result?.submitted_at ? 'Completado' : 'Pendiente';

      const row: (string | number)[] = [
        fullName(person),
        person.email ?? '',
        evaluatorName,
        estado,
      ];

      activeD.forEach(dim => {
        dim.subDimensions.forEach(sd => {
          row.push(result?.scores[sd.id] ?? '');
        });
        const dimAvg = averageOf(
          Object.fromEntries(
            dim.subDimensions.map(sd => [sd.id, result?.scores[sd.id] ?? null]),
          ),
        );
        row.push(dimAvg != null ? Number(dimAvg.toFixed(1)) : '');
      });

      const overallAvg = averageOf(result?.scores);
      row.push(overallAvg != null ? Number(overallAvg.toFixed(1)) : '');

      return row;
    });

    const ws = XLSX.utils.aoa_to_sheet([groupRow, headerRow, ...rows]);
    ws['!merges'] = merges;
    ws['!cols'] = headerRow.map((_, i) => ({ wch: i < 2 ? 24 : 14 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Resultados');
    XLSX.writeFile(wb, `resultados-${cycleName}.xlsx`);
  };

  const activeFiltersCount = [
    filters.buscarPersona,
    filters.evaluador,
    segItemId,
  ].filter(Boolean).length;

  const completedCount = useMemo(() => {
    return filteredPeople.filter(p => resultFor(p.id)?.submitted_at).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPeople, selectedResults]);

  const loading = cyclesLoading || filterLoading;

  if (loading) {
    return (
      <DashboardLayout>
        <Stack
          sx={{
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '400px',
          }}
        >
          <Spinner />
        </Stack>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack
          sx={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
          }}
        >
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
            disabled={filteredPeople.length === 0}
          >
            Exportar Excel
          </Button>
        </Stack>

        {/* Selector de ciclo */}
        {cyclesWithAccess.length > 0 ? (
          <FormControl
            size="small"
            sx={{ maxWidth: 320 }}
          >
            <InputLabel>Ciclo</InputLabel>
            <Select
              label="Ciclo"
              value={selectedCycleId}
              onChange={e => {
                setSelectedCycleId(e.target.value as string);
                setActiveTab(0);
                setPage(1);
              }}
            >
              {cyclesWithAccess.map(cycle => (
                <MenuItem
                  key={cycle.id}
                  value={cycle.id}
                >
                  {cycle.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        ) : (
          <Typography sx={{ color: 'text.secondary' }}>
            No hay ciclos para mostrar.
          </Typography>
        )}

        {assignmentsLoading ? (
          <Stack sx={{ alignItems: 'center', py: 6 }}>
            <Spinner />
          </Stack>
        ) : (
          <>
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
                <Tab
                  label="Dashboard"
                  icon={<IconChartBar size={18} />}
                  iconPosition="start"
                />
                <Tab
                  label="Detalles"
                  icon={<IconList size={18} />}
                  iconPosition="start"
                />
                <Tab
                  label="Alertas"
                  icon={<IconAlertCircle size={18} />}
                  iconPosition="start"
                />
              </Tabs>
            </Box>

            {/* TAB 1: Dashboard */}
            <TabPanel
              value={activeTab}
              index={0}
            >
              <Stack sx={{ gap: 3 }}>
                <Stack
                  sx={{
                    flexDirection: { xs: 'column', md: 'row' },
                    gap: 2,
                    flexWrap: 'wrap',
                  }}
                >
                  <CardContainer
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: 200 },
                    }}
                    padding={16}
                    noHover
                  >
                    <Stack sx={{ gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Evaluaciones completadas
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 700 }}
                      >
                        {completedCount}/{filteredPeople.length}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {filteredPeople.length > 0
                          ? Math.round(
                              (completedCount / filteredPeople.length) * 100,
                            )
                          : 0}
                        % del progreso
                      </Typography>
                    </Stack>
                  </CardContainer>

                  <CardContainer
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: 200 },
                    }}
                    padding={16}
                    noHover
                  >
                    <Stack sx={{ gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Puntajes Nocivo (1)
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 700, color: 'error.main' }}
                      >
                        {nocivos.length}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Requieren atención inmediata
                      </Typography>
                    </Stack>
                  </CardContainer>

                  <CardContainer
                    sx={{
                      flex: { xs: '1 1 100%', md: 1 },
                      minWidth: { xs: '100%', md: 200 },
                    }}
                    padding={16}
                    noHover
                  >
                    <Stack sx={{ gap: 1 }}>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Dimensiones evaluadas
                      </Typography>
                      <Typography
                        variant="h3"
                        sx={{ fontWeight: 700 }}
                      >
                        {activeD.length}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        Sub-dimensiones: {subDimensions.length}
                      </Typography>
                    </Stack>
                  </CardContainer>
                </Stack>

                <CardContainer
                  sx={{ width: '100%' }}
                  padding={16}
                  noHover
                >
                  <Stack sx={{ gap: 2 }}>
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                    >
                      Desglose por Dimensión
                    </Typography>
                    <Stack sx={{ gap: 1 }}>
                      {activeD.map(dim => {
                        const avgScore =
                          filteredPeople.length > 0
                            ? filteredPeople.reduce((sum, p) => {
                                const result = resultFor(p.id);
                                const dimScores = dim.subDimensions
                                  .map(sd => result?.scores[sd.id] ?? 0)
                                  .filter(s => s > 0);
                                return (
                                  sum +
                                  (dimScores.length > 0
                                    ? dimScores.reduce((a, b) => a + b) /
                                      dimScores.length
                                    : 0)
                                );
                              }, 0) / filteredPeople.length
                            : 0;

                        return (
                          <Stack
                            key={dim.id}
                            sx={{ gap: 0.5 }}
                          >
                            <Stack
                              sx={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {dim.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 700, color: 'primary.main' }}
                              >
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
                                  bgcolor:
                                    avgScore >= 3
                                      ? 'success.main'
                                      : avgScore >= 2
                                        ? 'warning.main'
                                        : 'error.main',
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
            <TabPanel
              value={activeTab}
              index={1}
            >
              {/* Filtros */}
              <FormProvider {...methods}>
                <CardContainer
                  padding={16}
                  noHover
                  sx={{ width: '100%' }}
                >
                  <Stack sx={{ gap: 2 }}>
                    {activeFiltersCount > 0 && (
                      <Stack sx={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                        <Button
                          variant="text"
                          size="small"
                          onClick={() => {
                            methods.reset();
                            setSegGroupId(null);
                            setSegItemId(null);
                          }}
                        >
                          Limpiar filtros
                        </Button>
                      </Stack>
                    )}
                    <Stack
                      sx={{
                        flexDirection: { xs: 'column', sm: 'row' },
                        gap: 2,
                        flexWrap: 'wrap',
                      }}
                    >
                      <Stack
                        sx={{
                          flex: { xs: '1 1 100%', sm: '1 1 200px' },
                          minWidth: { xs: '100%', sm: 180 },
                        }}
                      >
                        <FormInputClassic
                          name="buscarPersona"
                          inputProps={{
                            label: 'Buscar persona',
                            placeholder: 'Nombre o email',
                            hasCounter: false,
                          }}
                          rules={{}}
                        />
                      </Stack>
                      {canViewAllResults && (
                        <Stack
                          sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 180px' },
                            minWidth: { xs: '100%', sm: 160 },
                          }}
                        >
                          <FormAutocomplete
                            name="evaluador"
                            autocompleteProps={{ label: 'Evaluador' }}
                            options={evaluadorOptions}
                            rules={{}}
                          />
                        </Stack>
                      )}
                      <Stack
                        sx={{
                          flex: { xs: '1 1 100%', sm: '1 1 180px' },
                          minWidth: { xs: '100%', sm: 160 },
                        }}
                      >
                        <FormControl
                          fullWidth
                          size="small"
                        >
                          <InputLabel>Segmento</InputLabel>
                          <Select
                            label="Segmento"
                            value={segGroupId ?? ''}
                            onChange={e => {
                              setSegGroupId(Number(e.target.value));
                              setSegItemId(null);
                            }}
                          >
                            {segGroups.map(g => (
                              <MenuItem
                                key={g.id}
                                value={g.id}
                              >
                                {g.name}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Stack>
                      {segGroupId != null && (
                        <Stack
                          sx={{
                            flex: { xs: '1 1 100%', sm: '1 1 180px' },
                            minWidth: { xs: '100%', sm: 160 },
                          }}
                        >
                          <FormControl
                            fullWidth
                            size="small"
                          >
                            <InputLabel>Valor</InputLabel>
                            <Select
                              label="Valor"
                              value={segItemId ?? ''}
                              onChange={e => setSegItemId(Number(e.target.value))}
                            >
                              {segItems.map(i => (
                                <MenuItem
                                  key={i.id}
                                  value={i.id}
                                >
                                  {i.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Stack>
                      )}
                    </Stack>
                  </Stack>
                </CardContainer>
              </FormProvider>

              {/* Tabla */}
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell headerCell>Nombre</TableCell>
                      {canViewAllResults && (
                        <TableCell headerCell>Evaluador</TableCell>
                      )}
                      <TableCell
                        headerCell
                        sx={{ textAlign: 'center' }}
                      >
                        Promedio
                      </TableCell>
                      <TableCell
                        headerCell
                        sx={{ textAlign: 'center' }}
                      >
                        Estado
                      </TableCell>
                      <TableCell
                        headerCell
                        sx={{ textAlign: 'right' }}
                      >
                        {' '}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paginatedPeople.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={canViewAllResults ? 5 : 4}
                          sx={{ textAlign: 'center', py: 4 }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            No hay resultados para los filtros seleccionados.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedPeople.map(person => {
                        const result = resultFor(person.id);
                        const avg = averageOf(result?.scores);
                        const assignment = cycleAssignments.find(
                          a => a.person_id === String(person.id),
                        );
                        return (
                          <TableRow key={person.id}>
                            <TableCell>
                              <Stack>
                                <Typography variant="body2">
                                  {fullName(person)}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{ color: 'text.secondary' }}
                                >
                                  {person.email}
                                </Typography>
                              </Stack>
                            </TableCell>
                            {canViewAllResults && (
                              <TableCell>
                                <Typography variant="body2">
                                  {assignment
                                    ? (evaluatorNameById(
                                        assignment.evaluator_id,
                                      ) ?? '—')
                                    : '—'}
                                </Typography>
                              </TableCell>
                            )}
                            <TableCell sx={{ textAlign: 'center' }}>
                              {avg != null ? (
                                <Typography
                                  variant="body2"
                                  sx={getScoreStyle(avg, theme)}
                                >
                                  {avg.toFixed(1)}
                                </Typography>
                              ) : (
                                '—'
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              <Pills
                                label={
                                  result?.submitted_at
                                    ? 'Completado'
                                    : 'Pendiente'
                                }
                                type={
                                  result?.submitted_at ? 'success' : 'neutral'
                                }
                                size="small"
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'right' }}>
                              <Button
                                variant="text"
                                size="small"
                                onClick={() => handleViewDetail(person)}
                              >
                                Ver detalle
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>

              {filteredPeople.length > ROWS_PER_PAGE && (
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onChangePage={setPage}
                />
              )}
            </TabPanel>

            {/* TAB 3: Alertas Nocivo */}
            <TabPanel
              value={activeTab}
              index={2}
            >
              <CardContainer
                sx={{
                  width: '100%',
                  bgcolor: nocivos.length > 0 ? 'error.light' : 'success.light',
                }}
                padding={16}
                noHover
              >
                <Stack sx={{ gap: 2 }}>
                  <Stack
                    sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}
                  >
                    <IconAlertTriangle
                      size={20}
                      color={theme.palette.error.main}
                    />
                    <Typography
                      variant="subtitle1"
                      sx={{ fontWeight: 700 }}
                    >
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
                    <Typography
                      variant="body2"
                      sx={{ color: 'text.secondary', fontStyle: 'italic' }}
                    >
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
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600 }}
                            >
                              {fullName(n.person)}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary' }}
                            >
                              {n.person.email}
                            </Typography>
                          </Stack>
                          <Stack sx={{ flex: 1 }}>
                            <Typography
                              variant="caption"
                              sx={{ color: 'text.secondary' }}
                            >
                              Dimensión
                            </Typography>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 500 }}
                            >
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
          </>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default ResultadosPage;
