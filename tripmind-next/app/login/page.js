'use client';

import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage('เข้าสู่ระบบไม่สำเร็จ: ' + error.message);
    } else {
      window.location.href = '/';
    }
  }

  async function handleSignUp() {
    setLoading(true);
    setMessage('');
    const { error } = await supabaseClient.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage('สมัครไม่สำเร็จ: ' + error.message);
    } else {
      setMessage('สมัครสำเร็จ กรุณาตรวจอีเมลเพื่อยืนยัน (ถ้าระบบเปิดใช้) แล้วลองเข้าสู่ระบบ');
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: '80px auto', padding: 16 }}>
      <h1 style={{ marginBottom: 16 }}>เข้าสู่ระบบ TripMind</h1>
      <form onSubmit={handleLogin} style={{ display: 'grid', gap: 12 }}>
        <input
          type="email"
          placeholder="อีเมล"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ padding: 10 }}
        />
        <input
          type="password"
          placeholder="รหัสผ่าน (อย่างน้อย 6 ตัว)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          style={{ padding: 10 }}
        />
        <button type="submit" disabled={loading} style={{ padding: 10 }}>
          {loading ? 'กำลังดำเนินการ...' : 'เข้าสู่ระบบ'}
        </button>
        <button type="button" onClick={handleSignUp} disabled={loading} style={{ padding: 10 }}>
          สมัครสมาชิก
        </button>
      </form>
      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </main>
  );
}
