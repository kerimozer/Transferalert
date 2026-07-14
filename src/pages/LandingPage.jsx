import { useNavigate } from 'react-router-dom';
import { Plane, Bell, MessageCircle, CheckCircle, Zap, Users, Shield } from 'lucide-react';

const FEATURES = [
  { icon: Plane,          title: 'Gerçek Zamanlı Uçuş Takibi',  desc: 'AviationStack ile uçuş durumunu 5 dakikada bir kontrol eder. İniş, rötar, iptal — anında bilirsiniz.' },
  { icon: MessageCircle,  title: 'WhatsApp + SMS Bildirimi',      desc: 'Uçuş durumu değişince telefonunuza otomatik WhatsApp veya SMS gönderilir. Hiçbir şeyi kaçırmayın.' },
  { icon: Zap,            title: 'Tek Tıkla Takip',              desc: 'Sadece uçuş numarası girin. Sistem geri kalanı halleder. Karmaşık form yok, gereksiz adım yok.' },
];

const PLANS = [
  {
    name:  'Ücretsiz',
    price: '0 ₺',
    period: '/ay',
    desc:  '7 günlük deneme',
    features: ['5 uçuş takibi/ay', 'SMS bildirimi', 'E-posta desteği'],
    cta:   'Hemen Başla',
    highlight: false,
  },
  {
    name:  'Standart',
    price: '299 ₺',
    period: '/ay',
    desc:  'Bireysel sürücüler için',
    features: ['100 uçuş takibi/ay', 'SMS + WhatsApp bildirimi', 'Günlük özet', 'Öncelikli destek'],
    cta:   'Başla',
    highlight: true,
  },
  {
    name:  'İşletme',
    price: '899 ₺',
    period: '/ay',
    desc:  'Transfer firmaları için',
    features: ['Sınırsız uçuş takibi', 'SMS + WhatsApp bildirimi', 'Takım hesapları (5 kullanıcı)', 'Günlük özet', '7/24 destek'],
    cta:   'Başla',
    highlight: false,
  },
];

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans">
      {/* Navbar */}
      <nav className="border-b border-surface-border px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-1.5 rounded-control">
            <Plane size={18} />
          </div>
          <span className="text-xl font-bold text-ink">TransferAlert</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/app/login')} className="text-sm text-ink-soft hover:text-ink">Giriş Yap</button>
          <button onClick={() => navigate('/app/login')} className="bg-brand-600 hover:bg-brand-700 text-white rounded-control px-4 py-2 text-sm font-semibold transition-colors">
            Ücretsiz Dene
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          <Bell size={12} /> Uçuş iner, siz anında bilirsiniz
        </div>
        <h1 className="text-5xl font-bold text-ink leading-tight mb-5">
          Transfer firmanız için<br />
          <span className="text-brand-600">otomatik uçuş takibi</span>
        </h1>
        <p className="text-xl text-ink-muted mb-8 max-w-2xl mx-auto">
          Uçuş numarasını girin, gerisini biz halledelim. Uçuş indiğinde, rötar yaptığında veya iptal edildiğinde telefonunuza anında bildirim gelir.
        </p>
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate('/app/login')}
            className="bg-brand-600 hover:bg-brand-700 text-white rounded-card px-6 py-3 text-base font-semibold transition-colors shadow-sm"
          >
            Ücretsiz Başla
          </button>
          <button
            onClick={() => document.getElementById('fiyatlar').scrollIntoView({ behavior: 'smooth' })}
            className="text-ink-soft hover:text-ink px-6 py-3 text-base font-semibold"
          >
            Fiyatları Gör →
          </button>
        </div>
      </section>

      {/* Özellikler */}
      <section className="bg-surface-bg py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-ink text-center mb-10">Nasıl Çalışır?</h2>
          <div className="grid grid-cols-3 gap-6">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-card p-6 border border-surface-border">
                <div className="w-10 h-10 bg-brand-50 rounded-card flex items-center justify-center mb-4">
                  <Icon size={20} className="text-brand-600" />
                </div>
                <h3 className="font-semibold text-ink mb-2">{title}</h3>
                <p className="text-sm text-ink-muted leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kullanım adımları */}
      <section className="py-16 max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-2xl font-bold text-ink mb-10">3 Adımda Başlayın</h2>
        <div className="grid grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Kayıt Ol', desc: 'Adınızı ve telefon numaranızı girin. Bir kez.' },
            { step: '2', title: 'Uçuş Ekle', desc: 'Sadece uçuş numarasını yazın. TK123 gibi.' },
            { step: '3', title: 'Bildirimi Al', desc: 'Uçuş indiğinde telefonunuza mesaj gelir.' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex flex-col items-center">
              <div className="w-12 h-12 bg-brand-600 text-white rounded-card flex items-center justify-center text-xl font-bold mb-3">{step}</div>
              <h3 className="font-semibold text-ink mb-1">{title}</h3>
              <p className="text-sm text-ink-muted">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Fiyatlandırma */}
      <section id="fiyatlar" className="bg-surface-bg py-16">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-ink text-center mb-2">Fiyatlandırma</h2>
          <p className="text-ink-muted text-center mb-10">Kredi kartı gerekmez. İstediğiniz zaman iptal.</p>
          <div className="grid grid-cols-3 gap-6">
            {PLANS.map(plan => (
              <div
                key={plan.name}
                className={`rounded-card p-6 border ${plan.highlight ? 'bg-brand-600 border-brand-600 text-white' : 'bg-white border-surface-border'}`}
              >
                <div className="mb-4">
                  <p className={`text-sm font-semibold mb-1 ${plan.highlight ? 'text-white/80' : 'text-ink-muted'}`}>{plan.name}</p>
                  <div className="flex items-end gap-1">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className={`text-sm mb-1 ${plan.highlight ? 'text-white/80' : 'text-ink-muted'}`}>{plan.period}</span>
                  </div>
                  <p className={`text-xs mt-1 ${plan.highlight ? 'text-white/80' : 'text-ink-muted'}`}>{plan.desc}</p>
                </div>

                <ul className="space-y-2.5 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <CheckCircle size={14} className={plan.highlight ? 'text-white/80' : 'text-brand-600'} />
                      <span className={plan.highlight ? 'text-white/90' : 'text-ink-soft'}>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => navigate('/app/login')}
                  className={`w-full rounded-card py-2.5 text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-white text-brand-600 hover:bg-brand-50'
                      : 'bg-brand-600 text-white hover:bg-brand-700'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-border py-8 text-center text-sm text-ink-muted">
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="bg-brand-600 text-white p-1 rounded-md">
            <Plane size={14} />
          </div>
          <span className="font-semibold text-ink-soft">TransferAlert</span>
        </div>
        <p>© 2026 TransferAlert. Tüm hakları saklıdır.</p>
      </footer>
    </div>
  );
}
