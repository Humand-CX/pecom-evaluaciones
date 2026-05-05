import { useMemo } from 'react';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import { useTheme } from '@material-hu/mui/styles';

import Table from '@material-hu/components/design-system/Table';
import TableBody from '@material-hu/components/design-system/Table/components/TableBody';
import TableCell from '@material-hu/components/design-system/Table/components/TableCell';
import TableContainer from '@material-hu/components/design-system/Table/components/TableContainer';
import TableHead from '@material-hu/components/design-system/Table/components/TableHead';
import TableRow from '@material-hu/components/design-system/Table/components/TableRow';
import Pills from '@material-hu/components/design-system/Pills';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useDimensions } from '../../../providers/DimensionsContext';
import { useEvaluatorAssignments } from '../../../providers/EvaluatorAssignmentsContext';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';
import { DIMENSIONS, MOCK_PEOPLE } from '../../Evaluador/MatrizEvaluacion/constants';
import { MOCK_RESULTS } from '../Resultados/constants';

type CycleDetailsModalProps = {
  cycle: Cycle;
};

export const CycleDetailsModal = ({ cycle }: CycleDetailsModalProps) => {
  const theme = useTheme();
  const { dimensions } = useDimensions();
  const { assignments } = useEvaluatorAssignments();

  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;
  const cycleDimensions = allDimensions.filter(d => cycle.dimensionIds.includes(d.id));
  const subDimensionCount = cycleDimensions.reduce((sum, d) => sum + d.subDimensions.length, 0);

  // Get all results for this cycle
  const cycleResults = MOCK_RESULTS.filter(r => r.cycleId === cycle.id);

  // Calculate completion stats
  const evaluationStats = useMemo(() => {
    let totalExpected = MOCK_PEOPLE.length * subDimensionCount;
    let totalCompleted = 0;

    MOCK_PEOPLE.forEach(person => {
      const result = cycleResults.find(r => r.personId === person.id);
      if (result) {
        const completedCount = Object.values(result.scores).filter(score => score != null).length;
        totalCompleted += completedCount;
      }
    });

    const percentage = totalExpected > 0 ? Math.round((totalCompleted / totalExpected) * 100) : 0;
    return { totalCompleted, totalExpected, percentage };
  }, [cycleResults, subDimensionCount]);

  // Build table data with evaluators and completion status
  const tableData = MOCK_PEOPLE.map(person => {
    const personAssignments = assignments.filter(
      a => a.cycleId === cycle.id && a.personId === person.id
    );
    const uniqueEvaluators = [...new Set(personAssignments.map(a => a.evaluatorId))];

    const result = cycleResults.find(r => r.personId === person.id);
    const completedScores = result
      ? Object.values(result.scores).filter(score => score != null).length
      : 0;
    const isCompleted = completedScores === subDimensionCount && subDimensionCount > 0;

    return {
      person,
      evaluators: uniqueEvaluators.length > 0 ? uniqueEvaluators : ['Sin asignar'],
      isCompleted,
      completedScores,
    };
  });

  return (
    <Stack sx={{ gap: 3 }}>
      {/* Progress Card */}
      <CardContainer padding={12}>
        <Stack sx={{ gap: 1 }}>
          <Typography variant="subtitle1">Progreso del Ciclo</Typography>
          <Stack sx={{ gap: 0.5 }}>
            <Typography variant="body2">
              {evaluationStats.totalCompleted} de {evaluationStats.totalExpected} respuestas completadas
            </Typography>
            <Stack sx={{ height: 8, bgcolor: 'divider', borderRadius: 1, overflow: 'hidden' }}>
              <Stack
                sx={{
                  height: '100%',
                  width: `${evaluationStats.percentage}%`,
                  bgcolor: evaluationStats.percentage === 100 ? 'success.main' : 'primary.main',
                  transition: 'width 0.3s ease',
                }}
              />
            </Stack>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {evaluationStats.percentage}% completado
            </Typography>
          </Stack>
        </Stack>
      </CardContainer>

      {/* Dimensiones asociadas */}
      <CardContainer padding={12}>
        <Stack sx={{ gap: 1 }}>
          <Typography variant="subtitle2">Dimensiones ({cycleDimensions.length})</Typography>
          <Stack sx={{ gap: 0.5, flexWrap: 'wrap', flexDirection: 'row' }}>
            {cycleDimensions.map(dim => (
              <Pills key={dim.id} label={dim.name} type="info" size="small" />
            ))}
          </Stack>
        </Stack>
      </CardContainer>

      {/* Evaluations Table */}
      <Stack sx={{ gap: 1 }}>
        <Typography variant="subtitle1">Estado de Evaluaciones</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell headerCell>Persona</TableCell>
                <TableCell headerCell>Evaluadores Asignados</TableCell>
                <TableCell headerCell>Estado</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tableData.map(row => (
                <TableRow key={row.person.id}>
                  <TableCell>
                    <Stack sx={{ gap: 0 }}>
                      <Typography variant="body2">{row.person.name}</Typography>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {row.person.legajo}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack sx={{ gap: 0.5 }}>
                      {row.evaluators.map((evaluator, idx) => (
                        <Typography key={idx} variant="caption">
                          {evaluator}
                        </Typography>
                      ))}
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Pills
                      label={
                        row.evaluators[0] === 'Sin asignar'
                          ? 'Sin evaluadores'
                          : row.isCompleted
                            ? 'Completado'
                            : `${row.completedScores}/${subDimensionCount} respuestas`
                      }
                      type={
                        row.evaluators[0] === 'Sin asignar'
                          ? 'disabled'
                          : row.isCompleted
                            ? 'success'
                            : 'warning'
                      }
                      size="small"
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Stack>

      {/* Summary Stats */}
      {evaluationStats.totalExpected > 0 && (
        <CardContainer padding={12}>
          <Stack sx={{ gap: 1.5 }}>
            <Typography variant="subtitle2">Resumen</Typography>
            <Stack sx={{ gap: 0.5 }}>
              <Typography variant="caption">
                <strong>Total de personas:</strong> {MOCK_PEOPLE.length}
              </Typography>
              <Typography variant="caption">
                <strong>Dimensiones del ciclo:</strong> {cycleDimensions.length}
              </Typography>
              <Typography variant="caption">
                <strong>Sub-dimensiones totales:</strong> {subDimensionCount}
              </Typography>
              <Typography variant="caption">
                <strong>Respuestas esperadas:</strong> {evaluationStats.totalExpected}
              </Typography>
            </Stack>
          </Stack>
        </CardContainer>
      )}
    </Stack>
  );
};
