import { motion } from 'framer-motion';

export default function StepIndicator({ current, total, t }) {
  const labels = [t.progress.stepOne, t.progress.stepTwo];
  return (
    <div className="mx-auto mb-5 max-w-2xl px-1">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-500">
        <span>
          {t.progress.step} {current} {t.progress.of} {total}
        </span>
        <span className="text-ieee-700">{labels[current - 1]}</span>
      </div>
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <motion.div
          className="absolute inset-y-0 start-0 rounded-full bg-gradient-to-r from-ieee to-ieee-400"
          initial={false}
          animate={{ width: `${(current / total) * 100}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        />
      </div>
    </div>
  );
}
