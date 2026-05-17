import { motion } from 'framer-motion';
import { MAJORS } from '../lib/i18n.js';

export default function MemberForm({
  role,
  index,
  title,
  badge,
  register,
  errors,
  t,
  lang,
}) {
  const prefix = role;
  const memberErrors = errors?.[prefix] || {};
  const isRTL = lang === 'ar';

  return (
    <motion.fieldset
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className="rounded-2xl border border-slate-100 bg-white/70 p-5 shadow-sm sm:p-6"
    >
      <legend className="mb-4 flex items-center gap-2 px-2">
        <span
          className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${
            role === 'leader' ? 'bg-accent text-ieee-900' : 'bg-ieee-100 text-ieee-700'
          }`}
          aria-hidden="true"
        >
          {role === 'leader' ? '★' : index}
        </span>
        <span className="text-base font-bold text-slate-900">{title}</span>
        {badge && (
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              role === 'leader' ? 'bg-accent/20 text-ieee-800' : 'bg-ieee-50 text-ieee-700'
            }`}
          >
            {badge}
          </span>
        )}
      </legend>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${prefix}-fullName`}>
            {t.members.fullName}
            <span className="text-red-500"> *</span>
          </label>
          <input
            id={`${prefix}-fullName`}
            type="text"
            autoComplete="name"
            placeholder={t.members.fullNamePlaceholder}
            className={`field-input ${memberErrors.fullName ? 'field-input-error' : ''}`}
            {...register(`${prefix}.fullName`)}
          />
          {memberErrors.fullName && (
            <p className="field-error">{memberErrors.fullName.message}</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={`${prefix}-universityId`}>
            {t.members.universityId}
            <span className="text-red-500"> *</span>
          </label>
          <input
            id={`${prefix}-universityId`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={9}
            dir="ltr"
            placeholder={t.members.universityIdPlaceholder}
            className={`field-input no-spinner ${isRTL ? 'text-end' : ''} ${
              memberErrors.universityId ? 'field-input-error' : ''
            }`}
            {...register(`${prefix}.universityId`)}
          />
          {memberErrors.universityId && (
            <p className="field-error">{memberErrors.universityId.message}</p>
          )}
        </div>

        <div>
          <label className="field-label" htmlFor={`${prefix}-phone`}>
            {t.members.phone}
            <span className="text-red-500"> *</span>
          </label>
          <input
            id={`${prefix}-phone`}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            dir="ltr"
            placeholder={t.members.phonePlaceholder}
            className={`field-input ${isRTL ? 'text-end' : ''} ${
              memberErrors.phone ? 'field-input-error' : ''
            }`}
            {...register(`${prefix}.phone`)}
          />
          {memberErrors.phone && (
            <p className="field-error">{memberErrors.phone.message}</p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="field-label" htmlFor={`${prefix}-major`}>
            {t.members.major}
            <span className="text-red-500"> *</span>
          </label>
          <select
            id={`${prefix}-major`}
            defaultValue=""
            className={`field-input appearance-none bg-[length:1.25rem_1.25rem] bg-no-repeat pr-10 ${
              isRTL ? 'bg-left bg-[position:1rem_center] pl-10 pr-4' : 'bg-right bg-[position:right_1rem_center]'
            } ${memberErrors.major ? 'field-input-error' : ''}`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'/%3e%3c/svg%3e\")",
            }}
            {...register(`${prefix}.major`)}
          >
            <option value="" disabled>
              {t.members.majorPlaceholder}
            </option>
            {MAJORS.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
          {memberErrors.major && (
            <p className="field-error">{memberErrors.major.message}</p>
          )}
        </div>
      </div>
    </motion.fieldset>
  );
}
