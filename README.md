# TripMind – AI Tourism Itinerary Platform (MVP, ฟรี)

ฟีเจอร์: เลือกสถานที่ · กำหนดวัน/งบ/เวลา · เส้นทางและการเดินทาง · ร้านอาหาร · ที่พัก · AI จัดตารางอัตโนมัติ · ปรับแผนตามอากาศ (Open-Meteo) หรือเวลาที่มี

## โครงสร้าง
- `public/index.html` หน้าเว็บ (ไม่ต้อง build)
- `api/plan.js` ฟังก์ชันหลังบ้าน เรียก Gemini โดยซ่อน API key
- อากาศ: เรียก Open-Meteo จากเบราว์เซอร์ (ฟรี ไม่ต้องใช้ key)

## ขั้นตอน (ฟรีทั้งหมด)
1. รับ API key ฟรี: https://aistudio.google.com/apikey
2. อัปโหลดโฟลเดอร์นี้ขึ้น GitHub
3. สมัคร https://vercel.com (Hobby ฟรี) → Add New Project → เลือก repo
4. Settings → Environment Variables → เพิ่ม `GEMINI_API_KEY` → Deploy
5. เปิด `https://ชื่อโปรเจกต์.vercel.app`

## ทดสอบในเครื่อง
```
npm i -g vercel
cp .env.example .env   # ใส่ GEMINI_API_KEY
vercel dev
```

## หมายเหตุ
- โควตา free tier ของ Gemini เปลี่ยนได้ ตรวจที่ AI Studio; เปลี่ยนโมเดลได้ด้วย env `GEMINI_MODEL`
- มี rate limit 12 ครั้ง/ชม./IP ใน `api/plan.js` (ปรับได้)
- พยากรณ์อากาศดูได้ล่วงหน้าราว 16 วัน
- ข้อมูลจาก AI อาจคลาดเคลื่อน ควรตรวจสอบก่อนเดินทาง

## ต่อยอด
บันทึกทริป (Supabase free) · ล็อกอิน · แผนที่ฝัง (Leaflet + OpenStreetMap) · แชร์ลิงก์แผน
