import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Plane } from 'lucide-react';

export default function LoginPage() {
  const [mode,     setMode]     = useState('login'); // 'login' | 'register'
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [name,     setName]     = useState('');
  const [phone,    setPhone]    = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'login') {
      const { error } = await login(email.trim(), password);
      if (error) setError('E-posta veya şifre hatalı.');
      else navigate('/app');
    } else {
      if (!phone.trim()) { setError('Telefon numarası zorunlu (bildirimler bu numaraya gider).'); setLoading(false); return; }
      const { error } = await register(email.trim(), password, name.trim(), phone.trim());
      if (error) setError(error.message || 'Kayıt başarısız.');
      else navigate('/app');
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg">
      <div className="bg-white border border-surface-border rounded-card shadow-sm p-8 w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-7">
          <div className="bg-brand-600 text-white p-1.5 rounded-control">
            <Plane size={18} />
          </div>
          <span className="text-xl font-bold text-ink">TransferAlert</span>
        </div>

        <h1 className="text-lg font-semibold text-ink mb-1">
          {mode === 'login' ? 'Giriş Yap' : 'Hesap Oluştur'}
        </h1>
        {mode === 'register' && (
          <p className="text-xs text-ink-muted mb-5">
            Bir kez kayıt ol — sonra sadece uçuş numarası gir, gerisini biz halledelim.
          </p>
        )}
        {mode === 'login' && <div className="mb-5" />}

        {error && (
          <div className="mb-4 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1">Ad Soyad</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full border border-surface-borderstrong rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-transparent"
                placeholder="Mehmet Demir"
                required
                autoFocus
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full border border-surface-borderstrong rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-transparent"
              placeholder="firma@ornek.com"
              required
              autoFocus={mode === 'login'}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-surface-borderstrong rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-transparent"
              required
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-semibold text-ink-soft mb-1">
                Telefon Numarası
                <span className="text-brand-600 font-normal ml-1">(SMS/WhatsApp bildirimleri buraya gelir)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full border border-surface-borderstrong rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30 focus:border-transparent"
                placeholder="0532 000 00 00"
                required
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-control px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            {loading
              ? (mode === 'login' ? 'Giriş yapılıyor...' : 'Kaydediliyor...')
              : (mode === 'login' ? 'Giriş Yap' : 'Kaydol')}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-ink-muted">
          {mode === 'login' ? (
            <>Hesabın yok mu?{' '}
              <button onClick={() => { setMode('register'); setError(''); }} className="text-brand-600 hover:underline font-semibold">
                Kayıt ol
              </button>
            </>
          ) : (
            <>Zaten hesabın var mı?{' '}
              <button onClick={() => { setMode('login'); setError(''); }} className="text-brand-600 hover:underline font-semibold">
                Giriş yap
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
