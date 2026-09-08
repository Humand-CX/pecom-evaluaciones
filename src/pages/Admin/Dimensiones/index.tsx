import { useEffect, useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  IconCopy,
  IconDotsVertical,
  IconEdit,
  IconPlus,
  IconRuler,
  IconTrash,
  IconUpload,
} from '@material-hu/icons/tabler';
import IconButton from '@material-hu/mui/IconButton';
import Stack from '@material-hu/mui/Stack';
import TextField from '@material-hu/mui/TextField';
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
import { useScoreLabels } from '../../../providers/ScoreLabelsContext';

import { DimensionsCSVImportModal } from './DimensionsCSVImportModal';
import {
  type DimensionFormValues,
  dimensionSchema,
  type SubDimensionFormValues,
  subDimensionSchema,
} from './schema';

const FORM_ID = 'dimension-name-form';
const FORM_ID_SUB = 'sub-dimension-form';

type DimensionFormProps = {
  onSubmit: (values: DimensionFormValues) => void;
  defaultValues?: DimensionFormValues;
  placeholder?: string;
};

const DimensionForm = ({
  onSubmit,
  defaultValues,
  placeholder,
}: DimensionFormProps) => {
  const methods = useForm<DimensionFormValues>({
    resolver: zodResolver(dimensionSchema),
    defaultValues: defaultValues ?? { name: '', description: '' },
  });

  return (
    <FormProvider {...methods}>
      <form
        id={FORM_ID}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <Stack sx={{ gap: 2 }}>
          <FormInputClassic
            name="name"
            inputProps={{ label: 'Nombre*', placeholder }}
            rules={{}}
          />
          <FormInputClassic
            name="description"
            inputProps={{
              label: 'Descripción',
              placeholder: 'Explicación de qué evalúa esta dimensión (opcional)',
              multiline: true,
              minRows: 3,
            }}
            rules={{}}
          />
        </Stack>
      </form>
    </FormProvider>
  );
};

type SubDimensionFormProps = {
  onSubmit: (values: SubDimensionFormValues) => void;
  defaultValues?: SubDimensionFormValues;
};

const SubDimensionForm = ({
  onSubmit,
  defaultValues,
}: SubDimensionFormProps) => {
  const methods = useForm<SubDimensionFormValues>({
    resolver: zodResolver(subDimensionSchema),
    defaultValues: defaultValues ?? { name: '', description: '' },
  });

  return (
    <FormProvider {...methods}>
      <form
        id={FORM_ID_SUB}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <Stack sx={{ gap: 2 }}>
          <FormInputClassic
            name="name"
            inputProps={{
              label: 'Nombre*',
              placeholder: 'Ej: Compromiso con la Seguridad',
            }}
            rules={{}}
          />
          <FormInputClassic
            name="description"
            inputProps={{
              label: 'Descripción',
              placeholder: 'Explicación de qué se evalúa en esta sub-dimensión',
              multiline: true,
              minRows: 3,
            }}
            rules={{}}
          />
        </Stack>
      </form>
    </FormProvider>
  );
};

const SCORES = [1, 2, 3, 4, 5];

const ScoreLabelsCard = () => {
  const { labels, updateLabel, loading } = useScoreLabels();
  const [draft, setDraft] = useState<Record<number, string>>(labels);

  useEffect(() => {
    if (!loading) setDraft(labels);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const isDirty = SCORES.some(score => draft[score] !== labels[score]);

  const handleSave = () => {
    SCORES.forEach(score => {
      if (draft[score] !== labels[score]) {
        updateLabel(score, draft[score]);
      }
    });
  };

  return (
    <CardContainer padding={16}>
      <Stack sx={{ gap: 1.5 }}>
        <Stack>
          <Typography variant="subtitle2">Etiquetas de puntaje</Typography>
          <Typography
            variant="caption"
            sx={{ color: 'text.secondary' }}
          >
            Qué significa cada valor (1 a 5) al evaluar una sub-dimensión. Se
            muestran al evaluador al abrir un ciclo.
          </Typography>
        </Stack>
        <Stack
          sx={{
            flexDirection: { xs: 'column', sm: 'row' },
            gap: 2,
            flexWrap: 'wrap',
          }}
        >
          {SCORES.map(score => (
            <Stack
              key={score}
              sx={{ flex: '1 1 140px', minWidth: 140 }}
            >
              <TextField
                label={`Puntaje ${score}`}
                size="small"
                fullWidth
                value={draft[score] ?? ''}
                onChange={e =>
                  setDraft(prev => ({ ...prev, [score]: e.target.value }))
                }
              />
            </Stack>
          ))}
        </Stack>
        <Button
          variant="secondary"
          size="small"
          sx={{ alignSelf: 'flex-start' }}
          disabled={!isDirty}
          onClick={handleSave}
        >
          Guardar etiquetas
        </Button>
      </Stack>
    </CardContainer>
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

  const handleImportCSV = () => {
    openDrawer({
      title: 'Cargar dimensiones por CSV',
      size: 'medium',
      children: <DimensionsCSVImportModal onImportSuccess={closeDrawer} />,
      primaryButtonProps: { disabled: true },
      secondaryButtonProps: {
        children: 'Cerrar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleNewDimension = () => {
    openDrawer({
      title: 'Nueva dimensión',
      size: 'medium',
      children: (
        <DimensionForm
          onSubmit={values => {
            addDimension(values.name, values.description);
            closeDrawer();
          }}
          placeholder="Ej: Disciplina Operacional"
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: FORM_ID,
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleEditDimension = (
    id: string,
    name: string,
    description?: string,
  ) => {
    openDrawer({
      title: 'Editar dimensión',
      size: 'medium',
      children: (
        <DimensionForm
          onSubmit={values => {
            updateDimension(id, values.name, values.description);
            closeDrawer();
          }}
          defaultValues={{ name, description }}
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: FORM_ID,
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleDeleteDimension = (id: string, name: string) => {
    openDialog({
      title: `¿Eliminar "${name}"?`,
      textBody:
        'Se eliminarán también todas sus sub-dimensiones. Esta acción no se puede deshacer.',
      primaryButtonProps: {
        children: 'Eliminar',
        onClick: () => {
          deleteDimension(id);
          closeDialog();
        },
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDialog(),
      },
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
        <SubDimensionForm
          onSubmit={values => {
            addSubDimension(dimensionId, values.name, values.description);
            closeDrawer();
          }}
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: FORM_ID_SUB,
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleEditSubDimension = (
    dimensionId: string,
    subId: string,
    name: string,
    description?: string,
  ) => {
    openDrawer({
      title: 'Editar sub-dimensión',
      size: 'medium',
      children: (
        <SubDimensionForm
          onSubmit={values => {
            updateSubDimension(
              dimensionId,
              subId,
              values.name,
              values.description,
            );
            closeDrawer();
          }}
          defaultValues={{ name, description }}
        />
      ),
      primaryButtonProps: {
        children: 'Guardar',
        form: FORM_ID_SUB,
        type: 'submit',
      },
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDrawer(),
      },
    });
  };

  const handleDeleteSubDimension = (
    dimensionId: string,
    subId: string,
    name: string,
  ) => {
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
      secondaryButtonProps: {
        children: 'Cancelar',
        onClick: () => closeDialog(),
      },
    });
  };

  const handleDimensionMenu = (
    e: React.MouseEvent<HTMLElement>,
    id: string,
    name: string,
    description?: string,
  ) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        {
          id: 'edit',
          title: 'Editar',
          icon: IconEdit,
          onSelect: () => handleEditDimension(id, name, description),
        },
        {
          id: 'duplicate',
          title: 'Duplicar',
          icon: IconCopy,
          onSelect: () => handleDuplicateDimension(id),
        },
        {
          id: 'add-sub',
          title: 'Agregar sub-dimensión',
          icon: IconPlus,
          onSelect: () => handleNewSubDimension(id),
        },
        {
          id: 'delete',
          title: 'Eliminar',
          icon: IconTrash,
          onSelect: () => handleDeleteDimension(id, name),
        },
      ],
    });
  };

  const handleSubDimensionMenu = (
    e: React.MouseEvent<HTMLElement>,
    dimensionId: string,
    subId: string,
    name: string,
    description?: string,
  ) => {
    openMenu({
      anchorEl: e.currentTarget,
      items: [
        {
          id: 'edit',
          title: 'Editar',
          icon: IconEdit,
          onSelect: () =>
            handleEditSubDimension(dimensionId, subId, name, description),
        },
        {
          id: 'delete',
          title: 'Eliminar',
          icon: IconTrash,
          onSelect: () => handleDeleteSubDimension(dimensionId, subId, name),
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
            title="Banco de dimensiones"
            description="Administrá las dimensiones y sub-dimensiones de evaluación."
          />
          <Stack sx={{ flexDirection: 'row', gap: 1 }}>
            <Button
              variant="secondary"
              startIcon={<IconUpload />}
              onClick={handleImportCSV}
            >
              Cargar CSV
            </Button>
            <Button
              startIcon={<IconPlus />}
              onClick={handleNewDimension}
            >
              Nueva dimensión
            </Button>
          </Stack>
        </Stack>

        <ScoreLabelsCard />

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
              <CardContainer
                key={dim.id}
                padding={16}
                noHover
              >
                <Stack sx={{ gap: 2 }}>
                  <Stack
                    sx={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Stack>
                      <Typography variant="subtitle1">{dim.name}</Typography>
                      {dim.description && (
                        <Typography
                          variant="caption"
                          sx={{ color: 'text.secondary' }}
                        >
                          {dim.description}
                        </Typography>
                      )}
                    </Stack>
                    <IconButton
                      onClick={e =>
                        handleDimensionMenu(e, dim.id, dim.name, dim.description)
                      }
                    >
                      <IconDotsVertical />
                    </IconButton>
                  </Stack>

                  {dim.subDimensions.length > 0 && (
                    <Stack sx={{ gap: 0.5, pl: 2 }}>
                      {dim.subDimensions.map(sd => (
                        <Stack
                          key={sd.id}
                          sx={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            py: 0.5,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ color: 'text.secondary' }}
                          >
                            {sd.name}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={e =>
                              handleSubDimensionMenu(
                                e,
                                dim.id,
                                sd.id,
                                sd.name,
                                sd.description,
                              )
                            }
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
