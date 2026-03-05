import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home as HomeIcon, Smartphone, Globe, ChevronLeft, X } from 'lucide-react';

export default function Install() {
  const navigate = useNavigate();
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showManual, setShowManual] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Already installed – skip directly to app
    if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone) {
      navigate(createPageUrl('Home'), { replace: true });
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      navigate(createPageUrl('Home'), { replace: true });
    });
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (deferredPrompt) {
      setInstalling(true);
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setInstalling(false);
      if (outcome === 'accepted') return; // appinstalled event will navigate
      setDeferredPrompt(null);
    } else {
      setShowManual(true);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 flex flex-col items-center justify-center px-6" dir="rtl">
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-24 h-24 bg-white rounded-[28px] flex items-center justify-center mx-auto mb-5 shadow-2xl shadow-blue-900/40">
          <HomeIcon className="w-12 h-12 text-blue-600" />
        </div>
        <h1 className="text-3xl font-black text-white mb-2">מיפוי אוכלוסייה</h1>
        <p className="text-blue-200 text-sm">Field Census App · עבודה מלאה ללא אינטרנט</p>
      </div>

      {/* Features */}
      <div className="w-full max-w-sm mb-10 space-y-2.5">
        {[
          { icon: '📶', text: 'עובד ללא חיבור לאינטרנט' },
          { icon: '💾', text: 'שמירה אוטומטית מקומית' },
          { icon: '📤', text: 'ייצוא נתונים ל-Excel ו-ZIP' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-3 bg-white/10 rounded-2xl px-4 py-3">
            <span className="text-xl">{f.icon}</span>
            <span className="text-white text-sm font-medium">{f.text}</span>
          </div>
        ))}
      </div>

      {/* Buttons */}
      <div className="w-full max-w-sm space-y-3">
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full py-4 bg-white text-blue-700 rounded-2xl font-bold text-base shadow-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 select-none"
        >
          <Smartphone className="w-5 h-5" />
          {installing ? 'מתקין...' : 'התקן כאפליקציה'}
        </button>

        <button
          onClick={() => { sessionStorage.setItem('install-skipped', '1'); navigate(createPageUrl('Home')); }}
          className="w-full py-4 bg-white/15 text-white rounded-2xl font-semibold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 select-none border border-white/20"
        >
          <Globe className="w-5 h-5" />
          המשך בדפדפן
        </button>
      </div>

      {/* Manual Install Modal */}
      {showManual && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center px-4 pb-6">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">כיצד להתקין</h2>
              <button onClick={() => setShowManual(false)} className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-700">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-green-50 dark:bg-green-900/30 rounded-2xl p-4">
                <p className="font-bold text-green-800 dark:text-green-300 mb-2">🤖 Android – Chrome</p>
                <ol className="text-sm text-green-700 dark:text-green-300 space-y-1 list-decimal list-inside">
                  <li>לחץ על ⋮ (תפריט) בפינה הימנית העליונה</li>
                  <li>בחר "הוסף לדף הבית" / "התקן אפליקציה"</li>
                  <li>אשר את ההתקנה</li>
                </ol>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-2xl p-4">
                <p className="font-bold text-slate-700 dark:text-slate-200 mb-2">🍎 iOS – Safari</p>
                <ol className="text-sm text-slate-600 dark:text-slate-300 space-y-1 list-decimal list-inside">
                  <li>לחץ על כפתור השיתוף (□↑) בתחתית</li>
                  <li>בחר "הוסף למסך הבית"</li>
                  <li>לחץ "הוסף"</li>
                </ol>
              </div>
            </div>

            <button
              onClick={() => { setShowManual(false); sessionStorage.setItem('install-skipped', '1'); navigate(createPageUrl('Home')); }}
              className="w-full mt-5 py-3.5 bg-blue-600 text-white rounded-2xl font-bold active:scale-95 transition-transform"
            >
              המשך בדפדפן בינתיים
            </button>
          </div>
        </div>
      )}
    </div>
  );
}