import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Save, CheckCircle } from 'lucide-react';

export default function ProfilePage() {
  const { user } = useAuth();
  const [form,    setForm]    = useState({ full_name: '', phone: '', company_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');

  useEffect(() => {
    supabase.from('profiles').select('*').eq('id', user.id).single()
      .then(({ data }) => {
        if (data) setForm({ full_name: data.full_name || '', phone: data.phone || '', company_name: data.company_name || '' });
        setLoading(false);
      });
  }, [user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id:           user.id,
      full_name:    form.full_name.trim(),
      phone:        form.phone.trim(),
      company_name: form.company_name.trim(),
    });
    setSaving(false);
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  if (loading) return <div className="p-8 text-sm text-gray-400">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Profil</h1>
      <p className="text-sm text-gray-400 mb-8">Bildirimler buradaki telefon numarasına gider.</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ad Soyad</label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mehmet Demir"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Firma Adı</label>
            <input
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transfer Co."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-blue-500" />
              Telefon Numarası
              <span className="text-blue-500 font-normal text-xs">(SMS/WhatsApp bildirimleri buraya gelir)</span>
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              type="tel"
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0532 000 00 00"
              required
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <p className="text-sm font-medium text-gray-700 mb-1">E-posta</p>
          <p className="text-sm text-gray-400">{user.email}</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl px-5 py-2.5 text-sm font-medium transition-colors"
        >
          {saved
            ? <><CheckCircle size={15} /> Kaydedildi</>
            : <><Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}</>}
        </button>
      </form>
    </div>
  );
}
