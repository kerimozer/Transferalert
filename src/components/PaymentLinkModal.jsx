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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2"><CreditCard size={17} /> Ödeme Linki</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>

        {error && (
          <div className="mx-6 mt-4 flex gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        {link ? (
          <div className="px-6 py-5 space-y-4">
            <div className="flex gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              <CheckCircle size={15} className="mt-0.5 shrink-0" /> Ödeme linki oluşturuldu. Yolcuya gönderin:
            </div>
            <div className="flex items-center gap-2">
              <input readOnly value={link} className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-xs text-gray-500 bg-gray-50" />
              <button onClick={copyLink} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg transition-colors">
                {copied ? <><CheckCircle size={12} className="text-green-500" /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
              </button>
            </div>
            <button onClick={onClose} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-sm font-medium">
              Tamam
            </button>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺) <span className="text-red-500">*</span></label>
              <input
                type="number" min="1" step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="500"
                className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required autoFocus
              />
              <p className="text-xs text-gray-400 mt-1">Yolcudan alınacak transfer ücretini girin, iyzico ödeme linki oluşturulacak.</p>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">İptal</button>
              <button type="submit" disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-4 py-2.5 text-sm font-medium">
                {loading ? 'Oluşturuluyor...' : 'Link Oluştur'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
