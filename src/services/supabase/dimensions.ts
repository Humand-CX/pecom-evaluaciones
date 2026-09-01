import { supabase } from '@/lib/supabase';

export interface SubDimensionRow {
  id: string;
  dimension_id: string;
  name: string;
  description?: string | null;
  created_at?: string;
}

export interface DimensionRow {
  id: string;
  name: string;
  created_at?: string;
  sub_dimensions?: SubDimensionRow[];
}

export const dimensionsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('dimensions')
      .select('*, sub_dimensions(*)')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data as DimensionRow[];
  },

  async create(id: string, name: string) {
    const { data, error } = await supabase
      .from('dimensions')
      .insert([{ id, name }])
      .select()
      .single();
    if (error) throw error;
    return data as DimensionRow;
  },

  async update(id: string, name: string) {
    const { error } = await supabase
      .from('dimensions')
      .update({ name })
      .eq('id', id);
    if (error) throw error;
  },

  async delete(id: string) {
    await supabase.from('sub_dimensions').delete().eq('dimension_id', id);
    const { error } = await supabase.from('dimensions').delete().eq('id', id);
    if (error) throw error;
  },

  async addSubDimension(
    id: string,
    dimensionId: string,
    name: string,
    description?: string,
  ) {
    const { data, error } = await supabase
      .from('sub_dimensions')
      .insert([{ id, dimension_id: dimensionId, name, description }])
      .select()
      .single();
    if (error) throw error;
    return data as SubDimensionRow;
  },

  async updateSubDimension(
    subId: string,
    name: string,
    description?: string,
  ) {
    const { error } = await supabase
      .from('sub_dimensions')
      .update({ name, description })
      .eq('id', subId);
    if (error) throw error;
  },

  async deleteSubDimension(subId: string) {
    const { error } = await supabase
      .from('sub_dimensions')
      .delete()
      .eq('id', subId);
    if (error) throw error;
  },
};
