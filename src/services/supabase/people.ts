import { supabase } from '@/lib/supabase';

export interface Person {
  id: string;
  name: string;
  legajo?: string;
  proyecto?: string;
  area?: string;
  departamento?: string;
  provincia?: string;
  created_at?: string;
}

export const peopleService = {
  async getAll() {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data as Person[];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('people')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data as Person;
  },

  async create(person: Person) {
    const { data, error } = await supabase
      .from('people')
      .insert([person])
      .select()
      .single();
    if (error) throw error;
    return data as Person;
  },

  async bulkCreate(people: Person[]) {
    const { data, error } = await supabase
      .from('people')
      .insert(people)
      .select();
    if (error) throw error;
    return data as Person[];
  },

  async update(id: string, updates: Partial<Person>) {
    const { data, error } = await supabase
      .from('people')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data as Person;
  },

  async delete(id: string) {
    const { error } = await supabase.from('people').delete().eq('id', id);
    if (error) throw error;
  },
};
