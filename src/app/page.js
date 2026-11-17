import Link from 'next/link';
import { prisma } from '@/lib/prisma';
import { Card, Badge, scoreColor, scoreLabel } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' },
    include: { audits: { where: { status: 'COMPLETED' }, orderBy: { createdAt: 'desc' }, take: 1 } },
  });
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-navy px-8 py-10 text-white">
        <h1 className="max-w-2xl text-4xl font-bold leading-tight tracking-tight">Find out what is holding your local rankings back.</h1>
        <p className="mt-3 max-w-xl text-white/70">Every client gets an automated SEO audit: a score out of 100, the fixes ranked by urgency, and a PDF report they can share. Open a dashboard below to see the latest results.</p>
      </section>

      {clients.length === 0 ? (
        <Card className="p-6 text-sm">No clients yet. Add one in the <Link className="font-semibold text-brand underline" href="/admin">admin portal</Link>.</Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((c) => {
            const s = c.audits[0]?.overallScore;
            return (
              <Link key={c.id} href={`/client/${c.id}`}>
                <Card className="flex items-center gap-4 p-5 transition-shadow hover:shadow-md">
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full border-4 text-xl font-bold tabular-nums"
                    style={s != null ? { borderColor: scoreColor(s), color: scoreColor(s) } : { borderColor: '#E1E6EC', color: '#5E6E7C' }}>
                    {s ?? '–'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-semibold">{c.name}</h2>
                    <p className="truncate text-sm text-muted">{c.websiteUrl}</p>
                    <p className="text-sm text-muted">{c.city}, {c.state}</p>
                  </div>
                  {s != null ? <Badge tone={s >= 80 ? 'COMPLETED' : s >= 60 ? 'MEDIUM' : 'CRITICAL'}>{scoreLabel(s)}</Badge> : <Badge>No audit yet</Badge>}
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}