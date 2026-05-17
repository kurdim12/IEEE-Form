import { motion } from 'framer-motion';

export default function LanguageToggle({ lang, onToggle, t }) {
  const isArabic = lang === 'ar';
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={t.languageToggle.ariaLabel}
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-ieee-200 hover:bg-ieee-50 hover:text-ieee"
    >
      <motion.span
        key={lang}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-center gap-2"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span>{t.languageToggle.label}</span>
        <span
          className={`rounded-md px-1.5 py-0.5 text-[10px] font-bold ${
            isArabic ? 'bg-ieee text-white' : 'bg-accent text-ieee-900'
          }`}
        >
          {isArabic ? 'AR' : 'EN'}
        </span>
      </motion.span>
    </button>
  );
}
