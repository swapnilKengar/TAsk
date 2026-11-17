import './globals.css';
import { Manrope } from 'next/font/google';

const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope' });

export const metadata = {
  title: 'Edgelink SEO Automation Dashboard',
  description: 'Automated SEO audits: crawl, analyse with Claude, report by PDF.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body className="font-sans">
        <header className="bg-navy text-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
            <a href="/" className="flex items-center gap-2.5">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-sm font-bold">E</span>
              <span className="text-base font-semibold tracking-tight">Edgelink SEO</span>
            </a>
            <nav className="flex gap-1 text-sm">
              <a href="/" className="rounded-md px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">Client dashboards</a>
              <a href="/admin" className="rounded-md px-3 py-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">Admin portal</a>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-5 py-8">{children}</main>
      </body>
    </html>
  );
}