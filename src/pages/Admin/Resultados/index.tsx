import { useMemo, useState } from 'react';

import { IconAlertTriangle, IconDownload } from '@material-hu/icons/tabler';
import Stack from '@material-hu/mui/Stack';
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

export const ResultadosPage = () => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;

  const cyclesWithResults = MOCK_CYCLES.filter(c =>
    MOCK_RESULTS.some(r => r.cycleId === c.id),
  );

  const [selectedCycleId, setSelectedCycleId] = useState(cyclesWithResults[0]?.id ?? '');

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
              onClick={() => setSelectedCycleId(cycle.id)}
            >
              {cycle.name}
            </Button>
          ))}
        </Stack>

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
                    sx={{
                      textAlign: 'center',
                      borderBottom: 0,
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      fontSize: 11,
                      px: 0.5,
                    }}
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
                      sx={{
                        display: 'block',
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        whiteSpace: 'nowrap',
                        fontSize: 10,
                        fontWeight: 600,
                        lineHeight: 1.2,
                        height: 160,
                        overflow: 'hidden',
                      }}
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
                    <TableCell sx={{ overflow: 'hidden' }}>
                      <Stack>
                        <Typography
                          variant="body2"
                          sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                        >
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
                          ) : (
                            '—'
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

        <CardContainer sx={{ width: '100%' }} padding={16} noHover>
          <Stack sx={{ gap: 2 }}>
            <Stack sx={{ flexDirection: 'row', alignItems: 'center', gap: 1 }}>
              <IconAlertTriangle size={20} color={theme.palette.error.main} />
              <Typography variant="subtitle1">Alertas Nocivo</Typography>
              {nocivos.length > 0 && (
                <Typography
                  variant="caption"
                  sx={{
                    bgcolor: theme.palette.error.light,
                    color: theme.palette.error.dark,
                    borderRadius: '4px',
                    px: 1,
                    fontWeight: 700,
                  }}
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
