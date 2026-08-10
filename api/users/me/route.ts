// GET /api/users/me
// Retorna datos del usuario logueado obtenidos desde M2M

import { NextRequest, NextResponse } from 'next/server';
import { m2mUsersService } from '../../../src/services/humand/m2m-users';

export async function GET(request: NextRequest) {
  try {
    // Obtener userId de las cookies (se guardó cuando hizo login)
    const userCookie = request.cookies.get('humand_user');

    if (!userCookie) {
      return NextResponse.json(
        { error: 'not_authenticated', detail: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    const user = JSON.parse(userCookie.value);
    const userId = user.userId;

    // Obtener datos del usuario desde M2M
    const userData = await m2mUsersService.getUserById(userId);

    if (!userData) {
      return NextResponse.json(
        { error: 'user_not_found', detail: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      userId: userData.employeeInternalId,
      email: userData.email,
      name: userData.fullName,
      status: userData.status,
      managerEmployeeInternalId: userData.managerEmployeeInternalId,
      segmentations: userData.segmentations,
    });
  } catch (error) {
    console.error('[api/users/me] Error:', error);
    return NextResponse.json(
      { error: 'internal_server_error', detail: String(error) },
      { status: 500 }
    );
  }
}
