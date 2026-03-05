import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Download, Settings } from 'lucide-react';
import { createPageUrl } from '@/utils';
import InstallBanner from './components/ui/InstallBanner';

// Sync dark mode with system preference
function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = (dark) => document.documentElement.classList.toggle('dark', dark);
    apply(mq.matches);
    mq.addEventListener('change', e => apply(e.matches));
    return () => mq.removeEventListener('change', () => {});
  }, []);
}

const TAB_PAGES = ['Home', 'ExportCenter', 'Settings'];

const tabs = [
  { page: 'Home', icon: HomeIcon, label: 'בית' },
  { page: 'ExportCenter', icon: Download, label: 'ייצוא' },
  { page: 'Settings', icon: Settings, label: 'הגדרות' },
];

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
};

export default function Layout({ children, currentPageName }) {
  useSystemTheme();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to Install screen on first visit (unless already installed as PWA)
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    const skipped = sessionStorage.getItem('install-skipped');
    if (!isStandalone && !skipped && currentPageName !== 'Install') {
      navigate(createPageUrl('Install'), { replace: true });
    }
  }, []);

  const isTabPage = TAB_PAGES.includes(currentPageName);

  return (
    <div
      className="max-w-md mx-auto min-h-screen bg-slate-50 dark:bg-slate-900 relative overflow-hidden flex flex-col"
      dir="rtl"
      style={{ paddingBottom: isTabPage ? 'calc(64px + env(safe-area-inset-bottom))' : 'env(safe-area-inset-bottom)' }}
    >
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        body { background: #f1f5f9; }
        .dark body { background: #0f172a; }
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .page-header { padding-top: calc(1rem + env(safe-area-inset-top)); }
      `}</style>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={location.pathname + location.search}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: 'easeInOut' }}
          className="flex-1"
        >
          {children}
        </motion.div>
      </AnimatePresence>

      {/* Bottom Tab Bar */}
      {isTabPage && (
        <div
          className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white dark:bg-slate-800 border-t border-slate-100 dark:border-slate-700 flex select-none z-50"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {tabs.map(({ page, icon: Icon, label }) => {
            const active = currentPageName === page;
            return (
              <button
                key={page}
                onClick={() => navigate(createPageUrl(page))}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors select-none ${
                  active
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-400 dark:text-slate-500 active:text-slate-600'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${active ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium">{label}</span>
                {active && <span className="absolute bottom-0 w-8 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}