import fs from 'fs';
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { pdfkitBuffer } from '@/lib/pdf-kit';

export const dynamic = 'force-dynamic';

// GET /api/report/[id] → the PDF. Serves the worker's file when it's on this machine,
// otherwise re-renders from the audit saved in Postgres (so it works on serverless too).
export async function GET(_req, { params }) {
  const audit = await prisma.audit.findUnique({ where: { id: params.id }, include: { client: true } });
  if (!audit || audit.status !== 'COMPLETED' || !audit.result) {
    return NextResponse.json({ error: 'Report not available' }, { status: 404 });
  }
  let buf;
  if (audit.pdfPath && fs.existsSync(audit.pdfPath)) buf = fs.readFileSync(audit.pdfPath);
  else buf = await pdfkitBuffer({ client: audit.client, audit });

  return new NextResponse(buf, {
    headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `inline; filename="seo-audit-${audit.id}.pdf"` },
  });
}