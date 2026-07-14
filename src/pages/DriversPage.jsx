import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { UserPlus, Trash2, User, Phone, Copy, CheckCircle, X, AlertCircle } from 'lucide-react';

export default function DriversPage() {
  const [drivers,  setDrivers]  = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form,     setForm]     = useState({ name: '', phone: '' });
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [copied,   setCopied]   = useState(null);

  const load = () => api.listDrivers().then(d => { setDrivers(d || []); setLoading(false); });
  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.addDriver(form);
      setForm({ name: '', phone: '' });
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bu sürücüyü silmek istiyor musunuz?')) return;
    await api.deleteDriver(id);
    load();
  }

  function copyInvite(driver) {
    const link = `${window.location.origin}/app/login?invite=${driver.invite_code}`;
    navigator.clipboard.writeText(link);
    setCopied(driver.id);
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Sürücüler</h1>
          <p className="text-sm text-ink-muted mt-0.5">Sürücülerinizi ekleyin, davet linki gönderin. Her sürücü kendi uçuşlarını görür.</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setError(''); }}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-card px-4 py-2.5 text-sm font-semibold transition-colors"
        >
          <UserPlus size={16} /> Sürücü Ekle
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Yeni Sürücü</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
            </div>
            {error && (
              <div className="mx-6 mt-4 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}
            <form onSubmit={handleAdd} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Ad Soyad <span className="text-bad-600">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Mehmet Demir"
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  required autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Telefon <span className="text-bad-600">*</span></label>
                <input
                  value={form.phone}
                  onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0532 000 00 00"
                  type="tel"
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  required
                />
              </div>
              <p className="text-xs text-ink-muted">Sürücüye davet linki oluşturulacak. Linki WhatsApp ile gönderebilirsiniz.</p>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
                <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
                  {saving ? 'Ekleniyor...' : 'Ekle & Davet Linki Oluştur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sürücü Listesi */}
      {drivers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-card flex items-center justify-center mb-4">
            <User size={28} className="text-brand-600" />
          </div>
          <p className="text-ink-soft font-semibold mb-1">Henüz sürücü yok</p>
          <p className="text-sm text-ink-muted mb-5">Sürücü ekleyip davet linki gönderin.</p>
          <button onClick={() => setShowForm(true)} className="bg-brand-600 text-white rounded-card px-5 py-2.5 text-sm font-semibold hover:bg-brand-700">İlk Sürücüyü Ekle</button>
        </div>
      ) : (
        <div className="space-y-3">
          {drivers.map(d => (
            <div key={d.id} className="bg-white border border-surface-border rounded-card p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-brand-50 rounded-card flex items-center justify-center shrink-0">
                <User size={18} className="text-brand-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-ink">{d.name}</p>
                <p className="text-sm text-ink-muted flex items-center gap-1">
                  <Phone size={11} /> {d.phone}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => copyInvite(d)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-surface-alt hover:bg-surface-alt text-ink-soft rounded-control transition-colors"
                >
                  {copied === d.id ? <><CheckCircle size={12} className="text-ok-600" /> Kopyalandı</> : <><Copy size={12} /> Davet Linki</>}
                </button>
                <button onClick={() => handleDelete(d.id)} className="p-1.5 text-ink-muted hover:text-bad-600 hover:bg-bad-50 rounded-control transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
