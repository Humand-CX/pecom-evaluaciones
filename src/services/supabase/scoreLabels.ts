import { supabase } from '@/lib/supabase';

export interface ScoreLabelRow {
  score: number;
  label: string;
}

export const scoreLabelsService = {
  async getAll() {
    const { data, error } = await supabase
      .from('score_labels')
      .select('*')
      .order('score', { ascending: true });
    if (error) throw error;
    return data as ScoreLabelRow[];
  },

  async update(score: number, label: string) {
    const { error } = await supabase
      .from('score_labels')
      .update({ label })
      .eq('score', score);
    if (error) throw error;
  },
};
