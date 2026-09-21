import { NextResponse } from 'next/server';
import { saveTrip, supabaseReady } from '@/lib/supabase';

export async function POST(req) {
  if (!supabaseReady()) return NextResponse.json({ error: 'ยังไม่ได้ตั้งค่า Supabase' }, { status: 501 });
  const b = await req.json().catch(() => ({}));
  if (!b.data?.days || JSON.stringify(b.data).length > 200000) return NextResponse.json({ error: 'ข้อมูลไม่ถูกต้อง' }, { status: 400 });
  try {
    const row = await saveTrip({ dest: String(b.dest || '').slice(0, 80), budget: Number(b.budget) || null, data: b.data });
    return NextResponse.json({ id: row.id });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
