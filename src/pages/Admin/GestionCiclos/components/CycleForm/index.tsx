import { useState } from 'react';

import { Controller, FormProvider, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import Checkbox from '@material-hu/mui/Checkbox';
import FormControl from '@material-hu/mui/FormControl';
import FormControlLabel from '@material-hu/mui/FormControlLabel';
import InputLabel from '@material-hu/mui/InputLabel';
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
              <Controller
                name="dimensionIds"
                control={control}
                render={({ field }) => (
                  <Stack sx={{ gap: 1 }}>
                    {dimensions.length === 0 ? (
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        No hay dimensiones disponibles. Creá algunas en el Banco
                        de dimensiones.
                      </Typography>
                    ) : (
                      dimensions.map(dimension => (
                        <FormControlLabel
                          key={dimension.id}
                          control={
                            <Checkbox
                              checked={field.value.includes(dimension.id)}
                              onChange={e => {
                                const newValue = e.target.checked
                                  ? [...field.value, dimension.id]
                                  : field.value.filter(
                                      id => id !== dimension.id,
                                    );
                                field.onChange(newValue);
                              }}
                            />
                          }
                          label={dimension.name}
                        />
                      ))
                    )}
                  </Stack>
                )}
              />
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

              <Controller
                name="segmentIds"
                control={control}
                render={({ field }) => (
                  <Stack sx={{ gap: 1 }}>
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
                      items.map(item => {
                        const itemId = String(item.id);
                        return (
                          <FormControlLabel
                            key={itemId}
                            control={
                              <Checkbox
                                checked={field.value.includes(itemId)}
                                onChange={e => {
                                  const newValue = e.target.checked
                                    ? [...field.value, itemId]
                                    : field.value.filter(id => id !== itemId);
                                  field.onChange(newValue);
                                }}
                              />
                            }
                            label={item.name}
                          />
                        );
                      })
                    )}
                  </Stack>
                )}
              />
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
