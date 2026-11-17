import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET /api/audit/[id] → status / progress / currentStep / overallScore / result (polled by the admin portal)
export async function GET(_req, { params }) {
  const a = await prisma.audit.findUnique({
    where: { id: params.id },
    include: { client: true, notifications: { orderBy: { createdAt: 'asc' } } },
  });
  if (!a) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({
    id: a.id, status: a.status, progress: a.progress, currentStep: a.currentStep,
    overallScore: a.overallScore, scoreBreakdown: a.scoreBreakdown, result: a.result,
    hasPdf: !!a.pdfPath, errorMessage: a.errorMessage, triggeredBy: a.triggeredBy,
    createdAt: a.createdAt, completedAt: a.completedAt,
    mocks: a.signals?._meta || null,
    client: { id: a.client.id, name: a.client.name, websiteUrl: a.client.websiteUrl },
    notifications: a.notifications,
  });
}