import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auditQueue } from '@/lib/queue';

export const dynamic = 'force-dynamic';

// POST /api/audit  { clientId } → creates a QUEUED audit, enqueues it, returns immediately.
export async function POST(req) {
  const { clientId } = await req.json().catch(() => ({}));
  if (!clientId) return NextResponse.json({ error: 'clientId required' }, { status: 400 });

  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

  const audit = await prisma.audit.create({ data: { clientId } });
  try {
    await auditQueue.add('run-audit', { auditId: audit.id }, { jobId: audit.id });
  } catch (e) {
    await prisma.audit.update({ where: { id: audit.id }, data: { status: 'FAILED', errorMessage: `Could not enqueue: ${e.message}` } });
    return NextResponse.json({ error: 'Queue unavailable — check REDIS_URL' }, { status: 503 });
  }
  return NextResponse.json({ auditId: audit.id }, { status: 202 });
}