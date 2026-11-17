import { scoreColor } from './ui';

export default function ScoreDial({ score, size = 200, dark = false }) {
  const r = 70, c = 2 * Math.PI * r, arc = c * 0.75;
  const s = Math.max(0, Math.min(100, score ?? 0));
  const color = scoreColor(s, dark);
  return (
    <div className="relative inline-block" style={{ width: size, height: size }} role="img" aria-label={`Overall SEO score ${s} out of 100`}>
      <svg viewBox="0 0 168 168" width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
        <circle cx="84" cy="84" r={r} fill="none" stroke={dark ? 'rgba(255,255,255,0.14)' : '#E1E6EC'} strokeWidth="14" strokeDasharray={`${arc} ${c}`} strokeLinecap="round" />
        <circle cx="84" cy="84" r={r} fill="none" stroke={color} strokeWidth="14" strokeDasharray={`${(arc * s) / 100} ${c}`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-6xl font-bold tabular-nums" style={{ color: dark ? '#FFFFFF' : color }}>{score ?? '–'}</span>
        <span className={dark ? 'text-xs text-white/60' : 'text-xs text-muted'}>out of 100</span>
      </div>
    </div>
  );
}