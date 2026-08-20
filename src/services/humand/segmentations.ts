import { humandFetch } from './client';

export interface SegmentationItem {
  id: number;
  name: string;
  groupId: number;
  usersCount: number;
  sharedId: string;
}

export interface SegmentationGroup {
  id: number;
  name: string;
  visibility: 'ALL' | 'USER_AND_ADMINS' | 'ADMINS_ONLY';
  isEditable: boolean;
  sharedId: string;
  items: SegmentationItem[];
}

export const humandSegmentationsService = {
  /**
   * Get all segmentation groups with their items
   */
  async getSegmentations(): Promise<SegmentationGroup[]> {
    return humandFetch<SegmentationGroup[]>('/segmentations');
  },

  /**
   * Get a specific segmentation group by name
   */
  async getSegmentationByName(
    groupName: string,
  ): Promise<SegmentationGroup | null> {
    try {
      const groups = await this.getSegmentations();
      return groups.find(g => g.name === groupName) || null;
    } catch {
      return null;
    }
  },

  /**
   * Get all items in a segmentation group
   */
  async getSegmentationItems(groupName: string): Promise<SegmentationItem[]> {
    const group = await this.getSegmentationByName(groupName);
    return group?.items || [];
  },
};
