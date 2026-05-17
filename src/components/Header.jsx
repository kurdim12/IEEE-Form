import { motion } from 'framer-motion';
import LanguageToggle from './LanguageToggle.jsx';
import Logo from './Logo.jsx';

export default function Header({ lang, onToggleLang, t }) {
  const isRTL = lang === 'ar';
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ieee-50 via-white to-ieee-50/40" />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-[radial-gradient(ellipse_at_top,_rgba(0,98,155,0.18),transparent_70%)]" />

      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 pb-4 pt-5 sm:px-6 sm:pt-7">
        <div className="flex flex-1 items-center justify-start">
          <Logo
            name={isRTL ? 'ieee-logo' : 'uop-logo'}
            alt={isRTL ? 'IEEE Logo' : 'University of Petra Logo'}
            className="h-14 w-auto object-contain drop-shadow-sm sm:h-16"
          />
        </div>

        <LanguageToggle lang={lang} onToggle={onToggleLang} t={t} />

        <div className="flex flex-1 items-center justify-end">
          <Logo
            name={isRTL ? 'uop-logo' : 'ieee-logo'}
            alt={isRTL ? 'University of Petra Logo' : 'IEEE Logo'}
            className="h-14 w-auto object-contain drop-shadow-sm sm:h-16"
          />
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto max-w-4xl px-4 pb-6 text-center sm:px-6 sm:pb-10"
      >
        <span className="chip mb-3">
          <span className="h-1.5 w-1.5 rounded-full bg-ieee animate-pulse" />
          {t.header.branch}
        </span>
        <h1 className="text-2xl font-extrabold tracking-tight text-ieee-700 sm:text-3xl md:text-4xl">
          {t.header.org}
        </h1>
        <p className="mt-2 text-base font-semibold text-slate-600 sm:text-lg">
          {t.header.subtitle}
        </p>
      </motion.div>
    </header>
  );
}
