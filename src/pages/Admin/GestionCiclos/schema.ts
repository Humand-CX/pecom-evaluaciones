import { z } from 'zod';

export const cycleSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  project_name: z.string().min(1, 'Requerido'),
  start_date: z.string().min(1, 'Requerido'),
  end_date: z.string().min(1, 'Requerido'),
  dimensionIds: z.array(z.string()).min(1, 'Seleccioná al menos una dimensión'),
});

export type CycleFormValues = z.infer<typeof cycleSchema>;
