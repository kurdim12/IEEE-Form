import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AnimatePresence, motion } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';

import Header from './components/Header.jsx';
import TeamSizeSelector from './components/TeamSizeSelector.jsx';
import MemberForm from './components/MemberForm.jsx';
import SuccessScreen from './components/SuccessScreen.jsx';
import StepIndicator from './components/StepIndicator.jsx';

import { getTranslation } from './lib/i18n.js';
import { buildFormSchema } from './lib/schema.js';
import { submitRegistration, SubmissionError } from './lib/api.js';

const DEFAULT_MEMBER = { fullName: '', universityId: '', major: '', phone: '' };
const DEFAULT_VALUES = {
  teamName: '',
  teamSize: '',
  leader: { ...DEFAULT_MEMBER },
  member2: { ...DEFAULT_MEMBER },
  member3: { ...DEFAULT_MEMBER },
};

export default function App() {
  const [lang, setLang] = useState(() => {
    if (typeof window === 'undefined') return 'ar';
    const stored = window.localStorage.getItem('ieee-uop-lang');
    return stored === 'en' ? 'en' : 'ar';
  });

  const t = useMemo(() => getTranslation(lang), [lang]);
  const schema = useMemo(() => buildFormSchema(t), [t]);

  const [step, setStep] = useState(1);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onTouched',
    defaultValues: DEFAULT_VALUES,
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    reset,
    formState: { errors, isSubmitting },
  } = form;

  const teamName = watch('teamName');
  const teamSize = watch('teamSize');

  useEffect(() => {
    if (typeof document === 'undefined') return;
    document.documentElement.lang = lang;
    document.documentElement.dir = t.direction;
    window.localStorage.setItem('ieee-uop-lang', lang);
  }, [lang, t.direction]);

  const handleToggleLang = () => {
    setLang((prev) => (prev === 'ar' ? 'en' : 'ar'));
  };

  const canContinue =
    typeof teamName === 'string' && teamName.trim().length >= 2 && (teamSize === '2' || teamSize === '3');

  const handleContinue = async () => {
    const ok = await trigger(['teamName', 'teamSize']);
    if (ok) setStep(2);
  };

  const handleBack = () => setStep(1);

  const onSubmit = async (data) => {
    const payload = {
      teamName: data.teamName.trim(),
      teamSize: data.teamSize,
      leader: data.leader,
      member2: data.member2,
      member3: data.teamSize === '3' ? data.member3 : null,
      meta: {
        language: lang,
        submittedAt: new Date().toISOString(),
      },
    };

    try {
      await submitRegistration(payload);
      setIsSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const code = err instanceof SubmissionError ? err.code : 'generic';
      const msg = t.errors[code] || t.errors.generic;
      toast.error(msg, {
        duration: 5000,
        style: {
          fontFamily: lang === 'ar' ? 'Cairo, sans-serif' : 'Inter, sans-serif',
          direction: t.direction,
          textAlign: lang === 'ar' ? 'right' : 'left',
        },
      });
    }
  };

  const handleReset = () => {
    reset(DEFAULT_VALUES);
    setStep(1);
    setIsSubmitted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const totalSteps = 2;

  return (
    <div className="min-h-screen pb-12">
      <Toaster position="top-center" />
      <Header lang={lang} onToggleLang={handleToggleLang} t={t} />

      <main className="mx-auto max-w-2xl px-4 sm:px-6">
        {!isSubmitted && <StepIndicator current={step} total={totalSteps} t={t} />}

        <AnimatePresence mode="wait" initial={false}>
          {isSubmitted ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35 }}
            >
              <SuccessScreen t={t} onReset={handleReset} />
            </motion.div>
          ) : step === 1 ? (
            <motion.section
              key="step-1"
              initial={{ opacity: 0, x: lang === 'ar' ? -24 : 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === 'ar' ? 24 : -24 }}
              transition={{ duration: 0.3 }}
              className="card space-y-6"
            >
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {t.teamInfo.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t.teamInfo.subtitle}</p>
              </div>

              <div>
                <label className="field-label" htmlFor="teamName">
                  {t.teamInfo.teamNameLabel}
                  <span className="text-red-500"> *</span>
                </label>
                <input
                  id="teamName"
                  type="text"
                  autoComplete="off"
                  placeholder={t.teamInfo.teamNamePlaceholder}
                  className={`field-input ${errors.teamName ? 'field-input-error' : ''}`}
                  {...register('teamName')}
                />
                {errors.teamName && <p className="field-error">{errors.teamName.message}</p>}
              </div>

              <TeamSizeSelector
                value={teamSize}
                onChange={(v) => {
                  setValue('teamSize', v, { shouldValidate: true, shouldDirty: true });
                }}
                t={t}
                error={errors.teamSize?.message}
              />

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="btn-primary w-full sm:w-auto"
                >
                  {t.teamInfo.continue}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`}
                  >
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </motion.section>
          ) : (
            <motion.form
              key="step-2"
              initial={{ opacity: 0, x: lang === 'ar' ? 24 : -24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: lang === 'ar' ? -24 : 24 }}
              transition={{ duration: 0.3 }}
              onSubmit={handleSubmit(onSubmit)}
              className="card space-y-5"
              noValidate
            >
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {t.members.title}
                </h2>
                <p className="mt-1 text-sm text-slate-500">{t.members.subtitle}</p>
                <p className="mt-2 inline-flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
                  <span className="inline-block h-2 w-2 rounded-full bg-ieee" />
                  {teamName} · {teamSize === '3' ? t.teamInfo.threeMembers : t.teamInfo.twoMembers}
                </p>
              </div>

              <MemberForm
                role="leader"
                index={1}
                title={t.members.leader}
                register={register}
                errors={errors}
                t={t}
                lang={lang}
              />

              <MemberForm
                role="member2"
                index={2}
                title={t.members.member2}
                register={register}
                errors={errors}
                t={t}
                lang={lang}
              />

              {teamSize === '3' && (
                <MemberForm
                  role="member3"
                  index={3}
                  title={t.members.member3}
                  register={register}
                  errors={errors}
                  t={t}
                  lang={lang}
                />
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="btn-secondary w-full sm:w-auto"
                  disabled={isSubmitting}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`h-5 w-5 ${lang === 'ar' ? 'rotate-180' : ''}`}
                  >
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                  {t.members.back}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full sm:w-auto"
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="h-5 w-5 animate-spin"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                        />
                      </svg>
                      {t.members.submitting}
                    </>
                  ) : (
                    <>
                      {t.members.submit}
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <footer className="mt-10 text-center text-xs text-slate-400">
          © {t.footer.year} · {t.footer.poweredBy}
        </footer>
      </main>
    </div>
  );
}
