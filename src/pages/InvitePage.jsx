// Ekip daveti — /davet/:token
//
// NEDEN VAR: davet linki eskiden `transferalert://join/<token>` idi. O şema
// app.json'da hiç tanımlı değildi VE WhatsApp custom scheme'leri tıklanabilir
// yapmıyor. Yani davet edilen kişi linke dokunamıyordu bile; dokunsa da hiçbir
// şey açılmıyordu. Sonuç: kimse bir firmaya KATILAMIYORDU — şoför hesapları,
// atama, şoför uygulaması, hepsi ulaşılamaz durumdaydı.
//
// Çözüm https bir sayfa: her mesajlaşma uygulamasında tıklanır, uygulama kurulu
// olmasa da açılır, katılma işlemini burada bitirir.
import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Plane, Shield, Headset, Truck, CheckCircle, XCircle, AlertCircle, Smartphone } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const ROLE = {
  admin:      { label: 'Yönetici',  icon: Shield,  desc: 'Firma ayarlarını ve ekibi yönetirsiniz.' },
  dispatcher: { label: 'Operasyon', icon: Headset, desc: 'Transferleri planlar, şoförlere atarsınız.' },
  driver:     { label: 'Şoför',     icon: Truck,   desc: 'Size atanan transferleri uygulamadan görürsünüz.' },
};

export default function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [invite, setInvite]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const [joining, setJoining] = useState(false);
  const [joined, setJoined]   = useState(false);
  const autoTried = useRef(false);

  useEffect(() => {
    fetch(`${API}/api/public/invite/${token}`)
      .then(async (res) => {
        if (res.status === 410) throw new Error('Bu davet zaten kullanılmış.');
        if (!res.ok) throw new Error('Davet bulunamadı veya süresi dolmuş.');
        return res.json();
      })
      .then(setInvite)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept() {
    setJoining(true);
    setError('');
    try {
      await api.joinOrg(token);
      setJoined(true);
    } catch (e) {
      setError(e.message || 'Katılma işlemi tamamlanamadı.');
    } finally {
      setJoining(false);
    }
  }

  // Girişli kullanıcı için ek bir "kabul et" tıklaması istemiyoruz: linke
  // tıklamak zaten niyet beyanıdır. Yetkisiz katılmayı engelleyen şey buton
  // değil, sunucudaki telefon eşleşme kapısı — o yerinde duruyor.
  // autoTried: React iki kez render ederse çift POST atılmasın.
  useEffect(() => {
    if (!user || !invite || joined || autoTried.current) return;
    autoTried.current = true;
    accept();
  }, [user, invite, joined]);

  // Katılma bitince firma yüzündeki kullanıcı panele kendiliğinden geçsin.
  // Şoför için hedef panel DEĞİL mobil uygulama — onu yönlendirmiyoruz.
  useEffect(() => {
    if (!joined || invite?.role === 'driver') return;
    const timer = setTimeout(() => navigate('/app'), 1800);
    return () => clearTimeout(timer);
  }, [joined, invite, navigate]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>
  );

  const Shell = ({ children }) => (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-card p-7 max-w-sm w-full">
        <div className="flex items-center gap-2 mb-6">
          <div className="bg-brand-600 text-white p-1.5 rounded-control"><Plane size={16} /></div>
          <span className="font-bold text-ink">TransferAlert</span>
        </div>
        {children}
      </div>
    </div>
  );

  if (!invite) return (
    <Shell>
      <XCircle size={30} className="text-bad-600 mb-3" />
      <p className="font-semibold text-ink mb-1">Davet açılamadı</p>
      <p className="text-sm text-ink-soft">{error}</p>
    </Shell>
  );

  if (joined) {
    const isDriver = invite.role === 'driver';
    return (
      <Shell>
        <CheckCircle size={30} className="text-ok-600 mb-3" />
        <p className="font-semibold text-ink mb-1">{invite.company} ekibine katıldınız</p>
        <p className="text-sm text-ink-soft mb-5">
          {isDriver
            ? 'Size atanan transferleri TransferAlert uygulamasından göreceksiniz. Uygulamayı açıp bu hesapla giriş yapın.'
            : 'Artık firmanın panelini kullanabilirsiniz.'}
        </p>
        {isDriver ? (
          <>
            {/* Hesap açan şoför de panosuna dönebilmeli: pano linki hesap
                açmakla ölmez. Yalnız "uygulamayı indirin" demek, tam da bu
                akışın kurtarmaya çalıştığı zincire geri sokuyordu. */}
            {invite.driver_link && (
              <a href={invite.driver_link}
                 className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control py-3.5 transition-colors mb-3">
                İşlerimi Göster
              </a>
            )}
            <div className="flex items-start gap-2.5 px-3.5 py-3 bg-brand-50 rounded-control text-sm text-brand-700">
              <Smartphone size={16} className="mt-0.5 shrink-0" />
              <span>Anlık bildirim almak isterseniz TransferAlert uygulamasına bu hesapla girebilirsiniz.</span>
            </div>
          </>
        ) : (
          <button onClick={() => navigate('/app')} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control py-3 transition-colors">
            Panele git
          </button>
        )}
      </Shell>
    );
  }

  // ŞOFÖR HESAP EKRANI GÖRMEZ. Daha önce buradan kayıt → uygulama indir →
  // tekrar giriş zinciri başlıyordu; çoğu şoför ilk adımda düşüyordu. Artık
  // linke tıklayan şoför doğrudan işlerine gider, hesap açmak isteğe bağlı
  // bir yükseltme olarak sayfanın altında durur.
  if (invite.role === 'driver' && invite.driver_link && !user) {
    return (
      <Shell>
        <p className="text-sm text-ink-muted mb-1">{invite.company}</p>
        <h1 className="text-xl font-bold text-ink mb-1">İşleriniz hazır</h1>
        <p className="text-sm text-ink-soft mb-5">
          Hesap açmanıza gerek yok. Aşağıdaki butona basın, size atanan transferleri
          görün ve durumu oradan ilerletin.
        </p>
        <a
          href={invite.driver_link}
          className="block w-full text-center bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control py-3.5 transition-colors mb-3"
        >
          İşlerimi Göster
        </a>
        <p className="text-xs text-ink-muted text-center mb-5">
          Açılan sayfayı telefonunuza kaydedin — link değişmez, yeni işleriniz orada belirir.
        </p>
        <div className="border-t border-surface-border pt-4">
          <p className="text-xs text-ink-muted mb-2">
            Uçuş bildirimlerini telefonunuza anlık almak isterseniz hesap da açabilirsiniz.
          </p>
          <button
            onClick={() => navigate(`/app/login?mode=register&next=${encodeURIComponent(`/davet/${token}`)}`)}
            className="w-full bg-white border border-surface-borderstrong text-ink-soft font-semibold rounded-control py-2.5 text-sm hover:bg-surface-alt transition-colors"
          >
            Hesap oluştur
          </button>
        </div>
      </Shell>
    );
  }

  const r = ROLE[invite.role] || ROLE.driver;
  const RoleIcon = r.icon;

  return (
    <Shell>
      <p className="text-sm text-ink-muted mb-1">Ekip daveti</p>
      <h1 className="text-xl font-bold text-ink mb-5">{invite.company}</h1>

      <div className="flex items-start gap-3 p-3.5 bg-surface-bg rounded-control mb-5">
        <div className="w-9 h-9 rounded-control bg-white border border-surface-border flex items-center justify-center shrink-0">
          <RoleIcon size={16} className="text-brand-600" />
        </div>
        <div>
          <p className="font-semibold text-ink text-sm">{r.label} olarak davet edildiniz</p>
          <p className="text-xs text-ink-muted mt-0.5">{r.desc}</p>
        </div>
      </div>

      {/* Katılma, davet edilen telefon numarasıyla eşleşme şartına bağlı.
          Bunu ÖNCEDEN söylemezsek kişi başka numarayla kayıt olur ve
          anlamadığı bir "başka bir telefona gönderilmiş" hatası yer. */}
      {invite.phone_hint && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-warn-50 border border-warn-600/20 rounded-control text-sm text-warn-800 mb-5">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />
          <span>Bu davet <strong>{invite.phone_hint}</strong> numarası için. Kayıt olurken aynı numarayı girin.</span>
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2.5 px-3.5 py-3 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800 mb-4">
          <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      {user ? (
        // Otomatik katılıyoruz; hata çıkarsa yukarıdaki kutuda görünür ve
        // kullanıcı tekrar deneyebilsin diye buton yeniden belirir.
        error ? (
          <button
            onClick={accept}
            disabled={joining}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-control py-3 transition-colors"
          >
            {joining ? 'Katılınıyor...' : 'Tekrar dene'}
          </button>
        ) : (
          <p className="text-sm text-ink-muted text-center py-3">Ekibe ekleniyorsunuz...</p>
        )
      ) : (
        <>
          {/* mode=register: davetten gelen kişinin hesabı GENELDE YOKTUR
              (yeni şoför). Giriş modunda açmak, kayıt bağlantısını aramaya
              zorluyordu — akışın en çok takılan yeri burasıydı. */}
          <button
            onClick={() => navigate(`/app/login?mode=register&next=${encodeURIComponent(`/davet/${token}`)}`)}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control py-3 transition-colors mb-2"
          >
            Devam et
          </button>
          <p className="text-xs text-ink-muted text-center">
            Hesabınızı oluşturun; ekibe otomatik eklenirsiniz.
          </p>
        </>
      )}
    </Shell>
  );
}
