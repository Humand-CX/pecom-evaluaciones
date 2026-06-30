import { supabase } from '@/lib/supabase';

export interface Evaluator {
  id: string;
  name: string;
  email?: string;
  created_at?: string;
}

export const evaluatorsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('evaluators')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data as Evaluator[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('evaluators')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Evaluator;
  },

  async create(evaluator: Evaluator) {
    const { data, error } = await supabase
      .from('evaluators')
      .insert([evaluator])
      .select()
      .single();
    if (error) throw error;
    return data as Evaluator;
  },

  async bulkCreate(evaluators: Evaluator[]) {
    const { data, error } = await supabase
      .from('evaluators')
      .insert(evaluators)
      .select();
    if (error) throw error;
    return data as Evaluator[];
  },

  async update(id: string, updates: Partial<Evaluator>) {
    const { data, error } = await supabase
      .from('evaluators')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Evaluator;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('evaluators')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};
