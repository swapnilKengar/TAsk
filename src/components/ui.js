const cn = (...c) => c.filter(Boolean).join(' ');

export function Button({ variant = 'primary', className, ...p }) {
  const v = {
    primary: 'bg-brand text-white hover:bg-brand/90 disabled:opacity-50',
    outline: 'border border-line bg-surface text-ink hover:bg-paper disabled:opacity-50',
  }[variant];
  return <button className={cn('inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-semibold transition-colors', v, className)} {...p} />;
}

export function Card({ className, ...p }) {
  return <section className={cn('rounded-xl border border-line bg-surface shadow-sm', className)} {...p} />;
}

const TONES = {
  CRITICAL: 'bg-crit/10 text-crit', HIGH: 'bg-high/10 text-high', MEDIUM: 'bg-med/10 text-med', LOW: 'bg-low/10 text-low',
  COMPLETED: 'bg-low/10 text-low', RUNNING: 'bg-brand/10 text-brand', QUEUED: 'bg-muted/10 text-muted', FAILED: 'bg-crit/10 text-crit',
};
export function Badge({ tone, children, className }) {
  return <span className={cn('inline-block rounded-md px-2 py-0.5 text-xs font-semibold', TONES[tone] || 'bg-muted/10 text-muted', className)}>{children}</span>;
}

export function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand transition-all duration-500" style={{ width: `${value}%` }} />
    </div>
  );
}

// Lighter shades are used on the dark hero panel so they stay readable.
export const scoreColor = (s, onDark = false) =>
  onDark ? (s >= 80 ? '#4ADE80' : s >= 60 ? '#FACC15' : '#F87171') : (s >= 80 ? '#2E8B57' : s >= 60 ? '#A67C00' : '#C62828');

export const scoreLabel = (s) => (s >= 80 ? 'Strong' : s >= 60 ? 'Fair' : 'Needs work');