import { FOCUS } from '../lib/focus';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plane, CheckCircle, XCircle, Calendar, Send } from 'lucide-react';
import { localInputToIso } from '../lib/format';
import { FLIGHT } from '../lib/transfer';
import TransferTypeToggle from '../components/TransferTypeToggle';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = { transfer_type: FLIGHT, flight_number: '', scheduled_pickup: '', passenger_name: '', passenger_phone: '', dropoff_point: '', source: '', notes: '' };

export default function RequestPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [company, setCompany] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

  // Otel de uçuşsuz iş ister — şehir içi servis, otelden otele aktarma.
  // Talep formu yalnız uçuş kabul ederken bu işler telefonla geliyordu,
  // yani sistemin dışında kalıyordu.
  const isFlight = form.transfer_type === FLIGHT;

  useEffect(() => {
    fetch(`${API}/api/public/request-info/${token}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(d => setCompany(d.company))
      .catch(() => setLoadErr('Talep linki bulunamadı veya geçersiz.'))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(''); setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/public/request/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // datetime-local ham gönderilirse sunucu kendi dilimiyle yorumlar
        // ve saat kayar (bkz. localInputToIso).
        body: JSON.stringify({
          ...form,
          // Tür değiştirilmeden önce yazılmış uçuş numarası formda kalmış
          // olabilir; uçuşsuz talepte gönderilmemeli.
          flight_number: isFlight ? form.flight_number : null,
          scheduled_pickup: localInputToIso(form.scheduled_pickup),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Talep gönderilemedi');
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>;

  if (loadErr) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-surface border border-surface-border rounded-card shadow-sm p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{loadErr}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-surface border border-surface-border rounded-card shadow-sm p-8 max-w-sm text-center">
        <CheckCircle size={40} className="text-ok-600 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-ink mb-1">Talebiniz alındı</h1>
        <p className="text-sm text-ink-muted mb-6">{company} ekibi talebinizi en kısa sürede onaylayacak.</p>
        <button onClick={() => { setForm(EMPTY); setDone(false); }} className="text-brand-600 text-sm font-semibold hover:underline">Yeni talep gönder</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-surface-bg py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-brand-600 rounded-card flex items-center justify-center mx-auto mb-3">
            <Plane size={26} className="text-onfill" />
          </div>
          <h1 className="text-xl font-bold text-ink">{company}</h1>
          <p className="text-sm text-ink-muted mt-0.5">Transfer Talep Formu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-surface border border-surface-border rounded-card shadow-sm p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
              <XCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <Field label="Otel / Acenta Adı">
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Otel adınız" className={inputCls} />
          </Field>

          <TransferTypeToggle
            value={form.transfer_type}
            onChange={(t) => setForm(f => ({ ...f, transfer_type: t }))}
          />

          {isFlight && (
            <Field label="Uçuş Numarası" required>
              <input value={form.flight_number}
                onChange={e => setForm(f => ({ ...f, flight_number: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                placeholder="TK123, PC456..." className={`${inputCls} font-mono font-semibold tracking-wider`} required />
            </Field>
          )}

          <Field label={isFlight ? 'Varış Tarihi & Saati' : 'Alış Tarihi & Saati'} required>
            <input type="datetime-local" value={form.scheduled_pickup}
              onChange={e => setForm(f => ({ ...f, scheduled_pickup: e.target.value }))}
              min={nowLocal()} className={inputCls} required />
          </Field>

          {/* Uçuşsuz talepte yolcu adı ZORUNLU: kaydın tek etiketi odur ve
              firma "kimi alacağım" sorusunu başka hiçbir alandan yanıtlayamaz. */}
          <Field label="Yolcu Adı" required={!isFlight}>
            <input value={form.passenger_name} onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
              placeholder="Ahmet Yılmaz" className={inputCls} required={!isFlight} />
          </Field>

          <Field label="Yolcu Telefonu">
            <input value={form.passenger_phone} onChange={e => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
              placeholder="+90 5XX XXX XX XX" className={inputCls} />
          </Field>

          {/* Varışı SORAN taraf zaten biliyor (çoğu zaman kendi tesisi).
              Sormanın maliyeti sıfır, sonradan bulmanınki yüksek — üstelik
              şoförün kartında ve ileride U-ETDS bildiriminde gerekiyor. */}
          <Field label="Varış Noktası">
            <input value={form.dropoff_point} onChange={e => setForm(f => ({ ...f, dropoff_point: e.target.value }))}
              placeholder="Otel adı / adres" maxLength={200} className={inputCls} />
          </Field>

          <Field label="Not">
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Kişi sayısı, oda no, özel istek..." className={inputCls} />
          </Field>

          <button type="submit" disabled={submitting}
            className={`w-full flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-onfill rounded-card px-4 py-3 text-sm font-semibold transition-colors ${FOCUS}`}>
            <Send size={15} /> {submitting ? 'Gönderiliyor...' : 'Transfer Talep Et'}
          </button>

          <p className="text-xs text-ink-muted text-center">
            Talebi göndererek yolcu bilgilerinin transfer koordinasyonu amacıyla işlenmesini kabul edersiniz.{' '}
            <button type="button" onClick={() => navigate('/gizlilik')} className="text-brand-600 hover:underline">
              Gizlilik Politikası
            </button>
          </p>
        </form>

        <p className="text-center text-xs text-ink-muted mt-4">TransferAlert ile güçlendirilmiştir</p>
      </div>
    </div>
  );
}

const inputCls = `w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm ${FOCUS}`;

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-soft mb-1">
        {label} {required && <span className="text-bad-600">*</span>}
      </label>
      {children}
    </div>
  );
}
