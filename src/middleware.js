import { NextResponse } from 'next/server';

// Admin pages and admin APIs use the browser's login popup (HTTP Basic auth).
// Cron has its own CRON_SECRET; client dashboards and PDFs stay open.
export function middleware(req) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) return NextResponse.next(); // no ADMIN_PASSWORD set → open (local dev)

  const header = req.headers.get('authorization') || '';
  if (header.startsWith('Basic ')) {
    const [u, ...rest] = atob(header.slice(6)).split(':');
    if (u === (process.env.ADMIN_USER || 'admin') && rest.join(':') === password) {
      return NextResponse.next();
    }
  }

  return new NextResponse('Authentication required', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Admin"' },
  });
}

export const config = { matcher: ['/admin/:path*', '/api/audit/:path*', '/api/audit', '/api/audits', '/api/clients'] };