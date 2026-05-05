import { FormProvider, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconRuler,
  IconTrash,
} from '@material-hu/icons/tabler';
import IconButton from '@material-hu/mui/IconButton';
import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';

import StateCard from '@material-hu/components/composed-components/StateCard';
import Button from '@material-hu/components/design-system/Buttons/Button';
import CardContainer from '@material-hu/components/design-system/CardContainer';
import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';
import Title from '@material-hu/components/design-system/Title';
import { useDialogLayer } from '@material-hu/components/layers/Dialogs';
import { useDrawerLayer } from '@material-hu/components/layers/Drawers';
import { useMenuLayer } from '@material-hu/components/layers/Menus';

import { DashboardLayout } from '../../../layouts/DashboardLayout';
import { useDimensions } from '../../../providers/DimensionsContext';

import { nameSchema, type NameFormValues } from './schema';

const FORM_ID = 'dimension-name-form';

type NameFormProps = {
  onSubmit: (values: NameFormValues) => void;
  defaultValues?: NameFormValues;
  placeholder?: string;
};

const NameForm = ({ onSubmit, defaultValues, placeholder }: NameFormProps) => {
  const methods = useForm<NameFormValues>({
    resolver: zodResolver(nameSchema),
    defaultValues: defaultValues ?? { name: '' },
  });

  return (
    <FormProvider {...methods}>
      <form id={FORM_ID} onSubmit={methods.handleSubmit(onSubmit)}>
        <FormInputClassic
          name="name"
          inputProps={{ label: 'Nombre*', placeholder }}
          rules={{}}
        />
      </form>
    </FormProvider>
  );
};

export const DimensionesPage = () => {
  const {
    dimensions,
    addDimension,
    updateDimension,
    deleteDimension,
    addSubDimension,
    updateSubDimension,
    deleteSubDimension,
    duplicateDimension,
  } = useDimensions();

  const { openDrawer, closeDrawer } = useDrawerLayer();
  const { openDialog, closeDialog } = useDialogLayer();
  const { openMenu } = useMenuLayer();

  const handleNewDimension = () => {
    openDrawer({
      title: 'Nueva dimensión',
      size: 'medium',
      children: (
        <NameForm
          onSubmit={values => {
            addDimension(values.name);
            closeDrawer();
          }}
          placeholder="Ej: Disciplina Operacional"
        />
      ),
      primaryButtonProps: { children: 'Guardar', form: FORM_ID, type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleEditDimension = (id: string, name: string) => {
    openDrawer({
      title: 'Editar dimensión',
      size: 'medium',
      children: (
        <NameForm
          onSubmit={values => {
            updateDimension(id, values.name);
            closeDrawer();
          }}
          defaultValues={{ name }}
        />
      ),
      primaryButtonProps: { children: 'Guardar', form: FORM_ID, type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleDeleteDimension = (id: string, name: string) => {
    openDialog({
      title: `¿Eliminar "${name}"?`,
      textBody: 'Se eliminarán también todas sus sub-dimensiones. Esta acción no se puede deshacer.',
      primaryButtonProps: {
        children: 'Eliminar',
        onClick: () => {
          deleteDimension(id);
          closeDialog();
        },
      },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDialog() },
    });
  };

  const handleDuplicateDimension = (id: string) => {
    duplicateDimension(id);
  };

  const handleNewSubDimension = (dimensionId: string) => {
    openDrawer({
      title: 'Nueva sub-dimensión',
      size: 'medium',
      children: (
        <NameForm
          onSubmit={values => {
            addSubDimension(dimensionId, values.name);
            closeDrawer();
          }}
          placeholder="Ej: Compromiso con la Seguridad"
        />
      ),
      primaryButtonProps: { children: 'Guardar', form: FORM_ID, type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleEditSubDimension = (dimensionId: string, subId: string, name: string) => {
    openDrawer({
      title: 'Editar sub-dimensión',
      size: 'medium',
      children: (
        <NameForm
          onSubmit={values => {
            updateSubDimension(dimensionId, subId, values.name);
            closeDrawer();
          }}
          defaultValues={{ name }}
        />
      ),
      primaryButtonProps: { children: 'Guardar', form: FORM_ID, type: 'submit' },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDrawer() },
    });
  };

  const handleDeleteSubDimension = (dimensionId: string, subId: string, name: string) => {
    openDialog({
      title: `¿Eliminar "${name}"?`,
      textBody: 'Esta acción no se puede deshacer.',
      primaryButtonProps: {
        children: 'Eliminar',
        onClick: () => {
          deleteSubDimension(dimensionId, subId);
          closeDialog();
        },
      },
      secondaryButtonProps: { children: 'Cancelar', onClick: () => closeDialog() },
    });
  };

  const handleDimensionMenu = (e: React.MouseEvent<HTMLElement>, id: string, name: string) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        { id: 'edit', title: 'Editar', icon: IconEdit, onSelect: () => handleEditDimension(id, name) },
        { id: 'duplicate', title: 'Duplicar', icon: IconCopy, onSelect: () => handleDuplicateDimension(id) },
        { id: 'add-sub', title: 'Agregar sub-dimensión', icon: IconPlus, onSelect: () => handleNewSubDimension(id) },
        { id: 'delete', title: 'Eliminar', icon: IconTrash, onSelect: () => handleDeleteDimension(id, name) },
      ],
    });
  };

  const handleSubDimensionMenu = (
    e: React.MouseEvent<HTMLElement>,
    dimensionId: string,
    subId: string,
    name: string,
  ) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        { id: 'edit', title: 'Editar', icon: IconEdit, onSelect: () => handleEditSubDimension(dimensionId, subId, name) },
        { id: 'delete', title: 'Eliminar', icon: IconTrash, onSelect: () => handleDeleteSubDimension(dimensionId, subId, name) },
      ],
    });
  };

  return (
    <DashboardLayout>
      <Stack sx={{ gap: 3 }}>
        <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Title title="Banco de dimensiones" description="Administrá las dimensiones y sub-dimensiones de evaluación." />
          <Button startIcon={<IconPlus />} onClick={handleNewDimension}>
            Nueva dimensión
          </Button>
        </Stack>

        {dimensions.length === 0 ? (
          <StateCard
            slotProps={{
              title: { title: 'No hay dimensiones creadas', variant: 'M' },
              avatar: { Icon: IconRuler, color: 'default' },
            }}
          />
        ) : (
          <Stack sx={{ gap: 2 }}>
            {dimensions.map(dim => (
              <CardContainer key={dim.id} padding={16} noHover>
                <Stack sx={{ gap: 2 }}>
                  <Stack sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="subtitle1">{dim.name}</Typography>
                    <IconButton onClick={e => handleDimensionMenu(e, dim.id, dim.name)}>
                      <IconDotsVertical />
                    </IconButton>
                  </Stack>

                  {dim.subDimensions.length > 0 && (
                    <Stack sx={{ gap: 0.5, pl: 2 }}>
                      {dim.subDimensions.map(sd => (
                        <Stack
                          key={sd.id}
                          sx={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}
                        >
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                            {sd.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={e => handleSubDimensionMenu(e, dim.id, sd.id, sd.name)}
                          >
                            <IconDotsVertical size={16} />
                          </IconButton>
                        </Stack>
                      ))}
                    </Stack>
                  )}

                  <Button
                    variant="text"
                    size="small"
                    startIcon={<IconPlus size={16} />}
                    onClick={() => handleNewSubDimension(dim.id)}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Agregar sub-dimensión
                  </Button>
                </Stack>
              </CardContainer>
            ))}
          </Stack>
        )}
      </Stack>
    </DashboardLayout>
  );
};

export default DimensionesPage;
