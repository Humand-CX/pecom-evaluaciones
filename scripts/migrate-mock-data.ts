import { supabase } from '../src/lib/supabase';
import { MOCK_PEOPLE } from '../src/pages/Evaluador/MatrizEvaluacion/constants';
import { MOCK_EVALUATORS } from '../src/pages/Evaluador/MatrizEvaluacion/constants';
import { MOCK_CYCLES } from '../src/pages/Evaluador/CiclosActivos/constants';

async function migrate() {
  try {
    console.log('🚀 Iniciando migración de datos mock a Supabase...\n');

    // Migrar personas
    console.log('📝 Migrando personas...');
    const { error: peopleError } = await supabase
      .from('people')
      .insert(MOCK_PEOPLE.map(p => ({
        id: p.id,
        name: p.name,
        legajo: p.legajo,
        proyecto: p.proyecto,
        area: p.area,
        departamento: p.departamento,
        provincia: p.provincia,
      })));

    if (peopleError) console.error('Error:', peopleError);
    else console.log(`✅ ${MOCK_PEOPLE.length} personas migradas\n`);

    // Migrar evaluadores
    console.log('📋 Migrando evaluadores...');
    const { error: evaluatorsError } = await supabase
      .from('evaluators')
      .insert(MOCK_EVALUATORS.map(e => ({
        id: e.id,
        name: e.name,
      })));

    if (evaluatorsError) console.error('Error:', evaluatorsError);
    else console.log(`✅ ${MOCK_EVALUATORS.length} evaluadores migrados\n`);

    // Migrar ciclos
    console.log('🔄 Migrando ciclos...');
    const { error: cyclesError } = await supabase
      .from('cycles')
      .insert(MOCK_CYCLES.map(c => ({
        id: c.id,
        name: c.name,
        project_name: c.project_name,
        start_date: c.start_date,
        end_date: c.end_date,
        status: c.status,
        dimension_ids: c.dimensionIds,
        segment_ids: c.segmentIds,
      })));

    if (cyclesError) console.error('Error:', cyclesError);
    else console.log(`✅ ${MOCK_CYCLES.length} ciclos migrados\n`);

    console.log('✨ ¡Migración completada!');
  } catch (error) {
    console.error('❌ Error durante la migración:', error);
    process.exit(1);
  }
}

migrate();
