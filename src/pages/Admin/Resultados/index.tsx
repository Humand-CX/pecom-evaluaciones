import { useMemo, useState } from 'react';

import { IconAlertTriangle, IconDownload, IconChartBar, IconList, IconAlertCircle } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';
import Tab from '@material-hu/mui/Tab';
import Tabs from '@material-hu/mui/Tabs';
import Box from '@material-hu/mui/Box';
import { useTheme } from '@material-hu/mui/styles';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
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
import { DIMENSIONS, MOCK_PEOPLE } from '../../Evaluador/MatrizEvaluacion/constants';
import { MOCK_RESULTS } from './constants';

import type { Theme } from '@material-hu/mui/styles';

const getScoreStyle = (score: number | undefined, theme: Theme) => {
  const base = { fontSize: 13, fontWeight: 600 };
  if (!score) return base;
  if (score === 1) return { ...base, color: theme.palette.error.main, fontWeight: 700 };
  if (score <= 3) return { ...base, color: theme.palette.warning.dark };
  return { ...base, color: theme.palette.success.dark };
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
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const ResultadosPage = () => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;

  const cyclesWithResults = MOCK_CYCLES.filter(c =>
    MOCK_RESULTS.some(r => r.cycleId === c.id),
  );

  const [selectedCycleId, setSelectedCycleId] = useState(cyclesWithResults[0]?.id ?? '');
  const [activeTab, setActiveTab] = useState(0);

  const selectedCycle = MOCK_CYCLES.find(c => c.id === selectedCycleId);

  // Filter dimensions by cycle's dimensionIds
  const activeD = selectedCycle && selectedCycle.dimensionIds && selectedCycle.dimensionIds.length > 0
    ? allDimensions.filter(d => selectedCycle.dimensionIds.includes(d.id))
    : allDimensions;

  const SUB_DIMENSIONS = activeD.flatMap(d => d.subDimensions);

  const selectedResults = MOCK_RESULTS.filter(r => r.cycleId === selectedCycleId);

  const nocivos = useMemo(() => {
    return selectedResults
      .flatMap(r => {
        const person = MOCK_PEOPLE.find(p => p.id === r.personId);
        return Object.entries(r.scores)
          .filter(([, score]) => score === 1)
          .map(([subDimId]) => ({
            person,
            subDim: SUB_DIMENSIONS.find(sd => sd.id === subDimId),
          }));
      })
      .filter(n => n.person && n.subDim);
  }, [selectedResults]);

  const completedCount = useMemo(() => {
    return selectedResults.filter(r =>
      Object.values(r.scores).some(score => score !== undefined)
    ).length;
  }, [selectedResults]);

  const totalExpected = MOCK_PEOPLE.length;

  const handleExportCSV = () => {
    const headers = ['Nombre', 'Legajo', ...SUB_DIMENSIONS.map(sd => sd.name)];
    const rows = MOCK_PEOPLE.map(person => {
      const result = selectedResults.find(r => r.personId === person.id);
      return [
        person.name,
        person.legajo,
        ...SUB_DIMENSIONS.map(sd => result?.scores[sd.id] ?? ''),
      ];
    });
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `resultados-${selectedCycleId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack
          sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}
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
            onClick={handleExportCSV}
          >
            Exportar CSV
          </Button>
        </Stack>

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
                    {completedCount}/{totalExpected}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {Math.round((completedCount / totalExpected) * 100)}% del progreso
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
                    const subCount = dim.subDimensions.length;
                    const avgScore = selectedResults.length > 0
                      ? selectedResults.reduce((sum, r) => {
                        const dimScores = dim.subDimensions.map(sd => r.scores[sd.id] ?? 0).filter(s => s > 0);
                        return sum + (dimScores.length > 0 ? dimScores.reduce((a, b) => a + b) / dimScores.length : 0);
                      }, 0) / selectedResults.length
                      : 0;

                    return (
                      <Stack key={dim.id} sx={{ gap: 0.5 }}>
                        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {dim.name}
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'primary.main' }}>
                            {avgScore.toFixed(1)}
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

        {/* TAB 2: Detalles (Tabla) */}
        <TabPanel value={activeTab} index={1}>
          <TableContainer sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
          <Table sx={{
            tableLayout: 'auto',
            minWidth: 'auto',
            width: '100%',
          }}>
            <colgroup>
              <col style={{ width: 160 }} />
              {SUB_DIMENSIONS.map(sd => (
                <col key={sd.id} style={{ width: 60 }} />
              ))}
            </colgroup>
            <TableHead>
              <TableRow>
                <TableCell
                  headerCell
                  rowSpan={2}
                  sx={{
                    verticalAlign: 'middle',
                    minWidth: 160,
                    fontWeight: 700,
                  }}
                >
                  Persona
                </TableCell>
                {activeD.map(dim => (
                  <TableCell
                    key={dim.id}
                    headerCell
                    colSpan={dim.subDimensions.length}
                    sx={{
                      textAlign: 'center',
                      borderBottom: 1,
                      borderColor: 'divider',
                      fontSize: 12,
                      fontWeight: 600,
                      px: 1,
                      py: 1,
                    }}
                    title={dim.name}
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
                    sx={{
                      textAlign: 'center',
                      verticalAlign: 'middle',
                      pb: 1,
                      px: 0.5,
                      minHeight: 140,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        display: 'block',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                        fontSize: 11,
                        fontWeight: 600,
                        lineHeight: 1.3,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={sd.name}
                    >
                      {sd.name}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_PEOPLE.map(person => {
                const result = selectedResults.find(r => r.personId === person.id);
                return (
                  <TableRow key={person.id}>
                    <TableCell sx={{ verticalAlign: 'top', minWidth: 160 }}>
                      <Stack sx={{ gap: 0.25 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontWeight: 500,
                          }}
                          title={person.name}
                        >
                          {person.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: 'text.secondary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={person.legajo}
                        >
                          {person.legajo}
                        </Typography>
                      </Stack>
                    </TableCell>
                    {SUB_DIMENSIONS.map(sd => {
                      const score = result?.scores[sd.id];
                      return (
                        <TableCell key={sd.id} sx={{ textAlign: 'center', px: 0.5, minWidth: 60 }}>
                          {score != null ? (
                            <Typography variant="body2" sx={getScoreStyle(score, theme)}>
                              {score}
                            </Typography>
                          ) : (
                            <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                              —
                            </Typography>
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
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
