import React, { useState, useEffect } from 'react';

export default function StatusBar({ screen }) {
  const [online, setOnline] = useState(navigator.onLine);

  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  return (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${online ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      {online ? 'מקוון' : 'לא מקוון'}
    </div>
  );
}