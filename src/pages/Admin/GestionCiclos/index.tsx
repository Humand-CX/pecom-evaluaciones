import { useEffect, useState } from 'react';

import {
  IconCalendarEvent,
  IconDotsVertical,
  IconEdit,
  IconLock,
  IconPlayerPlay,
  IconPlus,
} from '@material-hu/icons/tabler';
import IconButton from '@material-hu/mui/IconButton';
import Stack from '@material-hu/mui/Stack';

import StateCard from '@material-hu/components/composed-components/StateCard';
import Button from '@material-hu/components/design-system/Buttons/Button';
import Pills from '@material-hu/components/design-system/Pills';
import Table from '@material-hu/components/design-system/Table';
import TableBody from '@material-hu/components/design-system/Table/components/TableBody';
import TableCell from '@material-hu/components/design-system/Table/components/TableCell';
import TableContainer from '@material-hu/components/design-system/Table/components/TableContainer';
import TableHead from '@material-hu/components/design-system/Table/components/TableHead';
import TableRow from '@material-hu/components/design-system/Table/components/TableRow';
import Title from '@material-hu/components/design-system/Title';
import { useDrawerLayer } from '@material-hu/components/layers/Drawers';
import { useMenuLayer } from '@material-hu/components/layers/Menus';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';
import { cyclesService, type Cycle as SupabaseCycle } from '../../../services/supabase/cycles';
import { STATUS_CONFIG } from '../../Evaluador/CiclosActivos/constants';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';

import { CycleDetailsModal } from './CycleDetailsModal';
import { CycleForm } from './components/CycleForm';
import { EvaluatorAssignmentModal } from './EvaluatorAssignmentModal';
import { type CycleFormValues } from './schema';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

const toFrontendCycle = (row: SupabaseCycle): Cycle => ({
  id: row.id,
  name: row.name,
  project_name: row.project_name ?? '',
  start_date: row.start_date ?? '',
  end_date: row.end_date ?? '',
  status: row.status,
  dimensionIds: row.dimension_ids ?? [],
  segmentIds: row.segment_ids ?? [],
});

export const GestionCiclosPage = () => {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [loading, setLoading] = useState(true);
  const { openDrawer, closeDrawer } = useDrawerLayer();
  const { openMenu } = useMenuLayer();
  const { dimensions } = useDimensions();

  useEffect(() => {
    cyclesService
      .getAll()
      .then(rows => setCycles(rows.map(toFrontendCycle)))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (values: CycleFormValues, id?: string) => {
    // Descarta cualquier dimensión que ya no exista (ej: quedó de una versión
    // anterior del ciclo) — de lo contrario rompe el insert de asignaciones
    // por la foreign key a `dimensions`.
    const validDimensionIds = (values.dimensionIds ?? []).filter(dId =>
      dimensions.some(d => d.id === dId),
    );

    if (id) {
      const updated = await cyclesService.update(id, {
        name: values.name,
        project_name: values.project_name,
        start_date: values.start_date,
        end_date: values.end_date,
        dimension_ids: validDimensionIds,
        segment_ids: values.segmentIds,
      });
      setCycles(prev =>
        prev.map(c => (c.id === id ? toFrontendCycle(updated) : c)),
      );
    } else {
      const created = await cyclesService.create({
        id: String(Date.now()),
        name: values.name || '',
        project_name: values.project_name || '',
        start_date: values.start_date || '',
        end_date: values.end_date || '',
        dimension_ids: validDimensionIds,
        segment_ids: values.segmentIds || [],
        status: 'draft',
      });
      setCycles(prev => [...prev, toFrontendCycle(created)]);
    }
    closeDrawer();
  };

  const handleActivate = async (cycle: Cycle) => {
    await cyclesService.update(cycle.id, { status: 'active' });
    setCycles(prev =>
      prev.map(c => (c.id === cycle.id ? { ...c, status: 'active' } : c)),
    );
  };

  const handleClose = async (cycle: Cycle) => {
    await cyclesService.update(cycle.id, { status: 'closed' });
    setCycles(prev =>
      prev.map(c => (c.id === cycle.id ? { ...c, status: 'closed' } : c)),
    );
  };

  const handleEdit = (cycle: Cycle) => {
    openDrawer({
      title: 'Editar ciclo',
      size: 'medium',
      children: (
        <CycleForm
          formId="cycle-form"
          onSubmit={values => handleSave(values, cycle.id)}
          defaultValues={{
            name: cycle.name,
            project_name: cycle.project_name,
            start_date: cycle.start_date,
            end_date: cycle.end_date,
            dimensionIds: cycle.dimensionIds ?? [],
            segmentIds: cycle.segmentIds ?? [],
          }}
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: 'cycle-form',
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleNew = () => {
    openDrawer({
      title: 'Nuevo ciclo',
      size: 'medium',
      children: (
        <CycleForm
          formId="cycle-form"
          onSubmit={values => handleSave(values)}
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: 'cycle-form',
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleViewDetails = (cycle: Cycle) => {
    openDrawer({
      title: `${cycle.name} - Detalles`,
      size: 'large',
      children: <CycleDetailsModal cycle={cycle} />,
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: {
        children: 'Cerrar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleAssignEvaluators = (cycle: Cycle) => {
    openDrawer({
      title: `${cycle.name} - Asignar Evaluadores`,
      size: 'medium',
      children: (
        <EvaluatorAssignmentModal
          cycle={cycle}
          onSuccess={closeDrawer}
        />
      ),
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: {
        children: 'Cerrar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, item: Cycle) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        {
          id: 'edit',
          title: 'Editar',
          icon: IconEdit,
          onSelect: () => handleEdit(item),
        },
        {
          id: 'activate',
          title: 'Activar',
          icon: IconPlayerPlay,
          onSelect: () => handleActivate(item),
        },
        {
          id: 'close',
          title: 'Cerrar',
          icon: IconLock,
          onSelect: () => handleClose(item),
        },
      ],
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
          }}
        >
          <Title
            title="Gestión de ciclos"
            description="Administrá los ciclos de evaluación"
          />
          <Stack sx={{ flexDirection: 'row', gap: 1 }}>
            <Button
              startIcon={<IconPlus />}
              onClick={handleNew}
            >
              Nuevo ciclo
            </Button>
          </Stack>
        </Stack>

        {loading ? null : cycles.length === 0 ? (
          <StateCard
            slotProps={{
              title: { title: 'No hay ciclos creados', variant: 'M' },
              avatar: { Icon: IconCalendarEvent, color: 'default' },
            }}
          />
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell headerCell>Nombre</TableCell>
                  <TableCell headerCell>Proyecto</TableCell>
                  <TableCell headerCell>Fecha inicio</TableCell>
                  <TableCell headerCell>Fecha fin</TableCell>
                  <TableCell headerCell>Estado</TableCell>
                  <TableCell headerCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cycles.map(cycle => (
                  <TableRow key={cycle.id}>
                    <TableCell>{cycle.name}</TableCell>
                    <TableCell>{cycle.project_name}</TableCell>
                    <TableCell>{formatDate(cycle.start_date)}</TableCell>
                    <TableCell>{formatDate(cycle.end_date)}</TableCell>
                    <TableCell>
                      <Pills
                        type={STATUS_CONFIG[cycle.status].type}
                        label={STATUS_CONFIG[cycle.status].label}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack sx={{ flexDirection: 'row', gap: 0.5 }}>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleViewDetails(cycle)}
                        >
                          Ver detalles
                        </Button>
                        <Button
                          variant="secondary"
                          size="small"
                          onClick={() => handleAssignEvaluators(cycle)}
                        >
                          Asignar evaluadores
                        </Button>
                        <IconButton onClick={e => handleOpenMenu(e, cycle)}>
                          <IconDotsVertical />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default GestionCiclosPage;
