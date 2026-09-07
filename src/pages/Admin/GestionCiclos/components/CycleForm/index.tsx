import { useState } from 'react';

import { Controller, FormProvider, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from '@material-hu/mui/Checkbox';
import FormControl from '@material-hu/mui/FormControl';
import InputLabel from '@material-hu/mui/InputLabel';
import ListItemText from '@material-hu/mui/ListItemText';
import MenuItem from '@material-hu/mui/MenuItem';
import Select from '@material-hu/mui/Select';
import Stack from '@material-hu/mui/Stack';
import Typography from '@material-hu/mui/Typography';

import CardContainer from '@material-hu/components/design-system/CardContainer';
import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';

import { useDimensions } from '../../../../../providers/DimensionsContext';
import {
  useSegmentationGroups,
  useSegmentationItems,
} from '../../../../../hooks/useHumandSegmentation';
import { type CycleFormValues, cycleSchema } from '../../schema';

type CycleFormProps = {
  formId: string;
  onSubmit: (values: CycleFormValues) => void;
  defaultValues?: Partial<CycleFormValues>;
};

export const CycleForm = ({
  formId,
  onSubmit,
  defaultValues,
}: CycleFormProps) => {
  const { dimensions } = useDimensions();
  const { groups } = useSegmentationGroups();
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const { items, loading: itemsLoading } = useSegmentationItems(selectedGroupId);

  const methods = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      name: '',
      project_name: '',
      start_date: '',
      end_date: '',
      dimensionIds: [],
      segmentIds: [],
      ...defaultValues,
    },
  });

  const { control, formState } = methods;
  const dimensionError = formState.errors.dimensionIds?.message;
  const segmentError = formState.errors.segmentIds?.message;

  return (
    <FormProvider {...methods}>
      <form
        id={formId}
        onSubmit={methods.handleSubmit(onSubmit)}
      >
        <Stack sx={{ gap: 2 }}>
          <FormInputClassic
            name="name"
            inputProps={{ label: 'Nombre*', placeholder: 'Ej: Q3 2025 - LAJE' }}
            rules={{}}
          />
          <FormInputClassic
            name="project_name"
            inputProps={{ label: 'Proyecto*', placeholder: 'Ej: LAJE' }}
            rules={{}}
          />
          <FormInputClassic
            name="start_date"
            inputProps={{ label: 'Fecha inicio*', type: 'date' }}
            rules={{}}
          />
          <FormInputClassic
            name="end_date"
            inputProps={{ label: 'Fecha fin*', type: 'date' }}
            rules={{}}
          />

          <CardContainer padding={16}>
            <Stack sx={{ gap: 1.5 }}>
              <Typography variant="subtitle2">Dimensiones*</Typography>
              {dimensions.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  No hay dimensiones disponibles. Creá algunas en el Banco de
                  dimensiones.
                </Typography>
              ) : (
                <Controller
                  name="dimensionIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      size="small"
                    >
                      <InputLabel>Dimensiones</InputLabel>
                      <Select
                        multiple
                        label="Dimensiones"
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                        renderValue={selected =>
                          (selected as string[])
                            .map(
                              id =>
                                dimensions.find(d => d.id === id)?.name ?? id,
                            )
                            .join(', ')
                        }
                      >
                        {dimensions.map(dimension => (
                          <MenuItem
                            key={dimension.id}
                            value={dimension.id}
                          >
                            <Checkbox
                              checked={field.value.includes(dimension.id)}
                            />
                            <ListItemText primary={dimension.name} />
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              )}
              {dimensionError && (
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main' }}
                >
                  {dimensionError}
                </Typography>
              )}
            </Stack>
          </CardContainer>

          <CardContainer padding={16}>
            <Stack sx={{ gap: 1.5 }}>
              <Typography variant="subtitle2">
                Segmentos de Personas*
              </Typography>

              <FormControl
                fullWidth
                size="small"
              >
                <InputLabel>Grupo de segmentación</InputLabel>
                <Select
                  label="Grupo de segmentación"
                  value={selectedGroupId ?? ''}
                  onChange={e => setSelectedGroupId(Number(e.target.value))}
                >
                  {groups.map(group => (
                    <MenuItem
                      key={group.id}
                      value={group.id}
                    >
                      {group.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedGroupId == null ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  Elegí un grupo de segmentación para ver sus opciones.
                </Typography>
              ) : itemsLoading ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  Cargando...
                </Typography>
              ) : items.length === 0 ? (
                <Typography
                  variant="caption"
                  sx={{ color: 'text.secondary' }}
                >
                  Este grupo no tiene opciones.
                </Typography>
              ) : (
                <Controller
                  name="segmentIds"
                  control={control}
                  render={({ field }) => (
                    <FormControl
                      fullWidth
                      size="small"
                    >
                      <InputLabel>Ítems del segmento</InputLabel>
                      <Select
                        multiple
                        label="Ítems del segmento"
                        value={field.value}
                        onChange={e => field.onChange(e.target.value)}
                        renderValue={selected =>
                          (selected as string[])
                            .map(
                              id =>
                                items.find(i => String(i.id) === id)?.name ??
                                id,
                            )
                            .join(', ')
                        }
                      >
                        {items.map(item => {
                          const itemId = String(item.id);
                          return (
                            <MenuItem
                              key={itemId}
                              value={itemId}
                            >
                              <Checkbox
                                checked={field.value.includes(itemId)}
                              />
                              <ListItemText primary={item.name} />
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  )}
                />
              )}
              {segmentError && (
                <Typography
                  variant="caption"
                  sx={{ color: 'error.main' }}
                >
                  {segmentError}
                </Typography>
              )}
            </Stack>
          </CardContainer>
        </Stack>
      </form>
    </FormProvider>
  );
};
