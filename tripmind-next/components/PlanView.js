'use client';
import { useState } from 'react';

const ICON = { attraction: '📍', food: '🍜', transport: '🚗', rest: '😴' };
const baht = n => Number(n || 0).toLocaleString();

export default function PlanView({ plan, dest, budget }) {
  const [cur, setCur] = useState(0);
  const map = n => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(n + ' ' + (dest || ''))}`;
  const d = plan.days[Math.min(cur, plan.days.length - 1)];
  return (<>
    <div className="card">
      <h2 style={{ fontSize: '1.4rem' }}>{plan.title}</h2>
      <div>{plan.summary}</div>
      <span className="tag">📅 {plan.days.length} วัน</span>
      <span className="tag">💰 ประมาณ {baht(plan.totalCostTHB)}{budget ? ` / ${baht(budget)}` : ''} บาท</span>
    </div>
    <div className="card">
      <div className="tabs noprint">{plan.days.map((x, i) => <button key={i} className={'chip' + (i === cur ? ' on' : '')} onClick={() => setCur(i)}>วันที่ {x.day}</button>)}</div>
      <h2>{d.theme} <small style={{ color: 'var(--mut)', fontWeight: 400 }}>{d.date}</small></h2>
      {d.weatherNote && <p className="wx">🌦️ {d.weatherNote}</p>}
      {d.stops.map((s, i) => (
        <div className="stop" key={i}>
          <div className="time">{s.time}</div>
          <div>
            <b>{ICON[s.type] || '📍'} {s.name}</b>
            <p>{s.desc}</p>
            {s.transport && <p style={{ fontSize: '.82rem' }}>🚗 {s.transport}</p>}
            <span className="cost">฿{baht(s.costTHB)}</span>{' '}
            {s.type !== 'transport' && s.type !== 'rest' && <a href={map(s.name)} target="_blank" rel="noopener noreferrer">เปิดแผนที่ ↗</a>}
          </div>
        </div>
      ))}
    </div>
    <div className="card"><h2>🏨 ที่พักแนะนำ</h2>
      {(plan.hotels || []).map((h, i) => (
        <div className="hotel" key={i}><b>{h.name}</b> · {h.area} · ฿{baht(h.pricePerNightTHB)}/คืน<p>{h.why}</p>
          <a href={map(h.name)} target="_blank" rel="noopener noreferrer">เปิดแผนที่ ↗</a></div>
      ))}
    </div>
    <div className="card"><h2>💡 เคล็ดลับ</h2>
      <ul>{(plan.tips || []).map((t, i) => <li key={i}>{t}</li>)}</ul>
      <p style={{ fontSize: '.8rem', color: 'var(--mut)' }}>⚠️ ข้อมูลและราคาเป็นการประเมินจาก AI กรุณาตรวจสอบก่อนเดินทาง</p>
    </div>
  </>);
}
