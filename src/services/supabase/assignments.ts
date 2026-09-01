import { supabase } from '@/lib/supabase';

export interface EvaluatorAssignment {
  id: string;
  cycle_id: string;
  dimension_id: string;
  evaluator_id: string;
  person_id: string;
  created_at?: string;
}

export const assignmentsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('evaluator_assignments')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as EvaluatorAssignment[];
  },

  async getByCycle(cycleId: string) {
    const { data, error } = await supabase
      .from('evaluator_assignments')
      .select('*')
      .eq('cycle_id', cycleId);
    if (error) throw error;
    return data as EvaluatorAssignment[];
  },

  async getByEvaluator(evaluatorId: string) {
    const { data, error } = await supabase
      .from('evaluator_assignments')
      .select('*')
      .eq('evaluator_id', evaluatorId);
    if (error) throw error;
    return data as EvaluatorAssignment[];
  },

  async create(assignment: EvaluatorAssignment) {
    const { data, error } = await supabase
      .from('evaluator_assignments')
      .insert([assignment])
      .select()
      .single();
    if (error) throw error;
    return data as EvaluatorAssignment;
  },

  async bulkCreate(assignments: EvaluatorAssignment[]) {
    const { data, error } = await supabase
      .from('evaluator_assignments')
      .insert(assignments)
      .select();
    if (error) throw error;
    return data as EvaluatorAssignment[];
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('evaluator_assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteByEvaluatorAndPerson(evaluatorId: string, personId: string) {
    const { error } = await supabase
      .from('evaluator_assignments')
      .delete()
      .eq('evaluator_id', evaluatorId)
      .eq('person_id', personId);
    if (error) throw error;
  },

  async deleteByCycle(cycleId: string) {
    const { error } = await supabase
      .from('evaluator_assignments')
      .delete()
      .eq('cycle_id', cycleId);
    if (error) throw error;
  },

  async deleteByCycleDimensionsPersons(
    cycleId: string,
    dimensionIds: string[],
    personIds: string[],
  ) {
    const { error } = await supabase
      .from('evaluator_assignments')
      .delete()
      .eq('cycle_id', cycleId)
      .in('dimension_id', dimensionIds)
      .in('person_id', personIds);
    if (error) throw error;
  },
};
