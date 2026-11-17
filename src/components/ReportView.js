import ScoreDial from './ScoreDial';
import { Badge, Card, scoreColor, scoreLabel } from './ui';

const LABELS = { technical: 'Technical', on_page: 'On-page', content: 'Content', core_web_vitals: 'Core Web Vitals', schema: 'Schema' };
const ORDER = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
const EDGE = { CRITICAL: 'border-l-crit', HIGH: 'border-l-high', MEDIUM: 'border-l-med', LOW: 'border-l-low' };
const txt = (i) => (typeof i === 'string' ? i : i?.finding || i?.title || JSON.stringify(i));

function IssueList({ title, items, dot }) {
  if (!items?.length) return null;
  return (
    <Card className="p-5">
      <h3 className="mb-3 flex items-center gap-2 font-semibold">
        {title}
        <span className="rounded-full bg-paper px-2 py-0.5 text-xs font-medium text-muted">{items.length}</span>
      </h3>
      <ul className="space-y-2.5 text-sm leading-relaxed">
        {items.map((i, k) => (
          <li key={k} className="flex gap-2.5">
            <span className={`mt-2 h-1.5 w-1.5 shrink-0 rounded-full ${dot}`} />
            <span>{txt(i)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

export default function ReportView({ result, overallScore, scoreBreakdown }) {
  if (!result) return null;
  const breakdown = scoreBreakdown || result.score_breakdown || {};
  const score = overallScore ?? result.overall_score;
  const keys = Object.keys(LABELS).filter((k) => k in breakdown);
  const recs = [...(result.recommendations || [])].sort((a, b) => (ORDER[a.priority] ?? 9) - (ORDER[b.priority] ?? 9));

  return (
    <div className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-navy text-white shadow-sm">
        <div className="grid gap-8 p-7 md:grid-cols-[auto_1fr] md:items-center">
          <div className="flex flex-col items-center gap-2">
            <ScoreDial score={score} dark />
            <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium" style={{ color: scoreColor(score, true) }}>{scoreLabel(score)}</span>
          </div>
          <p className="max-w-prose text-lg leading-relaxed text-white/90">{result.executive_summary}</p>
        </div>
        <div className="grid grid-cols-2 gap-px bg-white/10 md:grid-cols-5">
          {keys.map((k) => (
            <div key={k} className="bg-navy px-5 py-4">
              <div className="text-xs text-white/60">{LABELS[k]}</div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-2xl font-semibold tabular-nums">{breakdown[k]}</span>
                <span className="text-xs text-white/50">/100</span>
              </div>
              <div className="mt-2 h-1 rounded-full bg-white/15">
                <div className="h-full rounded-full" style={{ width: `${breakdown[k]}%`, background: scoreColor(breakdown[k], true) }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <IssueList title="Critical issues" items={result.critical_issues} dot="bg-crit" />
        <IssueList title="Quick wins (2 hours or less)" items={result.quick_wins} dot="bg-low" />
      </div>
      <IssueList title="Important issues" items={result.important_issues} dot="bg-high" />

      <div>
        <h3 className="mb-3 text-lg font-semibold">Recommendations <span className="text-sm font-normal text-muted">({recs.length}, most urgent first)</span></h3>
        <div className="space-y-3">
          {recs.map((x, i) => (
            <Card key={i} className={`border-l-4 p-5 ${EDGE[x.priority] || ''}`}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <Badge tone={x.priority}>{x.priority}</Badge>
                <span className="text-sm font-semibold">{x.category}</span>
                <span className="rounded-md bg-paper px-2 py-0.5 text-xs text-muted">Impact: {x.estimated_impact}</span>
                <span className="rounded-md bg-paper px-2 py-0.5 text-xs text-muted">Effort: {x.effort}</span>
              </div>
              <div className="grid gap-4 text-sm leading-relaxed md:grid-cols-2">
                <div><p className="mb-1 font-semibold">What we found</p><p className="text-muted">{x.finding}</p></div>
                <div><p className="mb-1 font-semibold">What to do</p><p className="text-muted">{x.fix}</p></div>
              </div>
              <div className="mt-4 rounded-lg bg-paper px-4 py-3 text-sm">
                <span className="font-semibold">How we will know it worked: </span>{x.falsifiability_check}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}