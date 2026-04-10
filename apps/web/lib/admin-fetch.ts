/** Fetch para APIs /api/admin/* com cookie de sessão. */
export async function adminFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, credentials: "include" });
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(text || "Resposta inválida");
  }
  if (!res.ok) {
    const err = (data as { error?: string })?.error;
    throw new Error(err ?? text ?? res.statusText);
  }
  return data as T;
}
