import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // change this line to match the import in clients/route.js

export const dynamic = 'force-dynamic';

// GET /api/audits → latest 25 audits with their client
export async function GET() {
  try {
    const audits = await prisma.audit.findMany({
      orderBy: { createdAt: 'desc' },
      take: 25,
      include: { client: true },
    });
    return NextResponse.json({ audits });
  } catch (e) {
    return NextResponse.json({ error: 'Could not load audits' }, { status: 500 });
  }
}