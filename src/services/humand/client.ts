const API_URL = import.meta.env.VITE_HUMAND_API_URL;
const API_KEY = import.meta.env.HUMAND_API_KEY;

if (!API_URL || !API_KEY) {
  throw new Error('Missing Humand API credentials');
}

async function humandFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': `Basic ${API_KEY}`,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Humand API error: ${response.status} - ${error}`);
  }

  return response.json();
}

export { humandFetch };
