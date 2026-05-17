import { motion } from 'framer-motion';
import LanguageToggle from './LanguageToggle.jsx';
import Logo from './Logo.jsx';

export default function Header({ lang, onToggleLang, t }) {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-ieee-50 via-white to-petra-50/40" />
      <div className="absolute inset-x-0 top-0 -z-10 h-48 bg-[radial-gradient(ellipse_at_top,_rgba(0,98,155,0.15),transparent_70%)]" />

      <div className="mx-auto flex max-w-4xl items-center justify-end px-4 pt-4 sm:px-6 sm:pt-6">
        <LanguageToggle lang={lang} onToggle={onToggleLang} t={t} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mx-auto flex max-w-4xl flex-col items-center px-4 pb-6 pt-4 text-center sm:px-6 sm:pb-10"
      >
        <Logo
          name="logo"
          alt={lang === 'ar' ? 'الفرع الطلابي IEEE - جامعة البترا' : 'IEEE University of Petra Student Branch'}
          className="h-28 w-auto object-contain drop-shadow-sm sm:h-36 md:h-40"
        />
        <p className="mt-4 text-sm font-semibold text-slate-600 sm:text-base">
          {t.header.subtitle}
        </p>
      </motion.div>
    </header>
  );
}
