import { humandFetch } from './client';

export interface HumandRelationship {
  name: 'BOSS' | 'REVIEWER' | 'SUBORDINATE';
  employeeInternalId: string;
}

export interface HumandSegmentation {
  group: string;
  item: string;
}

export interface HumandUser {
  id: string;
  employeeInternalId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  status: 'ACTIVE' | 'INACTIVE' | 'DEACTIVATED';
  profilePicture?: string;
  segmentations: HumandSegmentation[];
  relationships: HumandRelationship[];
  fields?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
}

export interface HumandUsersResponse {
  items: HumandUser[];
  total: number;
}

export const humandUsersService = {
  /**
   * Get current user info using OAuth access token
   */
  async getCurrentUser(accessToken: string): Promise<HumandUser> {
    const response = await fetch(`${import.meta.env.VITE_HUMAND_API_URL}/users/me`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get current user: ${response.status}`);
    }

    return response.json();
  },

  /**
   * List all users with pagination
   */
  async getUsers(limit = 100, offset = 0, status?: string): Promise<HumandUsersResponse> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      offset: offset.toString(),
    });

    if (status) {
      params.append('status', status);
    }

    return humandFetch<HumandUsersResponse>(`/users?${params.toString()}`);
  },

  /**
   * Get a specific user with relationships and segmentations
   */
  async getUserById(employeeInternalId: string): Promise<HumandUser> {
    return humandFetch<HumandUser>(
      `/users/${encodeURIComponent(employeeInternalId)}`
    );
  },

  /**
   * Get all active users
   */
  async getAllActiveUsers(limit = 1000, offset = 0): Promise<HumandUsersResponse> {
    return this.getUsers(limit, offset, 'ACTIVE');
  },

  /**
   * Get manager/boss of a user
   */
  async getUserManager(employeeInternalId: string): Promise<HumandUser | null> {
    try {
      const user = await this.getUserById(employeeInternalId);
      const boss = user.relationships.find(r => r.name === 'BOSS');

      if (!boss) return null;

      return this.getUserById(boss.employeeInternalId);
    } catch {
      return null;
    }
  },

  /**
   * Get all subordinates of a user
   */
  async getUserSubordinates(employeeInternalId: string): Promise<HumandUser[]> {
    try {
      const user = await this.getUserById(employeeInternalId);
      const subordinates = user.relationships.filter(r => r.name === 'SUBORDINATE');

      const subordinateUsers = await Promise.all(
        subordinates.map(sub => this.getUserById(sub.employeeInternalId))
      );

      return subordinateUsers.filter(Boolean) as HumandUser[];
    } catch {
      return [];
    }
  },

  /**
   * Get users by segmentation
   */
  async getUsersBySegmentation(group: string, item: string): Promise<HumandUser[]> {
    try {
      const response = await humandFetch<{ items: HumandUser[] }>(
        `/segmentations/users?group=${encodeURIComponent(group)}&item=${encodeURIComponent(item)}`
      );
      return response.items || [];
    } catch {
      return [];
    }
  },

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<HumandUser | null> {
    try {
      const response = await humandFetch<HumandUsersResponse>(
        `/users?email=${encodeURIComponent(email)}`
      );
      return response.items?.[0] || null;
    } catch {
      return null;
    }
  },
};
