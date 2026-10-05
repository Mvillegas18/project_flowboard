export async function expectAction<T>(result: Promise<{ ok: true; data: T } | { ok: false; error: string }>): Promise<T> {
  const response = await result;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}
