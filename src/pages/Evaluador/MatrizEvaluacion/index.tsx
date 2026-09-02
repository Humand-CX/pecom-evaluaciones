import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import { IconInfoCircle } from '@material-hu/icons/tabler';
import Divider from '@material-hu/mui/Divider';
import Stack from '@material-hu/mui/Stack';
import Tooltip from '@material-hu/mui/Tooltip';
import Typography from '@material-hu/mui/Typography';

import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import Pills from '@material-hu/components/design-system/Pills';
import Spinner from '@material-hu/components/design-system/ProgressIndicators/Spinner';
import Title from '@material-hu/components/design-system/Title';
import { useDialogLayer } from '@material-hu/components/layers/Dialogs';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';
import { useUser } from '../../../providers/UserContext';
import { useHumandUsersByIds } from '../../../hooks/useHumandSegmentation';
import { assignmentsService } from '../../../services/supabase/assignments';
import { cyclesService, type Cycle as SupabaseCycle } from '../../../services/supabase/cycles';
import {
  evaluationResultsService,
  type EvaluationResultRow,
} from '../../../services/supabase/evaluationResults';
import { STATUS_CONFIG } from '../CiclosActivos/constants';

import { ScoreSelector } from './components/ScoreSelector';
import { type ScoreValue } from './types';

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
  const { user } = useUser();
  const evaluatorId = user?.humandUserId ? String(user.humandUserId) : null;

  const [cycle, setCycle] = useState<SupabaseCycle | null>(null);
  const [personIds, setPersonIds] = useState<string[]>([]);
  const [existingResults, setExistingResults] = useState<EvaluationResultRow[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { users: persons } = useHumandUsersByIds(personIds);

  useEffect(() => {
    if (!cycleId || !evaluatorId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([
      cyclesService.getById(cycleId),
      assignmentsService.getByEvaluator(evaluatorId),
      evaluationResultsService.getByCycleAndEvaluator(cycleId, evaluatorId),
    ])
      .then(([cycleRow, myAssignments, results]) => {
        setCycle(cycleRow);
        setPersonIds([
          ...new Set(
            myAssignments
              .filter(a => a.cycle_id === cycleId)
              .map(a => a.person_id),
          ),
        ]);
        setExistingResults(results);
      })
      .finally(() => setLoading(false));
  }, [cycleId, evaluatorId]);

  const allDimensions = dimensions;
  const cycleDimensionIds = cycle?.dimension_ids ?? [];
  const activeD =
    cycleDimensionIds.length > 0
      ? allDimensions.filter(d => cycleDimensionIds.includes(d.id))
      : [];
  const subDimensions = activeD.flatMap(d => d.subDimensions);

  const [scores, setScores] = useState<Record<string, Record<string, ScoreValue | null>>>(
    {},
  );

  useEffect(() => {
    const initial: Record<string, Record<string, ScoreValue | null>> = {};
    persons.forEach(p => {
      const existing = existingResults.find(r => r.person_id === String(p.id));
      initial[p.id] = {};
      subDimensions.forEach(sd => {
        initial[p.id][sd.id] = (existing?.scores?.[sd.id] as ScoreValue) ?? null;
      });
    });
    setScores(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persons, existingResults, activeD.length]);

  const submitted = existingResults.some(r => r.submitted_at);

  const handleScoreChange = (
    personId: string,
    subDimId: string,
    value: ScoreValue,
  ) => {
    setScores(prev => ({
      ...prev,
      [personId]: { ...prev[personId], [subDimId]: value },
    }));
  };

  const allFilled =
    persons.length > 0 &&
    persons.every(p =>
      subDimensions.every(sd => scores[p.id]?.[sd.id] != null),
    );

  const persist = async (markSubmitted: boolean) => {
    if (!cycleId || !evaluatorId) return;
    setSaving(true);
    try {
      const rows = await Promise.all(
        persons.map(p =>
          evaluationResultsService.upsert({
            id: `${cycleId}-${p.id}-${evaluatorId}`,
            cycle_id: cycleId,
            person_id: String(p.id),
            evaluator_id: evaluatorId,
            scores: scores[p.id] ?? {},
            submitted_at: markSubmitted ? new Date().toISOString() : null,
          }),
        ),
      );
      setExistingResults(rows);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveProgress = async () => {
    await persist(false);
    navigate('/evaluador/ciclos');
  };

  const handleSubmitClick = () => {
    openDialog({
      title: '¿Enviar evaluación?',
      textBody: 'Una vez enviada no podrás modificar los puntajes.',
      primaryButtonProps: {
        children: 'Enviar',
        onClick: () => {
          void persist(true);
          closeDialog();
        },
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDialog(),
      },
    });
  };

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

  if (!cycle) {
    return (
      <DashboardLayout>
        <Typography>No se encontró el ciclo.</Typography>
      </DashboardLayout>
    );
  }

  const statusConfig = STATUS_CONFIG[cycle.status];

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
            description={`${formatDate(cycle.start_date ?? '')} — ${formatDate(cycle.end_date ?? '')}`}
            variant="L"
          />
          <Pills
            label={statusConfig.label}
            type={statusConfig.type}
            size="small"
          />
        </Stack>

        {submitted && (
          <Typography
            variant="body2"
            sx={{ color: 'success.main', fontWeight: 600 }}
          >
            Evaluación enviada correctamente. Los puntajes están en modo
            lectura.
          </Typography>
        )}

        {persons.length === 0 && (
          <Typography sx={{ color: 'text.secondary' }}>
            No tenés personas asignadas para evaluar en este ciclo.
          </Typography>
        )}

        {activeD.map(dim =>
          dim.subDimensions.map(sd => (
            <CardContainer
              key={sd.id}
              padding={16}
              sx={{ width: '100%' }}
            >
              <Stack sx={{ gap: 2 }}>
                <Stack sx={{ gap: 0.5 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    {dim.name}
                  </Typography>
                  <Stack
                    sx={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 1,
                    }}
                  >
                    <Typography variant="subtitle1">{sd.name}</Typography>
                    {sd.description && (
                      <Tooltip
                        title={sd.description}
                        arrow
                        placement="top"
                        sx={{ cursor: 'help' }}
                      >
                        <IconInfoCircle
                          size={18}
                          style={{
                            marginTop: '2px',
                            flexShrink: 0,
                            opacity: 0.6,
                          }}
                        />
                      </Tooltip>
                    )}
                  </Stack>
                </Stack>

                <Divider />

                <Stack sx={{ gap: 0 }}>
                  {persons.map((person, idx) => (
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
                        <Typography variant="body2">
                          {person.firstName} {person.lastName}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {person.email}
                        </Typography>
                      </Stack>
                      <ScoreSelector
                        value={scores[person.id]?.[sd.id] ?? null}
                        onChange={v => handleScoreChange(String(person.id), sd.id, v)}
                        disabled={submitted}
                      />
                    </Stack>
                  ))}
                </Stack>
              </Stack>
            </CardContainer>
          )),
        )}

        {persons.length > 0 && (
          <Stack
            sx={{ flexDirection: 'row', gap: 2, justifyContent: 'flex-end' }}
          >
            <Button
              variant="secondary"
              size="large"
              disabled={submitted || saving}
              onClick={handleSaveProgress}
            >
              {saving ? 'Guardando...' : 'Guardar progreso'}
            </Button>
            <Button
              variant="primary"
              size="large"
              disabled={!allFilled || submitted || saving}
              onClick={handleSubmitClick}
            >
              {submitted ? 'Evaluación enviada' : 'Enviar evaluación'}
            </Button>
          </Stack>
        )}
      </Stack>
    </DashboardLayout>
  );
}
