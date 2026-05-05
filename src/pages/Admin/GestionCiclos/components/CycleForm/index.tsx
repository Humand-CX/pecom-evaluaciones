import { FormProvider, useForm, Controller } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import Stack from '@material-hu/mui/Stack';
import Checkbox from '@material-hu/mui/Checkbox';
import Typography from '@material-hu/mui/Typography';
import FormControlLabel from '@material-hu/mui/FormControlLabel';

import FormInputClassic from '@material-hu/components/design-system/Inputs/Classic/form';
import CardContainer from '@material-hu/components/design-system/CardContainer';

import { useDimensions } from '../../../../providers/DimensionsContext';
import { cycleSchema, type CycleFormValues } from '../../schema';

type CycleFormProps = {
  formId: string;
  onSubmit: (values: CycleFormValues) => void;
  defaultValues?: Partial<CycleFormValues>;
};

export const CycleForm = ({ formId, onSubmit, defaultValues }: CycleFormProps) => {
  const { dimensions } = useDimensions();

  const methods = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      name: '',
      project_name: '',
      start_date: '',
      end_date: '',
      dimensionIds: [],
      ...defaultValues,
    },
  });

  const { control, formState } = methods;
  const dimensionError = formState.errors.dimensionIds?.message;

  return (
    <FormProvider {...methods}>
      <form id={formId} onSubmit={methods.handleSubmit(onSubmit)}>
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

          <CardContainer padding={12}>
            <Stack sx={{ gap: 1.5 }}>
              <Typography variant="subtitle2">Dimensiones*</Typography>
              <Controller
                name="dimensionIds"
                control={control}
                render={({ field }) => (
                  <Stack sx={{ gap: 1 }}>
                    {dimensions.length === 0 ? (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        No hay dimensiones disponibles. Creá algunas en el Banco de dimensiones.
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
                                  : field.value.filter(id => id !== dimension.id);
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
                <Typography variant="caption" sx={{ color: 'error.main' }}>
                  {dimensionError}
                </Typography>
              )}
            </Stack>
          </CardContainer>
        </Stack>
      </form>
    </FormProvider>
  );
};
