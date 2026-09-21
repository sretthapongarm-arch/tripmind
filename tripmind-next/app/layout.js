import './globals.css';
export const metadata = { title: 'TripMind – AI วางแผนเที่ยว', description: 'AI จัดตารางเที่ยว ปรับตามอากาศและเวลาที่มี' };
export default function RootLayout({ children }) {
  return (<html lang="th"><body><div className="wrap">
    <header><h1><a href="/" style={{color:'inherit',textDecoration:'none'}}>Trip<span>Mind</span> ✈️</a></h1><p>AI จัดตารางเที่ยว ปรับตามอากาศและเวลาที่มี</p></header>
    {children}
  </div></body></html>);
}
