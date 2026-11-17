import { NextResponse } from 'next/server';
import { enqueueDueAudits, processQueuedInline } from '@/lib/cron';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Vercel Hobby allows up to 60s with Fluid compute; keep batches small.

// GET /api/cron/audits — called by cron-job.org every minute with header:  x-cron-secret: <CRON_SECRET>
export async function GET(req) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  const given = req.headers.get('x-cron-secret') || (req.headers.get('authorization') || '').replace(/^Bearer /, '');
  if (given !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const enqueued = await enqueueDueAudits();

  let processed = [];
  if (process.env.INLINE_PROCESSING === 'true') {
    processed = await processQueuedInline(Number(process.env.CRON_BATCH_SIZE || 1));
  }
  return NextResponse.json({ ok: true, enqueued, processed, inline: process.env.INLINE_PROCESSING === 'true' });
}