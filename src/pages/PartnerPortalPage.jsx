import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plane, CheckCircle, XCircle, Send, Clock, RefreshCw, ExternalLink } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = { flight_number: '', scheduled_pickup: '', passenger_name: '', passenger_phone: '', notes: '' };

// Talep durumu → otelin anlayacağı dil. Firma içi terimler ("active") otele
// bir şey ifade etmiyor; burada işin nerede olduğunu anlatan karşılıklar var.
const STATUS_VIEW = {
  pending:   { label: 'Onay bekliyor', cls: 'bg-warn-50 text-warn-800 border-warn-600/20' },
  active:    { label: 'Onaylandı',     cls: 'bg-brand-50 text-brand-700 border-brand-600/20' },
  completed: { label: 'Tamamlandı',    cls: 'bg-ok-50 text-ok-800 border-ok-600/20' },
  cancelled: { label: 'İptal',         cls: 'bg-bad-50 text-bad-800 border-bad-600/20' },
};

const JOB_VIEW = {
  en_route:   'Şoför yolda',
  at_airport: 'Şoför havalimanında',
  picked_up:  'Yolcu alındı',
  completed:  'Tamamlandı',
};

export default function PartnerPortalPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [info, setInfo]       = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [sent, setSent]       = useState(false);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/public/partner/${token}/requests`);
      if (res.ok) setRequests(await res.json());
    } catch { /* liste yüklenemezse form yine çalışır */ }
  }, [token]);

  useEffect(() => {
    fetch(`${API}/api/public/partner/${token}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(setInfo)
      .catch(() => setLoadErr('Portal linki bulunamadı veya devre dışı bırakılmış.'))
      .finally(() => setLoading(false));
    loadRequests();
  }, [token, loadRequests]);

  async function handleRefresh() {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/public/partner/${token}/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Talep gönderilemedi');
      setForm(EMPTY);
      setSent(true);
      setTimeout(() => setSent(false), 4000);
      loadRequests();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>;

  if (loadErr) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-sm p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{loadErr}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bg py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 bg-brand-600 rounded-card flex items-center justify-center shrink-0">
            <Plane size={20} className="text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-ink truncate">{info.company}</h1>
            <p className="text-sm text-ink-muted truncate">{info.partner} · Transfer Portalı</p>
          </div>
        </header>

        <div className="grid md:grid-cols-2 gap-5">
          {/* Talep formu */}
          <section className="bg-white border border-surface-border rounded-card shadow-sm p-5">
            <h2 className="font-semibold text-ink mb-4">Yeni transfer talebi</h2>

            {sent && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-ok-50 border border-ok-600/20 rounded-control text-sm text-ok-800">
                <CheckCircle size={15} className="mt-0.5 shrink-0" />
                Talebiniz alındı, onay bekliyor.
              </div>
            )}
            {error && (
              <div className="flex items-start gap-2 px-3 py-2.5 mb-4 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                <XCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              <Field label="Uçuş Numarası" required>
                <input value={form.flight_number}
                  onChange={(e) => setForm((f) => ({ ...f, flight_number: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  placeholder="TK123" className={`${inputCls} font-mono font-semibold tracking-wider`} required />
              </Field>
              <Field label="Varış Tarihi & Saati" required>
                <input type="datetime-local" value={form.scheduled_pickup}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_pickup: e.target.value }))}
                  min={nowLocal()} className={inputCls} required />
              </Field>
              <Field label="Yolcu Adı">
                <input value={form.passenger_name} onChange={(e) => setForm((f) => ({ ...f, passenger_name: e.target.value }))}
                  placeholder="Ahmet Yılmaz" className={inputCls} />
              </Field>
              <Field label="Yolcu Telefonu">
                <input value={form.passenger_phone} onChange={(e) => setForm((f) => ({ ...f, passenger_phone: e.target.value }))}
                  placeholder="+90 5XX XXX XX XX" className={inputCls} />
              </Field>
              <Field label="Not">
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Kişi sayısı, oda no, özel istek..." className={inputCls} />
              </Field>

              <button type="submit" disabled={submitting}
                className="w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-3 text-sm font-semibold transition-colors">
                <Send size={15} /> {submitting ? 'Gönderiliyor...' : 'Transfer Talep Et'}
              </button>

              <p className="text-xs text-ink-muted text-center pt-1">
                Talebi göndererek yolcu bilgilerinin transfer koordinasyonu amacıyla işlenmesini kabul edersiniz.{' '}
                <button type="button" onClick={() => navigate('/gizlilik')} className="text-brand-600 hover:underline">
                  Gizlilik Politikası
                </button>
              </p>
            </form>
          </section>

          {/* Talep geçmişi */}
          <section className="bg-white border border-surface-border rounded-card shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-ink">Talepleriniz</h2>
              <button onClick={handleRefresh} disabled={refreshing}
                className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink transition-colors disabled:opacity-50">
                <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} /> Yenile
              </button>
            </div>

            {requests.length === 0 ? (
              <div className="text-center py-10">
                <Clock size={36} className="text-ink-muted mx-auto mb-3" />
                <p className="text-sm text-ink-muted">Henüz talebiniz yok.<br />Gönderdiğiniz talepler burada listelenir.</p>
              </div>
            ) : (
              <ul className="space-y-2.5 max-h-[28rem] overflow-y-auto">
                {requests.map((r) => {
                  const sv = STATUS_VIEW[r.status] || STATUS_VIEW.pending;
                  const when = new Date(r.scheduled_pickup);
                  return (
                    <li key={r.id} className="border border-surface-border rounded-control p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-mono font-semibold text-sm text-ink">{r.flight_number}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${sv.cls}`}>{sv.label}</span>
                      </div>
                      <p className="text-xs text-ink-muted">
                        {when.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}{' '}
                        {when.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                        {r.passenger_name && r.passenger_name !== r.flight_number ? ` · ${r.passenger_name}` : ''}
                      </p>
                      {(r.driver_name || r.job_status) && (
                        <p className="text-xs text-ink-soft mt-1">
                          {r.job_status ? JOB_VIEW[r.job_status] : ''}
                          {r.driver_name ? `${r.job_status ? ' · ' : ''}${r.driver_name}` : ''}
                          {r.vehicle_plate ? ` (${r.vehicle_plate})` : ''}
                        </p>
                      )}
                      {r.share_token && (
                        <a href={`/track/${r.share_token}`} target="_blank" rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline mt-1.5">
                          <ExternalLink size={11} /> Canlı takip
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        <p className="text-center text-xs text-ink-muted mt-6">TransferAlert ile güçlendirilmiştir</p>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-surface-borderstrong rounded-card px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-ink-soft mb-1">
        {label} {required && <span className="text-bad-600">*</span>}
      </label>
      {children}
    </div>
  );
}
