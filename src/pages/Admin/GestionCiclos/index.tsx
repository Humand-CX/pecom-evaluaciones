import { useState } from 'react';

import {
  IconCalendarEvent,
  IconDotsVertical,
  IconEdit,
  IconLock,
  IconPlayerPlay,
  IconPlus,
  IconUpload,
} from '@material-hu/icons/tabler';
import IconButton from '@material-hu/mui/IconButton';
import Stack from '@material-hu/mui/Stack';

import Button from '@material-hu/components/design-system/Buttons/Button';
import Pills from '@material-hu/components/design-system/Pills';
import Table from '@material-hu/components/design-system/Table';
import TableBody from '@material-hu/components/design-system/Table/components/TableBody';
import TableCell from '@material-hu/components/design-system/Table/components/TableCell';
import TableContainer from '@material-hu/components/design-system/Table/components/TableContainer';
import TableHead from '@material-hu/components/design-system/Table/components/TableHead';
import TableRow from '@material-hu/components/design-system/Table/components/TableRow';
import Title from '@material-hu/components/design-system/Title';
import StateCard from '@material-hu/components/composed-components/StateCard';
import { useDrawerLayer } from '@material-hu/components/layers/Drawers';
import { useMenuLayer } from '@material-hu/components/layers/Menus';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { type Cycle } from '../../Evaluador/CiclosActivos/types';
import { MOCK_CYCLES, STATUS_CONFIG } from '../../Evaluador/CiclosActivos/constants';
import { CycleForm } from './components/CycleForm';
import { CSVImportModal } from './CSVImportModal';
import { CycleDetailsModal } from './CycleDetailsModal';
import { type CycleFormValues } from './schema';

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('es-AR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

export const GestionCiclosPage = () => {
  const [cycles, setCycles] = useState<Cycle[]>([...MOCK_CYCLES]);
  const { openDrawer, closeDrawer } = useDrawerLayer();
  const { openMenu } = useMenuLayer();

  const handleSave = (values: CycleFormValues, id?: string) => {
    if (id) {
      setCycles(prev => prev.map(c => (c.id === id ? { ...c, ...values } : c)));
    } else {
      const newCycle: Cycle = {
        id: String(Date.now()),
        ...values,
        status: 'draft',
      };
      setCycles(prev => [...prev, newCycle]);
    }
    closeDrawer();
  };

  const handleActivate = (cycle: Cycle) => {
    setCycles(prev => prev.map(c => (c.id === cycle.id ? { ...c, status: 'active' } : c)));
  };

  const handleClose = (cycle: Cycle) => {
    setCycles(prev => prev.map(c => (c.id === cycle.id ? { ...c, status: 'closed' } : c)));
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
          }}
        />
      ),
      primaryButtonProps: { children: 'Guardar', form: 'cycle-form', type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleNew = () => {
    openDrawer({
      title: 'Nuevo ciclo',
      size: 'medium',
      children: <CycleForm formId="cycle-form" onSubmit={values => handleSave(values)} />,
      primaryButtonProps: { children: 'Guardar', form: 'cycle-form', type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleOpenImport = () => {
    openDrawer({
      title: 'Importar asignaciones de evaluadores',
      size: 'medium',
      children: <CSVImportModal onImportSuccess={closeDrawer} />,
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: { children: 'Cerrar', onClick: () => closeDrawer() },
    });
  };

  const handleViewDetails = (cycle: Cycle) => {
    openDrawer({
      title: `${cycle.name} - Detalles`,
      size: 'large',
      children: <CycleDetailsModal cycle={cycle} />,
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: { children: 'Cerrar', onClick: () => closeDrawer() },
    });
  };

  const handleOpenMenu = (e: React.MouseEvent<HTMLElement>, item: Cycle) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        { id: 'edit', title: 'Editar', icon: IconEdit, onSelect: () => handleEdit(item) },
        { id: 'activate', title: 'Activar', icon: IconPlayerPlay, onSelect: () => handleActivate(item) },
        { id: 'close', title: 'Cerrar', icon: IconLock, onSelect: () => handleClose(item) },
      ],
    });
  };

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title title="Gestión de ciclos" description="Administrá los ciclos de evaluación" />
          <Stack sx={{ flexDirection: 'row', gap: 1 }}>
            <Button variant="secondary" startIcon={<IconUpload />} onClick={handleOpenImport}>
              Importar asignaciones
            </Button>
            <Button startIcon={<IconPlus />} onClick={handleNew}>
              Nuevo ciclo
            </Button>
          </Stack>
        </Stack>

        {cycles.length === 0 ? (
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
                      <Pills type={STATUS_CONFIG[cycle.status].type} label={STATUS_CONFIG[cycle.status].label} />
                    </TableCell>
                    <TableCell>
                      <Stack sx={{ flexDirection: 'row', gap: 0.5 }}>
                        <Button variant="secondary" size="small" onClick={() => handleViewDetails(cycle)}>
                          Ver detalles
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
