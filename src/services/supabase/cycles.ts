import { supabase } from '@/lib/supabase';

export interface Cycle {
  id: string;
  name: string;
  project_name?: string;
  start_date?: string;
  end_date?: string;
  status: 'draft' | 'active' | 'closed';
  dimension_ids?: string[];
  segment_ids?: string[];
  created_at?: string;
}

export const cyclesService = {
  async getAll() {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data as Cycle[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('cycles')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Cycle;
  },

  async create(cycle: Cycle) {
    const { data, error } = await supabase
      .from('cycles')
      .insert([cycle])
      .select()
      .single();
    if (error) throw error;
    return data as Cycle;
  },

  async update(id: string, updates: Partial<Cycle>) {
    const { data, error } = await supabase
      .from('cycles')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Cycle;
  },

  async delete(id: string) {
    const { error } = await supabase.from('cycles').delete().eq('id', id);
    if (error) throw error;
  },
};
