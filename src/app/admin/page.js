'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge, Button, Card, ProgressBar } from '@/components/ui';

const EMPTY = { name: '', websiteUrl: '', businessType: '', city: '', state: '', whatsapp: '', email: '' };
const fmt = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

function Stat({ label, value, hint }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </Card>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [clients, setClients] = useState([]);
  const [audits, setAudits] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [loadError, setLoadError] = useState('');

   const load = useCallback(async () => {
    try {
      const [c, a] = await Promise.all([fetch('/api/clients').then((r) => r.json()), fetch('/api/audits').then((r) => r.json())]);
      if (!c.clients || !a.audits) throw new Error('Unexpected response');
      setClients(c.clients);
      setAudits(a.audits);
      setLoadError('');
    } catch { setLoadError('Could not load data. Is the database reachable?'); }
  }, []);

  useEffect(() => { load(); }, [load]);
  const active = audits.some((a) => a.status === 'QUEUED' || a.status === 'RUNNING');
  useEffect(() => {
    const t = setInterval(load, active ? 2000 : 15000);
    return () => clearInterval(t);
  }, [active, load]);

  async function runAudit(clientId) {
    setBusy(clientId); setError('');
    const r = await fetch('/api/audit', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ clientId }) });
    const d = await r.json();
    setBusy(null);
    if (!r.ok) return setError(d.error || 'Could not queue the audit');
    router.push(`/admin/audits/${d.auditId}`);
  }

  

  async function addClient(e) {
    e.preventDefault(); setError('');
    const r = await fetch('/api/clients', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(form) });
    const d = await r.json();
    if (!r.ok) return setError(d.error || 'Could not add the client');
    setForm(EMPTY); load();
  }

  const done = audits.filter((a) => a.status === 'COMPLETED' && a.overallScore != null);
  const avg = done.length ? Math.round(done.reduce((s, a) => s + a.overallScore, 0) / done.length) : '–';
  const inFlight = audits.filter((a) => a.status === 'QUEUED' || a.status === 'RUNNING').length;

  const field = (k, label, props = {}) => (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-muted">{label}</span>
      <input className="w-full rounded-lg border border-line bg-surface px-3 py-2 focus:border-brand" value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} {...props} />
    </label>
  );

  return (
    <div className="space-y-8">
            <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin portal</h1>
          <p className="text-muted">Run audits and watch them move through the queue.</p>
        </div>
      </div>
            {(error || loadError) && <p role="alert" className="rounded-lg bg-crit/10 px-4 py-2 text-sm text-crit">{error || loadError}</p>}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Clients" value={clients.length} />
        <Stat label="Recent audits" value={audits.length} hint="latest 25" />
        <Stat label="Average score" value={avg} hint="completed audits" />
        <Stat label="In progress" value={inFlight} hint="queued or running" />
      </div>

      <Card className="overflow-x-auto">
        <div className="border-b border-line px-5 py-3.5 font-semibold">Clients</div>
        {clients.length === 0 ? <p className="p-5 text-sm text-muted">No clients yet. Add one below.</p> : (
          <table className="w-full text-left text-sm">
            <tbody>
              {clients.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand/10 font-semibold text-brand">{c.name.charAt(0).toUpperCase()}</span>
                      <div><div className="font-semibold">{c.name}</div><div className="text-muted">{c.websiteUrl}</div></div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-muted">{c.businessType} · {c.city}</td>
                  <td className="px-5 py-3.5"><Link className="font-medium text-brand underline" href={`/client/${c.id}`}>Client view</Link></td>
                  <td className="px-5 py-3.5 text-right"><Button disabled={busy === c.id} onClick={() => runAudit(c.id)}>{busy === c.id ? 'Queuing…' : 'Run audit'}</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="overflow-x-auto">
        <div className="border-b border-line px-5 py-3.5 font-semibold">Recent audits</div>
        {audits.length === 0 ? <p className="p-5 text-sm text-muted">No audits yet. Run one from the client list.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-muted"><tr><th className="px-5 py-2.5 font-medium">Client</th><th className="px-5 py-2.5 font-medium">Status</th><th className="w-64 px-5 py-2.5 font-medium">Progress</th><th className="px-5 py-2.5 font-medium">Score</th><th className="px-5 py-2.5 font-medium">Started</th></tr></thead>
            <tbody>
              {audits.map((a) => (
                <tr key={a.id} className="border-t border-line">
                  <td className="px-5 py-3.5"><Link className="font-semibold text-brand underline" href={`/admin/audits/${a.id}`}>{a.client.name}</Link><div className="text-xs text-muted">{a.triggeredBy}</div></td>
                  <td className="px-5 py-3.5"><Badge tone={a.status}>{a.status}</Badge></td>
                  <td className="px-5 py-3.5"><ProgressBar value={a.progress} /><div className="mt-1 text-xs text-muted">{a.status === 'FAILED' ? a.errorMessage : a.currentStep || 'Waiting for worker'}</div></td>
                  <td className="px-5 py-3.5 text-lg font-semibold tabular-nums">{a.overallScore ?? '–'}</td>
                  <td className="px-5 py-3.5 text-muted">{fmt(a.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Add a client</h2>
        <form onSubmit={addClient} className="grid gap-4 md:grid-cols-3">
          {field('name', 'Business name', { required: true })}
          {field('websiteUrl', 'Website URL', { required: true, placeholder: 'https://' })}
          {field('businessType', 'Business type', { required: true, placeholder: 'Dental clinic' })}
          {field('city', 'City', { required: true })}
          {field('state', 'State', { required: true })}
          {field('whatsapp', 'WhatsApp (optional)', { placeholder: '+91…' })}
          {field('email', 'Email (optional)', { type: 'email' })}
          <div className="flex items-end"><Button type="submit">Add client</Button></div>
        </form>
      </Card>
    </div>
  );
}