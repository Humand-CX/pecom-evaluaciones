// GET /api/segmentations
// Retorna lista de segmentaciones (departamentos, áreas) obtenidas desde M2M
// Opcional: ?instanceId=X para filtrar por instancia

import { NextRequest, NextResponse } from 'next/server';
import { m2mSegmentationsService } from '../../src/services/humand/m2m-segmentations';

export async function GET(request: NextRequest) {
  try {
    // Validar que el usuario esté autenticado
    const userCookie = request.cookies.get('humand_user');
    if (!userCookie) {
      return NextResponse.json(
        { error: 'not_authenticated', detail: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener instanceId de query params si lo proporciona
    const instanceId = request.nextUrl.searchParams.get('instanceId') || undefined;

    // Obtener segmentaciones desde M2M
    const segmentations = await m2mSegmentationsService.getSegmentations(instanceId);

    return NextResponse.json(segmentations);
  } catch (error) {
    console.error('[api/segmentations] Error:', error);
    return NextResponse.json(
      { error: 'internal_server_error', detail: String(error) },
      { status: 500 }
    );
  }
}
