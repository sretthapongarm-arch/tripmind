const url = () => process.env.SUPABASE_URL;
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY;
export const supabaseReady = () => Boolean(url() && key());
const headers = () => ({ apikey: key(), Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' });

export async function saveTrip({ dest, budget, data }) {
  const r = await fetch(`${url()}/rest/v1/trips`, {
    method: 'POST',
    headers: { ...headers(), Prefer: 'return=representation' },
    body: JSON.stringify({ dest, budget, data })
  });
  if (!r.ok) throw new Error('บันทึกไม่สำเร็จ');
  return (await r.json())[0];
}
export async function getTrip(id) {
  if (!/^[0-9a-f-]{36}$/i.test(id || '')) return null;
  const r = await fetch(`${url()}/rest/v1/trips?id=eq.${id}&select=*`, { headers: headers(), cache: 'no-store' });
  if (!r.ok) return null;
  return (await r.json())[0] || null;
}
