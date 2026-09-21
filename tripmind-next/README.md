# TripMind (Next.js) – AI Tourism Itinerary Platform, MVP ฟรี

ฟีเจอร์: กำหนดวัน/งบ · เลือกสถานที่ · เส้นทาง/การเดินทาง · ร้านอาหาร · ที่พัก · AI จัดตารางอัตโนมัติ · ปรับแผนตามอากาศ/เวลา · บันทึกขึ้น Cloud (Supabase) แล้วแชร์ลิงก์

## Deploy โดยไม่ต้องติดตั้งโปรแกรม (ทำในเบราว์เซอร์ทั้งหมด)

### 1) Gemini API key (ฟรี)
https://aistudio.google.com/apikey → Create API key → คัดลอกเก็บไว้

### 2) Supabase (ฟรี) สำหรับเก็บข้อมูลบน Cloud
1. สมัคร https://supabase.com → New project
2. เมนู SQL Editor → วางเนื้อหาไฟล์ `supabase.sql` → Run
3. Project Settings → API → คัดลอก `Project URL` และ `service_role` key (เก็บเป็นความลับ ห้ามใส่ในหน้าเว็บ)

### 3) อัปโหลดขึ้น GitHub
repo ที่ว่างเปล่าเปิดใน VS Code เว็บไม่ได้ ให้อัปโหลดไฟล์ก่อน:
repo → **uploading an existing file** → แตก zip แล้วลากไฟล์/โฟลเดอร์ทั้งหมดข้างในโฟลเดอร์ `tripmind-next` ขึ้นไป
(`package.json`, `app/`, `components/`, `lib/` ต้องอยู่ระดับบนสุดของ repo) → Commit changes

### 4) Deploy บน Vercel (ฟรี)
vercel.com → Sign up ด้วย GitHub → Add New > Project → เลือก repo → เปิด Environment Variables ใส่
- `GEMINI_API_KEY`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

→ Deploy → เปิดลิงก์ `xxx.vercel.app`

## หมายเหตุ
- โควตาฟรีของ Gemini/Supabase/Vercel เปลี่ยนได้ ตรวจในหน้าของแต่ละเจ้า
- ลิงก์แชร์ (`/trip?id=...`) ใครมีลิงก์ก็เปิดดูได้ ยังไม่มีระบบล็อกอิน
- จำกัด 12 ครั้ง/ชม./IP ที่ `app/api/plan/route.js`
- ข้อมูลจาก AI เป็นการประเมิน ควรตรวจสอบก่อนเดินทาง
