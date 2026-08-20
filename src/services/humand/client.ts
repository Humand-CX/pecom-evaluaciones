const API_URL = import.meta.env.VITE_HUMAND_API_URL;

// Note: HUMAND_API_KEY is only available in backend (/api/auth/token)
// Client uses OAuth tokens for authenticated requests

async function humandFetch<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  if (!API_URL) {
    throw new Error('Missing VITE_HUMAND_API_URL environment variable');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
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
