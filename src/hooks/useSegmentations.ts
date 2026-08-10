import { useEffect, useState } from 'react';

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

export function useSegmentations(instanceId?: string) {
  const [segmentations, setSegmentations] = useState<Segmentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSegmentations = async () => {
      try {
        setLoading(true);
        const url = instanceId
          ? `/api/segmentations?instanceId=${instanceId}`
          : '/api/segmentations';
        const response = await fetch(url);

        if (!response.ok) {
          if (response.status === 401) {
            setError('Usuario no autenticado');
          } else {
            setError('Error al obtener segmentaciones');
          }
          setSegmentations([]);
          return;
        }

        const data = await response.json();
        setSegmentations(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching segmentations:', err);
        setError('Error de conexión');
        setSegmentations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSegmentations();
  }, [instanceId]);

  return { segmentations, loading, error };
}
