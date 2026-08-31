import { useEffect, useState } from 'react';

import { postgrest } from '../services/postgrest';

export interface SegmentationGroup {
  id: number;
  name: string;
}

export interface SegmentationItem {
  id: number;
  groupId: number;
  name: string;
}

export function useSegmentationGroups() {
  const [groups, setGroups] = useState<SegmentationGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    postgrest
      .get<SegmentationGroup>('segmentation_groups', {
        select: 'id,name',
        order: 'name.asc',
      })
      .then(({ data }) => {
        if (!cancelled) setGroups(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { groups, loading };
}

export function useSegmentationItems(groupId: number | null) {
  const [items, setItems] = useState<SegmentationItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (groupId == null) {
      setItems([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    postgrest
      .get<SegmentationItem>('segmentation_items', {
        groupId: `eq.${groupId}`,
        select: 'id,groupId,name',
        order: 'name.asc',
      })
      .then(({ data }) => {
        if (!cancelled) setItems(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [groupId]);

  return { items, loading };
}
