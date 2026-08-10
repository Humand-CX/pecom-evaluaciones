// Obtiene lista de usuarios desde la API de Humand usando M2M auth

import { m2mAuthService } from './m2m-auth';

const JANUS_BASE_URL = process.env.JANUS_BASE_URL;

if (!JANUS_BASE_URL) {
  throw new Error('Missing JANUS_BASE_URL');
}

export interface HumandUser {
  employeeInternalId: string;
  fullName: string;
  email: string;
  status: string;
  managerEmployeeInternalId?: string;
  segmentations?: Array<{
    id: string;
    name: string;
  }>;
}

export const m2mUsersService = {
  async getUsers(instanceId?: string): Promise<HumandUser[]> {
    try {
      const accessToken = await m2mAuthService.getAccessToken();

      // Construir URL con filtro de instancia si se proporciona
      const url = instanceId
        ? `${JANUS_BASE_URL}/api/v1/users?instanceId=${instanceId}`
        : `${JANUS_BASE_URL}/api/v1/users`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[m2m-users] Error fetching users:', error);
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const data = await response.json() as HumandUser[];
      return data;
    } catch (error) {
      console.error('[m2m-users] Service error:', error);
      throw error;
    }
  },

  async getUserById(userId: string): Promise<HumandUser | null> {
    try {
      const accessToken = await m2mAuthService.getAccessToken();

      const response = await fetch(`${JANUS_BASE_URL}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const error = await response.text();
        console.error('[m2m-users] Error fetching user:', error);
        throw new Error(`Failed to fetch user: ${response.status}`);
      }

      const data = await response.json() as HumandUser;
      return data;
    } catch (error) {
      console.error('[m2m-users] Service error:', error);
      throw error;
    }
  },

  async getUsersByManager(managerEmployeeInternalId: string): Promise<HumandUser[]> {
    try {
      const users = await this.getUsers();
      return users.filter((u) => u.managerEmployeeInternalId === managerEmployeeInternalId);
    } catch (error) {
      console.error('[m2m-users] Service error:', error);
      throw error;
    }
  },
};
