'use client';
import { useState } from 'react';
import PlanView from '@/components/PlanView';

const STYLES = ['🍜 อาหาร', '🏛️ วัฒนธรรม', '🌿 ธรรมชาติ', '🏖️ ทะเล', '🛍️ ช้อปปิ้ง', '☕ คาเฟ่', '🌃 ไนท์ไลฟ์', '📸 ถ่ายรูป', '🧘 พักผ่อน', '🎢 ผจญภัย'];
const WMO = c => c == 0 ? 'แจ่มใส' : c < 4 ? 'มีเมฆ' : c < 50 ? 'หมอก' : c < 70 ? 'ฝน' : c < 80 ? 'หิมะ' : c < 90 ? 'ฝนกระหน่ำ' : 'พายุฝนฟ้าคะนอง';
const toggle = (set, v) => { const n = new Set(set); n.has(v) ? n.delete(v) : n.add(v); return n; };

async function api(url, body) {
  const r = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({ error: 'เซิร์ฟเวอร์ตอบผิดรูปแบบ' }));
  if (!r.ok) throw new Error(d.error || 'เกิดข้อผิดพลาด');
  return d;
}
// อากาศจาก Open-Meteo (ฟรี ไม่ต้องใช้ key) ดูล่วงหน้าได้ราว 16 วัน
async function getWeather(dest, start, days) {
  try {
    const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(dest)}&count=1&language=th`)).json();
    const p = g.results?.[0]; if (!p) return null;
    const end = new Date(new Date(start).getTime() + 864e5 * (days - 1)).toISOString().slice(0, 10);
    const w = await (await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${p.latitude}&longitude=${p.longitude}&daily=weathercode,temperature_2m_max,precipitation_probability_max&timezone=auto&start_date=${start}&end_date=${end}`)).json();
    if (!w.daily) return null;
    return w.daily.time.map((t, i) => ({ date: t, sky: WMO(w.daily.weathercode[i]), maxC: w.daily.temperature_2m_max[i], rainPct: w.daily.precipitation_probability_max[i] }));
  } catch { return null; }
}

export default function Home() {
  const [f, setF] = useState({ dest: '', startDate: new Date(Date.now() + 864e5 * 7).toISOString().slice(0, 10), days: 3, budget: 15000, who: 'คู่รัก', pace: 'สมดุล', startTime: '09:00', endTime: '20:00' });
  const [styles, setStyles] = useState(new Set(['🍜 อาหาร']));
  const [spots, setSpots] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const [plan, setPlan] = useState(null);
  const [weather, setWeather] = useState(null);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState({});
  const [shareUrl, setShareUrl] = useState('');
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));
  const say = (k, text, err) => setMsg(m => ({ ...m, [k]: text ? { text, err } : null }));
  const M = k => msg[k] && <div className={'msg' + (msg[k].err ? ' err' : '')}>{msg[k].text}</div>;
  const common = w => ({ ...f, days: +f.days, budget: +f.budget, styles: [...styles], spots: [...picked], weather: w });

  async function findSpots() {
    if (!f.dest.trim()) return say('m1', 'กรุณาใส่จุดหมายก่อน', 1);
    setBusy('spots'); say('m1', 'กำลังค้นหาสถานที่...');
    try { const d = await api('/api/plan', { mode: 'spots', dest: f.dest, styles: [...styles] }); setSpots(d.spots || []); setPicked(new Set()); say('m1', ''); }
    catch (e) { say('m1', e.message, 1); } finally { setBusy(''); }
  }
  async function run(mode) {
    const k = mode === 'plan' ? 'm2' : 'm3';
    if (mode === 'adjust' && !note.trim()) return say('m3', 'พิมพ์สถานการณ์ที่ต้องการปรับก่อนนะ', 1);
    setBusy(mode); say(k, 'AI กำลังวางแผน... (10–40 วินาที)'); setShareUrl('');
    try {
      let w = weather;
      if (mode === 'plan') { w = await getWeather(f.dest, f.startDate, +f.days); setWeather(w); }
      const d = await api('/api/plan', { ...common(w), mode, plan: mode === 'adjust' ? plan : undefined, note: mode === 'adjust' ? note : undefined });
      setPlan(d); say(k, '');
      if (!w) say('m3', 'หมายเหตุ: ไม่มีพยากรณ์อากาศสำหรับช่วงวันที่นี้ (ดูได้ล่วงหน้าราว 16 วัน) พิมพ์สภาพอากาศเองในช่อง "ปรับแผน" ได้');
    } catch (e) { say(k, e.message, 1); } finally { setBusy(''); }
  }
  async function save() {
    setBusy('save'); say('m4', 'กำลังบันทึก...');
    try { const d = await api('/api/trips', { dest: f.dest, budget: f.budget, data: plan }); setShareUrl(`${location.origin}/trip?id=${d.id}`); say('m4', 'บันทึกแล้ว ✅ คัดลอกลิงก์ด้านล่างเพื่อแชร์'); }
    catch (e) { say('m4', e.message, 1); } finally { setBusy(''); }
  }

  return (<>
    <section className="card">
      <h2>1) 🗓️ ข้อมูลทริป</h2>
      <div className="f"><label>จุดหมาย</label><input value={f.dest} onChange={e => set('dest', e.target.value)} placeholder="เช่น เชียงใหม่, โตเกียว, ลิสบอน" /></div>
      <div className="row">
        <div className="f"><label>วันเริ่มเที่ยว</label><input type="date" value={f.startDate} onChange={e => set('startDate', e.target.value)} /></div>
        <div className="f"><label>จำนวนวัน</label><select value={f.days} onChange={e => set('days', e.target.value)}>{Array.from({ length: 10 }, (_, i) => <option key={i} value={i + 1}>{i + 1} วัน</option>)}</select></div>
        <div className="f"><label>💰 งบรวม (บาท)</label><input type="number" min="500" step="500" value={f.budget} onChange={e => set('budget', e.target.value)} /></div>
      </div>
      <div className="row">
        <div className="f"><label>เที่ยวกับใคร</label><select value={f.who} onChange={e => set('who', e.target.value)}>{['คนเดียว', 'คู่รัก', 'เพื่อน', 'ครอบครัว (มีเด็ก)', 'ครอบครัว (ผู้สูงอายุ)'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="f"><label>จังหวะ</label><select value={f.pace} onChange={e => set('pace', e.target.value)}>{['ชิลๆ', 'สมดุล', 'แน่นๆ'].map(x => <option key={x}>{x}</option>)}</select></div>
        <div className="f"><label>เริ่มเที่ยว</label><input type="time" value={f.startTime} onChange={e => set('startTime', e.target.value)} /></div>
        <div className="f"><label>เลิกเที่ยว</label><input type="time" value={f.endTime} onChange={e => set('endTime', e.target.value)} /></div>
      </div>
      <div className="f"><label>สไตล์ที่ชอบ</label><div className="chips">{STYLES.map(s => <button key={s} type="button" className={'chip' + (styles.has(s) ? ' on' : '')} onClick={() => setStyles(toggle(styles, s))}>{s}</button>)}</div></div>
      <button className="go" disabled={!!busy} onClick={findSpots}>🔍 ค้นหาสถานที่ท่องเที่ยว</button>{M('m1')}
    </section>

    {spots && <section className="card">
      <h2>2) 📍 เลือกสถานที่ที่สนใจ <small style={{ fontWeight: 400, color: 'var(--mut)' }}>(ไม่เลือก = ให้ AI เลือกให้)</small></h2>
      <div className="chips" style={{ marginBottom: 14 }}>{spots.map(s => <button key={s.name} type="button" className={'chip spot' + (picked.has(s.name) ? ' on' : '')} onClick={() => setPicked(toggle(picked, s.name))}><b>{s.name}</b><small>{s.category} · ~{s.hours} ชม.</small></button>)}</div>
      <button className="go" disabled={!!busy} onClick={() => run('plan')}>🤖 จัดตารางเที่ยวให้อัตโนมัติ</button>{M('m2')}
    </section>}

    {plan && <>
      <PlanView plan={plan} dest={f.dest} budget={f.budget} />
      <div className="card noprint"><h2>🌦️ ปรับแผน</h2>
        <div className="f"><textarea rows="2" value={note} onChange={e => setNote(e.target.value)} placeholder="เช่น พรุ่งนี้ฝนตกหนัก / วันที่ 2 เหลือเวลาแค่ 4 ชั่วโมง / ขอลดงบลง 20%" /></div>
        <button className="go" disabled={!!busy} onClick={() => run('adjust')}>🔄 ให้ AI ปรับแผนใหม่</button>{M('m3')}
      </div>
      <div className="card noprint"><h2>☁️ บันทึกและแชร์</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="sec" disabled={!!busy} onClick={save}>☁️ บันทึกขึ้น Cloud</button>
          <button className="sec" onClick={() => window.print()}>🖨️ พิมพ์ / PDF</button>
        </div>{M('m4')}
        {shareUrl && <div className="f" style={{ marginTop: 10 }}><input readOnly value={shareUrl} onFocus={e => e.target.select()} /></div>}
      </div>
    </>}
  </>);
}
