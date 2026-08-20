// Obtiene lista de segmentaciones (departamentos, áreas) desde la API de Humand usando M2M auth

import { m2mAuthService } from './m2m-auth';

const JANUS_BASE_URL = process.env.JANUS_BASE_URL;

if (!JANUS_BASE_URL) {
  throw new Error('Missing JANUS_BASE_URL');
}

export interface SegmentationItem {
  id: string;
  name: string;
  parentId?: string;
}

export interface Segmentation {
  id: string;
  name: string;
  items: SegmentationItem[];
}

export const m2mSegmentationsService = {
  async getSegmentations(instanceId?: string): Promise<Segmentation[]> {
    try {
      const accessToken = await m2mAuthService.getAccessToken();

      // Construir URL con filtro de instancia si se proporciona
      const url = instanceId
        ? `${JANUS_BASE_URL}/api/v1/segmentations?instanceId=${instanceId}`
        : `${JANUS_BASE_URL}/api/v1/segmentations`;

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(
          '[m2m-segmentations] Error fetching segmentations:',
          error,
        );
        throw new Error(`Failed to fetch segmentations: ${response.status}`);
      }

      const data = (await response.json()) as Segmentation[];
      return data;
    } catch (error) {
      console.error('[m2m-segmentations] Service error:', error);
      throw error;
    }
  },

  async getSegmentationById(
    segmentationId: string,
  ): Promise<Segmentation | null> {
    try {
      const accessToken = await m2mAuthService.getAccessToken();

      const response = await fetch(
        `${JANUS_BASE_URL}/api/v1/segmentations/${segmentationId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) return null;
        const error = await response.text();
        console.error(
          '[m2m-segmentations] Error fetching segmentation:',
          error,
        );
        throw new Error(`Failed to fetch segmentation: ${response.status}`);
      }

      const data = (await response.json()) as Segmentation;
      return data;
    } catch (error) {
      console.error('[m2m-segmentations] Service error:', error);
      throw error;
    }
  },

  async getSegmentationItems(
    segmentationId: string,
  ): Promise<SegmentationItem[]> {
    try {
      const segmentation = await this.getSegmentationById(segmentationId);
      return segmentation?.items || [];
    } catch (error) {
      console.error('[m2m-segmentations] Service error:', error);
      throw error;
    }
  },
};
