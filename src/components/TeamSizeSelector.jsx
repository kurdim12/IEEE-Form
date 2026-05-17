import { motion } from 'framer-motion';

const SIZES = ['2', '3'];

export default function TeamSizeSelector({ value, onChange, t, error }) {
  return (
    <div>
      <label className="field-label">{t.teamInfo.teamSizeLabel}</label>
      <p className="mb-3 text-sm text-slate-500">{t.teamInfo.teamSizeHint}</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {SIZES.map((size) => {
          const isActive = value === size;
          const label = size === '2' ? t.teamInfo.twoMembers : t.teamInfo.threeMembers;
          const desc = size === '2' ? t.teamInfo.twoMembersDesc : t.teamInfo.threeMembersDesc;
          return (
            <motion.button
              key={size}
              type="button"
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(size)}
              className={`group relative flex items-center gap-4 rounded-2xl border-2 p-4 text-start transition ${
                isActive
                  ? 'border-ieee bg-ieee-50/70 shadow-soft'
                  : 'border-slate-200 bg-white hover:border-ieee-200 hover:bg-ieee-50/40'
              }`}
              aria-pressed={isActive}
            >
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-2xl ${
                  isActive ? 'bg-ieee text-white' : 'bg-slate-100 text-slate-500 group-hover:bg-ieee-100 group-hover:text-ieee'
                }`}
              >
                <span aria-hidden="true">👥</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900">{label}</span>
                  <span
                    className={`rounded-md px-2 py-0.5 text-xs font-bold ${
                      isActive ? 'bg-ieee text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {size}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>

              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
                  isActive ? 'border-ieee bg-ieee text-white' : 'border-slate-300 bg-white text-transparent'
                }`}
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-3.5 w-3.5"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </motion.button>
          );
        })}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}
