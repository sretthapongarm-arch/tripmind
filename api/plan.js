// Vercel Serverless Function: เรียก Gemini (free tier) โดยซ่อน API key ไว้ฝั่งเซิร์ฟเวอร์
const hits = new Map(); // rate limit ง่ายๆ ต่อ IP (รีเซ็ตเมื่อ function เย็นตัว)
const LIMIT_PER_HOUR = 12;

const SCHEMA = `{"title":string,"summary":string,"totalCostTHB":number,
"hotels":[{"name":string,"area":string,"pricePerNightTHB":number,"why":string}],
"days":[{"day":number,"date":string,"theme":string,"weatherNote":string,
"stops":[{"time":"HH:MM","type":"attraction|food|transport|rest","name":string,"desc":string,"transport":string,"costTHB":number}]}],
"tips":[string]}`;

function buildPrompt(b) {
  const base = `คุณคือผู้เชี่ยวชาญวางแผนท่องเที่ยว ตอบเป็นภาษาไทย ใช้เฉพาะสถานที่ที่มีอยู่จริง ตอบเป็น JSON เท่านั้น`;
  if (b.mode === 'spots') {
    return `${base}\nแนะนำสถานที่ท่องเที่ยวยอดนิยม 12 แห่งใน "${b.dest}" ให้เหมาะกับสไตล์: ${(b.styles || []).join(', ') || 'ทั่วไป'}\n` +
      `รูปแบบ: {"spots":[{"name":string,"category":string,"desc":string(สั้นๆ),"hours":number(ชั่วโมงที่ควรใช้)}]}`;
  }
  const ctx = `จุดหมาย: ${b.dest}\nวันเริ่มเที่ยว: ${b.startDate || 'ไม่ระบุ'} | จำนวนวัน: ${b.days}\n` +
    `งบรวมทั้งทริป (ไม่รวมตั๋วเครื่องบิน): ${b.budget} บาท | เที่ยวกับ: ${b.who} | จังหวะ: ${b.pace}\n` +
    `เวลาที่เที่ยวได้ต่อวัน: ${b.startTime}–${b.endTime}\nสถานที่ที่ผู้ใช้เลือก: ${(b.spots || []).join(', ') || 'ให้ AI เลือกเอง'}\n` +
    `พยากรณ์อากาศ: ${b.weather ? JSON.stringify(b.weather) : 'ไม่มีข้อมูล'}`;
  const rules = `กติกา:
- จัดสถานที่ที่อยู่ใกล้กันไว้วันเดียวกัน เรียงลำดับเส้นทางไม่ให้ย้อนไปมา
- ทุกช่วงมีร้านอาหารมื้อกลางวัน/เย็นที่อยู่ใกล้จุดนั้น (type=food) ระบุเมนูแนะนำ
- ช่อง transport ระบุวิธีเดินทางจากจุดก่อนหน้า พร้อมเวลาและค่าโดยสารโดยประมาณ
- แนะนำที่พัก 3 ตัวเลือกให้เข้ากับงบ (hotels)
- วันที่ฝนตกหรือโอกาสฝนสูง ให้ย้ายกิจกรรมกลางแจ้งไปวันอื่น และใช้กิจกรรมในร่มแทน ใส่เหตุผลใน weatherNote
- ค่าใช้จ่ายรวมต้องไม่เกินงบ (ถ้าเกินให้เตือนใน tips)
- ประเมินราคาเป็นบาทโดยประมาณ`;
  if (b.mode === 'adjust') {
    return `${base}\n${ctx}\n\nแผนเดิม:\n${JSON.stringify(b.plan)}\n\nสถานการณ์ที่ต้องปรับแผน: ${b.note}\n` +
      `ปรับเฉพาะส่วนที่จำเป็น แล้วส่งแผนฉบับใหม่ทั้งหมด\n${rules}\nโครงสร้าง JSON: ${SCHEMA}`;
  }
  return `${base}\n${ctx}\n\n${rules}\nโครงสร้าง JSON: ${SCHEMA}`;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'ใช้ POST เท่านั้น' });
  const key = process.env.GEMINI_API_KEY;
  if (!key) return res.status(500).json({ error: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY' });

  const ip = String(req.headers['x-forwarded-for'] || 'local').split(',')[0].trim();
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (recent.length >= LIMIT_PER_HOUR) return res.status(429).json({ error: 'ใช้งานถี่เกินไป ลองใหม่ในอีกสักครู่' });
  recent.push(now); hits.set(ip, recent);

  const b = req.body || {};
  if (!b.dest || String(b.dest).length > 80) return res.status(400).json({ error: 'กรุณาระบุจุดหมายให้ถูกต้อง' });
  b.days = Math.min(Math.max(parseInt(b.days) || 3, 1), 10);

  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ parts: [{ text: buildPrompt(b) }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || 'เรียก AI ไม่สำเร็จ' });
    const text = (data.candidates?.[0]?.content?.parts || []).map(p => p.text || '').join('');
    return res.status(200).json(JSON.parse(text.replace(/```json|```/g, '').trim()));
  } catch (e) {
    return res.status(500).json({ error: 'AI ตอบกลับผิดรูปแบบ ลองใหม่อีกครั้ง' });
  }
};
