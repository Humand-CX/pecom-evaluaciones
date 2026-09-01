import axios from 'axios'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY!

/**
 * Evaluador = tiene al menos una fila en evaluator_assignments como evaluator_id.
 * Es un dato propio de la app (no existe en Humand), guardado en Supabase.
 */
export async function isInstanceEvaluator(humandUserId: number): Promise<boolean> {
  try {
    const res = await axios.get(
      `${SUPABASE_URL}/rest/v1/evaluator_assignments`,
      {
        params: {
          evaluator_id: `eq.${humandUserId}`,
          select: 'id',
          limit: 1,
        },
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        validateStatus: () => true,
      },
    )
    if (res.status >= 400) {
      console.error('isInstanceEvaluator check failed:', res.status, res.data)
      return false
    }
    return Array.isArray(res.data) && res.data.length > 0
  } catch (error) {
    console.error('isInstanceEvaluator check failed:', error)
    return false
  }
}
