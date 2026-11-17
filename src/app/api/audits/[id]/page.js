'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge, Button, Card, ProgressBar } from '@/components/ui';
import ReportView from '@/components/ReportView';
import { STEPS } from '@/lib/steps';

export default function AuditPage({ params }) {
  const [a, setA] = useState(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    let stop = false, t;
    async function poll() {
      try {
        const r = await fetch(`/api/audit/${params.id}`);
        if (r.status === 404) return setErr('Audit not found');
        const d = await r.json();
        if (stop) return;
        setA(d);
        if (d.status === 'QUEUED' || d.status === 'RUNNING') t = setTimeout(poll, 1500);
      } catch { if (!stop) t = setTimeout(poll, 4000); }
    }
    poll();
    return () => { stop = true; clearTimeout(t); };
  }, [params.id]);

  if (err) return <p role="alert" className="text-crit">{err}</p>;
  if (!a) return <p className="text-muted">Loading…</p>;
  const running = a.status === 'QUEUED' || a.status === 'RUNNING';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-brand underline">All audits</Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{a.client.name}</h1>
          <p className="text-muted">{a.client.websiteUrl}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={a.status}>{a.status}</Badge>
          {a.status === 'COMPLETED' && <a href={`/api/report/${a.id}`} target="_blank" rel="noreferrer"><Button>Download PDF</Button></a>}
        </div>
      </div>

      {a.status === 'FAILED' && <p role="alert" className="rounded-md bg-crit/10 px-4 py-3 text-sm text-crit">The audit failed: {a.errorMessage || 'unknown error'}</p>}

      <Card className="p-5">
        <div className="mb-2 flex justify-between text-sm"><span className="font-medium">{running ? a.currentStep || 'Waiting for a worker to pick this up…' : a.currentStep}</span><span className="tabular-nums text-muted">{a.progress}%</span></div>
        <ProgressBar value={a.progress} />
        <ol className="mt-5 grid gap-x-8 gap-y-2 text-sm md:grid-cols-2">
          {STEPS.map((s) => {
            const done = a.progress >= s.progress;
            const current = running && a.currentStep === s.label && !done;
            return (
              <li key={s.id} className={done ? 'text-ink' : current ? 'font-medium text-brand' : 'text-muted'}>
                <span aria-hidden className="mr-2 inline-block w-4">{done ? '✓' : current ? '●' : '○'}</span>{s.label}
              </li>
            );
          })}
        </ol>
        {a.mocks && <p className="mt-4 text-xs text-muted">Data sources: crawl {a.mocks.crawlMocked ? 'mock fallback' : 'live'} · Claude {a.mocks.claudeMocked ? 'mock response' : 'live API'}</p>}
      </Card>

      {a.notifications?.length > 0 && (
        <Card className="p-5 text-sm">
          <h2 className="mb-2 font-semibold">Delivery</h2>
          <ul className="space-y-1">{a.notifications.map((n) => <li key={n.id}>{n.channel}: <Badge tone={n.status === 'failed' ? 'FAILED' : 'COMPLETED'}>{n.status}</Badge></li>)}</ul>
        </Card>
      )}

      {a.status === 'COMPLETED' && <ReportView result={a.result} overallScore={a.overallScore} scoreBreakdown={a.scoreBreakdown} />}
    </div>
  );
}