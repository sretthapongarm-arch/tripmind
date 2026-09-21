import { NextResponse } from 'next/server';

const hits = new Map();
const LIMIT_PER_HOUR = 12;

const SCHEMA = `{"title":string,"summary":string,"totalCostTHB":number,
"hotels":[{"name":string,"area":string,"pricePerNightTHB":number,"why":string}],
"days":[{"day":number,"date":string,"theme":string,"weatherNote":string,
"stops":[{"time":"HH:MM","type":"attraction|food|transport|rest","name":string,"desc":string,"transport":string,"costTHB":number}]}],
"tips":[string]}`;

function buildPrompt(b) {
  const base = 'คุณคือผู้เชี่ยวชาญวางแผนท่องเที่ยว ตอบเป็นภาษาไทย ใช้เฉพาะสถานที่ที่มีอยู่จริง ตอบเป็น JSON เท่านั้น';
  if (b.mode === 'spots') {
    return `${base}\nแนะนำสถานที่ท่องเที่ยวยอดนิยม 12 แห่งใน "${b.dest}" ให้เหมาะกับสไตล์: ${(b.styles || []).join(', ') || 'ทั่วไป'}\nรูปแบบ: {"spots":[{"name":string,"category":string,"desc":string,"hours":number}]}`;
  }
  const ctx = `จุดหมาย: ${b.dest}\nวันเริ่มเที่ยว: ${b.startDate || 'ไม่ระบุ'} | จำนวนวัน: ${b.days}\nงบรวมทั้งทริป (ไม่รวมตั๋วเครื่องบิน): ${b.budget} บาท | เที่ยวกับ: ${b.who} | จังหวะ: ${b.pace}\nเวลาที่เที่ยวได้ต่อวัน: ${b.startTime}–${b.endTime}\nสถานที่ที่ผู้ใช้เลือก: ${(b.spots || []).join(', ') || 'ให้ AI เลือกเอง'}\nพยากรณ์อากาศ: ${b.weather ? JSON.stringify(b.weather) : 'ไม่มีข้อมูล'}`;
  const rules = `กติกา:
- จัดสถานที่ที่อยู่ใกล้กันไว้วันเดียวกัน เรียงลำดับเส้นทางไม่ให้ย้อนไปมา
- ทุกวันมีร้านอาหารมื้อกลางวัน/เย็นใกล้จุดนั้น (type=food) ระบุเมนูแนะนำ
- ช่อง transport ระบุวิธีเดินทางจากจุดก่อนหน้า พร้อมเวลาและค่าโดยสารโดยประมาณ
- แนะนำที่พัก 3 ตัวเลือกให้เข้ากับงบ (hotels)
- วันที่ฝนตกหรือโอกาสฝนสูง ให้ย้ายกิจกรรมกลางแจ้งไปวันอื่น ใช้กิจกรรมในร่มแทน ใส่เหตุผลใน weatherNote
- ค่าใช้จ่ายรวมต้องไม่เกินงบ (ถ้าเกินให้เตือนใน tips)
- ประเมินราคาเป็นบาทโดยประมาณ`;
  if (b.mode === 'adjust') {
    return `${base}\n${ctx}\n\nแผนเดิม:\n${JSON.stringify(b.plan)}\n\nสถานการณ์ที่ต้องปรับแผน: ${b.note}\nปรับเฉพาะส่วนที่จำเป็น แล้วส่งแผนฉบับใหม่ทั้งหมด\n${rules}\nโครงสร้าง JSON: ${SCHEMA}`;
  }
  return `${base}\n${ctx}\n\n${rules}\nโครงสร้าง JSON: ${SCHEMA}`;
}

export async function POST(req) {
  const err = (m, s) => NextResponse.json({ error: m }, { status: s });
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return err('ยังไม่ได้ตั้งค่า GEMINI_API_KEY', 500);

  const ip = String(req.headers.get('x-forwarded-for') || 'local').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (recent.length >= LIMIT_PER_HOUR) return err('ใช้งานถี่เกินไป ลองใหม่ในอีกสักครู่', 429);
  recent.push(now); hits.set(ip, recent);

  const b = await req.json().catch(() => ({}));
  if (!b.dest || String(b.dest).length > 80) return err('กรุณาระบุจุดหมายให้ถูกต้อง', 400);
  b.days = Math.min(Math.max(parseInt(b.days) || 3, 1), 10);

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({ contents: [{ parts: [{ text: buildPrompt(b) }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.7 } })
    });
    const data = await r.json();
    if (!r.ok) return err(data?.error?.message || 'เรียก AI ไม่สำเร็จ', 502);
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    return NextResponse.json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return err('AI ตอบกลับผิดรูปแบบ ลองใหม่อีกครั้ง', 500);
  }
}
