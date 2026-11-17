import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Badge, Button, Card, scoreColor } from '@/components/ui';
import ReportView from '@/components/ReportView';

export const dynamic = 'force-dynamic';

const date = (d) => new Date(d).toLocaleDateString('en-IN', { dateStyle: 'medium' });

export default async function ClientDashboard({ params }) {
  const client = await prisma.client.findUnique({ where: { id: params.clientId } });
  if (!client) notFound();

  const audits = await prisma.audit.findMany({
    where: { clientId: client.id, status: 'COMPLETED' },
    orderBy: { createdAt: 'desc' }, take: 8,
  });
  const latest = audits[0];
  const trend = [...audits].reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-brand underline">All clients</Link>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{client.name}</h1>
          <p className="text-muted">{client.websiteUrl} · {client.city}, {client.state}</p>
        </div>
        {latest && <a href={`/api/report/${latest.id}`} target="_blank" rel="noreferrer"><Button>Download latest PDF</Button></a>}
      </div>

      {!latest ? (
        <Card className="p-6 text-sm text-muted">No completed audit yet. Your first report will appear here as soon as it finishes.</Card>
      ) : (
        <>
          <p className="text-sm text-muted">Latest audit: {date(latest.completedAt || latest.createdAt)}</p>
          <ReportView result={latest.result} overallScore={latest.overallScore} scoreBreakdown={latest.scoreBreakdown} />

          <Card className="p-5">
            <h2 className="mb-4 font-semibold">Score history</h2>
            <div className="flex items-end gap-3" style={{ height: 120 }}>
              {trend.map((a) => (
                <div key={a.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-xs tabular-nums">{a.overallScore}</span>
                  <div className="w-full max-w-10 rounded-t" style={{ height: `${a.overallScore}%`, background: scoreColor(a.overallScore) }} />
                  <span className="text-[11px] text-muted">{new Date(a.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
              ))}
            </div>
            <ul className="mt-5 divide-y divide-line text-sm">
              {audits.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <span>{date(a.createdAt)} <Badge className="ml-2">{a.triggeredBy}</Badge></span>
                  <span className="flex items-center gap-4"><span className="tabular-nums">Score {a.overallScore}</span><a className="text-brand underline" href={`/api/report/${a.id}`} target="_blank" rel="noreferrer">PDF</a></span>
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}