import { useState } from 'react';
import { X, CreditCard, Copy, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

export default function PaymentLinkModal({ reservation, onClose, onPaid }) {
  const [amount, setAmount]   = useState('');
  const [link, setLink]       = useState('');
  const [copied, setCopied]   = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.createReservationCheckout(reservation.id, Number(amount));
      setLink(res.paymentPageUrl);
      onPaid?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-ink flex items-center gap-2"><CreditCard size={17} /> Ödeme Linki</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        {link ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex gap-2 px-3 py-2.5 bg-ok-50 border border-ok-600/20 rounded-control text-sm text-ok-800">
              <CheckCircle size={15} className="mt-0.5 shrink-0" /> Ödeme linki oluşturuldu. Yolcuya gönderin:
            </div>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 border border-surface-borderstrong rounded-card px-3 py-2.5 text-xs text-ink-muted bg-surface-bg" />
              <button onClick={copyLink} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 bg-surface-alt hover:bg-surface-alt text-ink-soft rounded-control transition-colors">
                {copied ? <><CheckCircle size={12} className="text-ok-600" /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
              </button>
            </div>
            <button onClick={onClose} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1">Tutar (₺) <span className="text-bad-600">*</span></label>
              <input
                type="number" min="1" step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500"
                className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                required autoFocus
              />
              <p className="text-xs text-ink-muted mt-1">Yolcudan alınacak transfer ücretini girin, iyzico ödeme linki oluşturulacak.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
                {loading ? 'Oluşturuluyor...' : 'Link Oluştur'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
