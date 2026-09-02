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

export interface HumandUser {
  id: number;
  email: string | null;
  employeeInternalId: string | null;
  firstName: string;
  lastName: string;
}

export function useSegmentMembers(itemIds: string[]) {
  const [members, setMembers] = useState<HumandUser[]>([]);
  const [loading, setLoading] = useState(false);
  const key = itemIds.join(',');

  useEffect(() => {
    if (!key) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    postgrest
      .get<{ segmentableId: number }>('segmentations', {
        segmentableType: 'eq.user',
        itemId: `in.(${key})`,
        select: 'segmentableId',
      })
      .then(({ data }) => {
        const userIds = [...new Set(data.map(row => row.segmentableId))];
        if (userIds.length === 0) return { data: [] as HumandUser[] };
        return postgrest.get<HumandUser>('users', {
          id: `in.(${userIds.join(',')})`,
          select: 'id,email,employeeInternalId,firstName,lastName',
          order: 'firstName.asc',
        });
      })
      .then(result => {
        if (!cancelled && result) setMembers(result.data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { members, loading };
}

export function useHumandUsers(search: string) {
  const [users, setUsers] = useState<HumandUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const timeout = setTimeout(() => {
      const params: Record<string, string> = {
        select: 'id,email,firstName,lastName',
        status: 'eq.ACTIVE',
        order: 'firstName.asc',
        limit: '50',
      };
      if (search.trim()) {
        params.or = `(firstName.ilike.*${search.trim()}*,lastName.ilike.*${search.trim()}*,email.ilike.*${search.trim()}*)`;
      }
      postgrest
        .get<HumandUser>('users', params)
        .then(({ data }) => {
          if (!cancelled) setUsers(data);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [search]);

  return { users, loading };
}

export function useHumandUsersByIds(userIds: string[]) {
  const [users, setUsers] = useState<HumandUser[]>([]);
  const [loading, setLoading] = useState(false);
  const key = [...new Set(userIds)].sort().join(',');

  useEffect(() => {
    if (!key) {
      setUsers([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    postgrest
      .get<HumandUser>('users', {
        id: `in.(${key})`,
        select: 'id,email,employeeInternalId,firstName,lastName',
        order: 'firstName.asc',
      })
      .then(({ data }) => {
        if (!cancelled) setUsers(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return { users, loading };
}

export function useUserNames(userIds: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});
  const key = [...new Set(userIds)].sort().join(',');

  useEffect(() => {
    if (!key) {
      setNames({});
      return;
    }
    let cancelled = false;
    postgrest
      .get<HumandUser>('users', {
        id: `in.(${key})`,
        select: 'id,firstName,lastName',
      })
      .then(({ data }) => {
        if (cancelled) return;
        const map: Record<string, string> = {};
        data.forEach(u => {
          map[String(u.id)] = `${u.firstName} ${u.lastName}`.trim();
        });
        setNames(map);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  return names;
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
