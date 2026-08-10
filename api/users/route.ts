// GET /api/users
// Retorna lista de usuarios obtenidos desde M2M
// Opcional: ?instanceId=X para filtrar por instancia

import { NextRequest, NextResponse } from 'next/server';
import { m2mUsersService } from '../../src/services/humand/m2m-users';

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

    // Obtener usuarios desde M2M
    const users = await m2mUsersService.getUsers(instanceId);

    return NextResponse.json(
      users.map((u) => ({
        userId: u.employeeInternalId,
        email: u.email,
        name: u.fullName,
        status: u.status,
        managerEmployeeInternalId: u.managerEmployeeInternalId,
        segmentations: u.segmentations,
      }))
    );
  } catch (error) {
    console.error('[api/users] Error:', error);
    return NextResponse.json(
      { error: 'internal_server_error', detail: String(error) },
      { status: 500 }
    );
  }
}
