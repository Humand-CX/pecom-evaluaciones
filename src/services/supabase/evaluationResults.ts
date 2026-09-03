import { supabase } from '@/lib/supabase';

export interface EvaluationResultRow {
  id: string;
  cycle_id: string;
  person_id: string;
  evaluator_id: string;
  scores: Record<string, number | null>;
  submitted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export const evaluationResultsService = {
  async getByCycle(cycleId: string) {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('cycle_id', cycleId);
    if (error) throw error;
    return data as EvaluationResultRow[];
  },

  async getByCycleAndEvaluator(cycleId: string, evaluatorId: string) {
    const { data, error } = await supabase
      .from('evaluation_results')
      .select('*')
      .eq('cycle_id', cycleId)
      .eq('evaluator_id', evaluatorId);
    if (error) throw error;
    return data as EvaluationResultRow[];
  },

  async upsert(row: EvaluationResultRow) {
    const { data, error } = await supabase
      .from('evaluation_results')
      .upsert([row], { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return data as EvaluationResultRow;
  },
};
