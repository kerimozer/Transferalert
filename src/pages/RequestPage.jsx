import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plane, CheckCircle, XCircle, Calendar, Send } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = { flight_number: '', scheduled_pickup: '', passenger_name: '', passenger_phone: '', source: '', notes: '' };

export default function RequestPage() {
  const { token } = useParams();
  const [company, setCompany] = useState(null);
  const [loadErr, setLoadErr] = useState('');
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]     = useState('');
  const [done, setDone]       = useState(false);

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
        body: JSON.stringify(form),
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

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400 text-sm">Yükleniyor...</div>;

  if (loadErr) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-sm text-center">
        <XCircle size={32} className="text-red-400 mx-auto mb-3" />
        <p className="text-gray-700 font-medium">{loadErr}</p>
      </div>
    </div>
  );

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-8 max-w-sm text-center">
        <CheckCircle size={40} className="text-green-500 mx-auto mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 mb-1">Talebiniz alındı</h1>
        <p className="text-sm text-gray-500 mb-6">{company} ekibi talebinizi en kısa sürede onaylayacak.</p>
        <button onClick={() => { setForm(EMPTY); setDone(false); }} className="text-blue-600 text-sm font-medium hover:underline">Yeni talep gönder</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Plane size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">{company}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Transfer Talep Formu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 space-y-4">
          {error && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              <XCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          <Field label="Otel / Acenta Adı">
            <input value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
              placeholder="Otel adınız" className={inputCls} />
          </Field>

          <Field label="Uçuş Numarası" required>
            <input value={form.flight_number}
              onChange={e => setForm(f => ({ ...f, flight_number: e.target.value.toUpperCase().replace(/\s/g, '') }))}
              placeholder="TK123, PC456..." className={`${inputCls} font-mono font-semibold tracking-wider`} required />
          </Field>

          <Field label="Varış Tarihi & Saati" required>
            <input type="datetime-local" value={form.scheduled_pickup}
              onChange={e => setForm(f => ({ ...f, scheduled_pickup: e.target.value }))}
              min={nowLocal()} className={inputCls} required />
          </Field>

          <Field label="Yolcu Adı">
            <input value={form.passenger_name} onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
              placeholder="Ahmet Yılmaz" className={inputCls} />
          </Field>

          <Field label="Yolcu Telefonu">
            <input value={form.passenger_phone} onChange={e => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
              placeholder="+90 5XX XXX XX XX" className={inputCls} />
          </Field>

          <Field label="Not">
            <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Kişi sayısı, oda no, özel istek..." className={inputCls} />
          </Field>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors">
            <Send size={15} /> {submitting ? 'Gönderiliyor...' : 'Transfer Talep Et'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-4">TransferAlert ile güçlendirilmiştir</p>
      </div>
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}
