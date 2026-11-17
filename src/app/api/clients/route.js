import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clients = await prisma.client.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json({ clients });
}

export async function POST(req) {
  const b = await req.json().catch(() => ({}));
  const missing = ['name', 'websiteUrl', 'businessType', 'city', 'state'].filter((k) => !String(b[k] || '').trim());
  if (missing.length) return NextResponse.json({ error: `Required: ${missing.join(', ')}` }, { status: 400 });

  let url;
  try { url = new URL(b.websiteUrl.trim()); if (!['http:', 'https:'].includes(url.protocol)) throw new Error(); }
  catch { return NextResponse.json({ error: 'websiteUrl must be a valid http(s) URL' }, { status: 400 }); }

  try {
    const client = await prisma.client.create({
      data: {
        name: b.name.trim(), websiteUrl: url.origin + (url.pathname === '/' ? '' : url.pathname),
        businessType: b.businessType.trim(), city: b.city.trim(), state: b.state.trim(),
        whatsapp: b.whatsapp?.trim() || null, email: b.email?.trim() || null,
      },
    });
    return NextResponse.json({ client }, { status: 201 });
  } catch (e) {
    if (e.code === 'P2002') return NextResponse.json({ error: 'A client with this website URL already exists' }, { status: 409 });
    throw e;
  }
}