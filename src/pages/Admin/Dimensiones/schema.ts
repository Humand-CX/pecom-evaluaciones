import { z } from 'zod';

export const nameSchema = z.object({ name: z.string().min(1, 'Requerido') });
export type NameFormValues = z.infer<typeof nameSchema>;

export const subDimensionSchema = z.object({
  name: z.string().min(1, 'Requerido'),
  description: z.string().optional(),
});
export type SubDimensionFormValues = z.infer<typeof subDimensionSchema>;
