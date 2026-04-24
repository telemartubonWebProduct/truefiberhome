'use client';

import { useState } from 'react';

export default function LineTest() {
  const [loading, setLoading] = useState(false);

  const sendNotification = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/notify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'สวัสดี! แจ้งเตือนสำเร็จแล้ว 🚀',
  }),
});

      const data = await response.json();
      
      if (response.ok) {
        alert('แจ้งเตือนเข้า LINE แล้ว!');
      } else {
        alert(`เกิดข้อผิดพลาด: ${data.error}`);
      }
    } catch (error) {
      alert('เชื่อมต่อ API ไม่สำเร็จ');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="p-10">
      <h1 className="text-2xl font-bold mb-4">ระบบแจ้งเตือน LINE</h1>
      <button 
        onClick={sendNotification} 
        disabled={loading}
        className="bg-green-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'กำลังส่ง...' : 'ทดสอบส่งการแจ้งเตือน'}
      </button>
    </main>
  );
}