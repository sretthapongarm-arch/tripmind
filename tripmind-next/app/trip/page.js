import PlanView from '@/components/PlanView';
import { getTrip, supabaseReady } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export default async function TripPage({ searchParams }) {
  const sp = await searchParams;
  const trip = supabaseReady() ? await getTrip(sp?.id) : null;
  if (!trip) return <div className="card">ไม่พบแผนเที่ยวนี้ <a href="/" style={{ color: 'var(--ac)' }}>สร้างแผนใหม่</a></div>;
  return (<>
    <PlanView plan={trip.data} dest={trip.dest} budget={trip.budget} />
    <p style={{ marginTop: 16 }}><a href="/" style={{ color: 'var(--ac)' }}>← สร้างแผนของคุณเอง</a></p>
  </>);
}
