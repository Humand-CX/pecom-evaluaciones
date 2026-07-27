import { humandFetch } from './client';

export interface HumandUser {
  internalId: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  roles?: string[];
  active?: boolean;
}

export const humandUsersService = {
  async getCurrentUser(accessToken: string): Promise<HumandUser> {
    // Get current user info using the access token from OAuth
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

  async getUsers(limit = 100, offset = 0): Promise<{ data: HumandUser[]; total: number }> {
    const response = await humandFetch<{ items: HumandUser[]; total: number }>(
      `/users?limit=${limit}&offset=${offset}`
    );
    return {
      data: response.items,
      total: response.total,
    };
  },

  async getUserByEmail(email: string): Promise<HumandUser | null> {
    try {
      const response = await humandFetch<{ items: HumandUser[] }>(
        `/users?email=${encodeURIComponent(email)}`
      );
      return response.items[0] || null;
    } catch {
      return null;
    }
  },
};
