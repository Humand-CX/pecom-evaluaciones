import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';
import Divider from '@material-hu/mui/Divider';

import { useDialogLayer } from '@material-hu/components/layers/Dialogs';
import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import Pills from '@material-hu/components/design-system/Pills';
import Title from '@material-hu/components/design-system/Title';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';
import { MOCK_CYCLES, STATUS_CONFIG } from '../CiclosActivos/constants';

import { ScoreSelector } from './components/ScoreSelector';
import { DIMENSIONS, MOCK_PEOPLE } from './constants';
import { type ScoreMatrix, type ScoreValue } from './types';

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export default function MatrizEvaluacionPage() {
  const { cycleId } = useParams<{ cycleId: string }>();
  const navigate = useNavigate();
  const { openDialog, closeDialog } = useDialogLayer();
  const { dimensions } = useDimensions();

  const cycle = MOCK_CYCLES.find(c => c.id === cycleId) ?? MOCK_CYCLES[0];
  const allDimensions = dimensions.length > 0 ? dimensions : DIMENSIONS;

  // Filter dimensions by cycle's dimensionIds
  const activeD = cycle.dimensionIds && cycle.dimensionIds.length > 0
    ? allDimensions.filter(d => cycle.dimensionIds.includes(d.id))
    : allDimensions;

  const subDimensions = activeD.flatMap(d => d.subDimensions);

  const initScores = (): ScoreMatrix => {
    const matrix: ScoreMatrix = {};
    MOCK_PEOPLE.forEach(p => {
      matrix[p.id] = {};
      subDimensions.forEach(sd => {
        matrix[p.id][sd.id] = null;
      });
    });
    return matrix;
  };

  const statusConfig = STATUS_CONFIG[cycle.status];

  const [scores, setScores] = useState<ScoreMatrix>(initScores);
  const [submitted, setSubmitted] = useState(false);

  const handleScoreChange = (personId: string, subDimId: string, value: ScoreValue) => {
    setScores(prev => ({
      ...prev,
      [personId]: { ...prev[personId], [subDimId]: value },
    }));
  };

  const allFilled = MOCK_PEOPLE.every(p =>
    subDimensions.every(sd => scores[p.id]?.[sd.id] != null),
  );

  const handleSubmitClick = () => {
    openDialog({
      title: '¿Enviar evaluación?',
      textBody: 'Una vez enviada no podrás modificar los puntajes.',
      primaryButtonProps: {
        children: 'Enviar',
        onClick: () => {
          setSubmitted(true);
          closeDialog();
        },
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDialog(),
      },
    });
  };

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack
          sx={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 2,
          }}
        >
          <Title
            title={cycle.name}
            description={`${formatDate(cycle.start_date)} — ${formatDate(cycle.end_date)}`}
            variant="L"
          />
          <Pills label={statusConfig.label} type={statusConfig.type} size="small" />
        </Stack>

        {submitted && (
          <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
            Evaluación enviada correctamente. Los puntajes están en modo lectura.
          </Typography>
        )}

        {activeD.map(dim =>
          dim.subDimensions.map(sd => (
            <CardContainer key={sd.id} padding={16} sx={{ width: '100%' }}>
              <Stack sx={{ gap: 2 }}>
                <Stack sx={{ gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.5 }}
                  >
                    {dim.name}
                  </Typography>
                  <Typography variant="subtitle1">{sd.name}</Typography>
                </Stack>

                <Divider />

                <Stack sx={{ gap: 0 }}>
                  {MOCK_PEOPLE.map((person, idx) => (
                    <Stack
                      key={person.id}
                      sx={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1.5,
                        borderTop: idx > 0 ? '1px solid' : 'none',
                        borderColor: 'divider',
                      }}
                    >
                      <Stack sx={{ gap: 0.25, minWidth: 0, flex: 1 }}>
                        <Typography variant="body2">{person.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {person.legajo}
                        </Typography>
                      </Stack>
                      <ScoreSelector
                        value={scores[person.id]?.[sd.id] ?? null}
                        onChange={v => handleScoreChange(person.id, sd.id, v)}
                        disabled={submitted}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContainer>
          )),
        )}

        <Stack sx={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="secondary"
            size="large"
            disabled={submitted}
            onClick={() => navigate('/evaluador/ciclos')}
          >
            Guardar progreso
          </Button>
          <Button
            variant="primary"
            size="large"
            disabled={!allFilled || submitted}
            onClick={handleSubmitClick}
          >
            {submitted ? 'Evaluación enviada' : 'Enviar evaluación'}
          </Button>
        </Stack>
      </Stack>
    </DashboardLayout>
  );
}
