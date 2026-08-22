// Kalıcı şoför panosu — /sofor/:token
//
// Şoförün TEK arayüzü: hesap yok, şifre yok, uygulama yok. Linki bir kez alır,
// telefonunun ana ekranına ekler; kendisine atanan her yeni iş burada belirir.
//
// /job/:token'dan farkı: o tek işe özeldi ve iş bitince ölüyordu — şoför
// "yarın ne var" diye bakamıyor, dispatcher her transfer için ayrı link
// göndermek zorunda kalıyordu.
//
// Bu sayfayı direksiyon başındaki bir insan, tek eliyle, çoğu zaman gece açar:
// tek sütun, büyük dokunma hedefleri, en yakın iş ZATEN AÇIK, her işte tek
// belirgin eylem butonu.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatPickup } from '../lib/format';
import {
  Plane, MapPin, User, Phone, Clock, Car, StickyNote, Building2,
  XCircle, CheckCircle2, Navigation, ChevronDown, ChevronUp, CalendarClock,
} from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Şoförün basacağı butonun metni — sistem terimleri değil, şoförün dili.
const ACTION_LABEL = {
  en_route:   'Yola Çıktım',
  at_airport: 'Havalimanına Geldim',
  picked_up:  'Yolcuyu Aldım',
  completed:  'Transferi Tamamladım',
};

const STATE_LABEL = {
  en_route:   'Yolda',
  at_airport: 'Havalimanında',
  picked_up:  'Yolcu alındı',
  completed:  'Tamamlandı',
};

const FLIGHT_LABEL = {
  landed:    'Uçak indi',
  active:    'Uçak havada',
  scheduled: 'Uçuş planlandı',
  cancelled: 'Uçuş iptal',
  diverted:  'Uçuş yönlendirildi',
};

// Panoyu kendiliğinden tazele: şoför sayfayı açık bırakır, uçuş durumu ve
// atamalar arkasında değişir. Yenile demeyi beklemek, "uçak indi"yi şoföre
// hiç göstermemek demek. Sekme arkadayken durur (gereksiz istek atmayalım).
const REFRESH_MS = 60000;

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-3 border-b border-surface-border last:border-0">
      <Icon size={17} className="text-ink-muted shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-0.5">{label}</p>
        <div className="text-ink break-words">{children}</div>
      </div>
    </div>
  );
}

function JobCard({ job, open, onToggle, onAdvance, saving, flash }) {
  const done = job.status === 'completed';
  const flight = job.latest_status?.flight_status;
  const next = job.next_statuses || [];

  return (
    <div className={`bg-white border rounded-card shadow-card overflow-hidden ${done ? 'border-surface-border opacity-75' : 'border-surface-border'}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left focus:outline-none focus:ring-2 focus:ring-brand-600/30"
      >
        <div className="min-w-0 flex-1">
          <p className="font-mono font-bold text-2xl text-ink leading-none">{job.flight_number}</p>
          <p className="text-sm text-ink-muted mt-1.5 truncate">
            {formatPickup(job.scheduled_pickup)} · {job.passenger_name}
          </p>
          {flight && <p className="text-xs text-ink-muted mt-0.5">{FLIGHT_LABEL[flight] || flight}</p>}
        </div>
        {job.job_status && (
          <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${done ? 'bg-ok-50 text-ok-800' : 'bg-brand-50 text-brand-700'}`}>
            {done && <CheckCircle2 size={12} />}
            {STATE_LABEL[job.job_status] || job.job_status}
          </span>
        )}
        {open ? <ChevronUp size={18} className="text-ink-muted shrink-0" /> : <ChevronDown size={18} className="text-ink-muted shrink-0" />}
      </button>

      {open && (
        <div className="px-4 pb-4">
          {/* Buluşma noktası en üstte ve vurgulu: şoförün ilk sorusu bu. */}
          {job.meeting_point && (
            <div className="bg-accent-50 border-l-4 border-accent-600 rounded-r-control px-4 py-3 mb-2">
              <p className="text-xs font-semibold text-accent-800 uppercase tracking-wide mb-0.5">Buluşma Noktası</p>
              <p className="text-ink font-semibold">{job.meeting_point}</p>
            </div>
          )}

          {job.dropoff_point && <Row icon={MapPin} label="Varış">{job.dropoff_point}</Row>}
          {job.scheduled_dropoff && <Row icon={Clock} label="Planlanan Varış">{formatPickup(job.scheduled_dropoff)}</Row>}
          <Row icon={User} label="Yolcu">{job.passenger_name}</Row>
          {job.vehicle_plate && <Row icon={Car} label="Araç">{job.vehicle_plate}</Row>}
          {job.notes && <Row icon={StickyNote} label="Not">{job.notes}</Row>}
          {job.pnr && <Row icon={MapPin} label="PNR">{job.pnr}</Row>}

          {/* Telefon yalnız iş penceresindeyken sunucudan gelir — geçmiş
              işlerin telefon listesi şoförün elinde kalıcı bir rehber olmasın. */}
          {job.passenger_phone && (
            <a href={`tel:${job.passenger_phone}`}
               className="mt-3 flex items-center justify-center gap-2 bg-white border border-surface-borderstrong text-ink font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
              <Phone size={17} /> Yolcuyu Ara
            </a>
          )}

          {flash && (
            <div className="mt-3 px-4 py-3 bg-brand-50 border border-brand-600/20 rounded-control text-sm text-brand-700 font-semibold">
              {flash}
            </div>
          )}

          {next.length > 0 ? (
            <div className="flex flex-col gap-2 mt-3">
              {next.map((s, i) => (
                <button
                  key={s}
                  onClick={() => onAdvance(job, s)}
                  disabled={!!saving}
                  className={`w-full rounded-control py-4 font-semibold text-base transition-colors disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-600/30 ${
                    i === 0
                      ? 'bg-brand-600 hover:bg-brand-700 text-white'
                      : 'bg-white border border-surface-borderstrong text-ink-soft hover:bg-surface-alt'
                  }`}
                >
                  {saving === s ? 'Kaydediliyor...' : ACTION_LABEL[s] || s}
                </button>
              ))}
            </div>
          ) : (
            <div className="bg-ok-50 border border-ok-600/20 rounded-control p-4 text-center mt-3">
              <CheckCircle2 size={22} className="text-ok-800 mx-auto mb-1.5" />
              <p className="font-semibold text-ok-800 text-sm">
                {done ? 'Bu transfer tamamlandı.' : 'Bu iş için yapılacak işlem kalmadı.'}
              </p>
            </div>
          )}

          {job.meeting_point && (
            <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.meeting_point)}`}
               target="_blank" rel="noreferrer"
               className="mt-1 flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink font-semibold py-3">
              <Navigation size={15} /> Haritada aç
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function DriverPortalPage() {
  const { token } = useParams();
  const [data, setData]       = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId]   = useState(null);
  const [saving, setSaving]   = useState('');
  const [flash, setFlash]     = useState({ id: null, text: '' });
  // Veri var ama tazelenemedi. Hata DEĞİL: eldeki bilgi gösterilmeye devam eder.
  const [stale, setStale]     = useState('');
  // Şoför bir kartı elle açtıysa tazeleme onu KAPATMAMALI: dakikada bir gelen
  // yenileme, okumakta olduğu işi ekrandan kaydırırdı.
  // useRef (state değil): state olsaydı ilk dokunuşta `load` kimliği değişip
  // gereksiz bir istek atar ve zamanlayıcıyı sıfırlardı.
  const touched = useRef(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/public/driver/${token}`);
      if (!res.ok) {
        // SADECE 404/410 "link ölü" demektir. Sunucu hatası, oran sınırı ya da
        // ağ arızası da "linkiniz iptal edilmiş" diye gösterilirse şoförün
        // açık iş kartı ekrandan SİLİNİR ve gece yarısı ofisi arar. Sayfa
        // dakikada bir tazeleniyor: tek bir 500 bunu tetiklemeye yeter.
        if (res.status === 404 || res.status === 410) {
          setError('Şoför linki bulunamadı veya iptal edilmiş. Firmanızla görüşün.');
        } else {
          setStale('Bilgiler güncellenemedi, tekrar denenecek.');
        }
        return;
      }
      const body = await res.json();
      setData(body);
      setError('');
      setStale('');
      // En yakın AÇIK iş kendiliğinden açılsın: linke tıklayan şoför ekstra bir
      // dokunuş yapmadan "şimdi ne yapacağım"ı görmeli.
      if (!touched.current) {
        const live = (body.jobs || []).find((j) => j.status !== 'completed');
        setOpenId(live?.id || null);
      }
    } catch {
      // Ağ koptu: elimizdeki veri hâlâ elimizdeki en iyi veri. Şoför tünelde
      // sinyal kaybettiğinde buluşma noktası ekrandan kaybolmamalı.
      setStale('Bağlantı kurulamadı, elinizdeki bilgi eski olabilir.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load(); };
    const timer = setInterval(tick, REFRESH_MS);
    // Sekmeye geri dönüldüğünde beklemeden tazele — şoför telefonu cebinden
    // çıkardığında ekranda bir saat önceki dünya durmasın.
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(timer); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  async function advance(job, next) {
    setSaving(next); setFlash({ id: null, text: '' });
    try {
      const res = await fetch(`${API}/api/public/driver/${token}/jobs/${job.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        // Ofis bu arada işi değiştirmiş olabilir — ezmek yerine tazele.
        setFlash({ id: job.id, text: 'İş bu arada değişti, güncel hali yüklendi.' });
        await load();
        return;
      }
      if (!res.ok) {
        setFlash({ id: job.id, text: body.error || 'Kaydedilemedi, tekrar deneyin.' });
        return;
      }
      // DEĞİŞTİR, birleştirme: yanıt TAM bir iş kartıdır. Birleştirmek,
      // sunucunun artık göndermediği alanları (ör. iş tamamlanınca kapanan
      // yolcu telefonu) eski değerleriyle ekranda bırakırdı.
      // (/job/:token sayfasında durum TERSİ: orada yanıt kartın yalnız bir
      // parçasıdır, orada birleştirmek zorunludur.)
      setData((prev) => ({
        ...prev,
        jobs: (prev?.jobs || []).map((j) => (j.id === job.id ? body : j)),
      }));
      setFlash({ id: job.id, text: `"${ACTION_LABEL[next]}" kaydedildi.` });
    } catch {
      setFlash({ id: job.id, text: 'Bağlantı kurulamadı, tekrar deneyin.' });
    } finally {
      setSaving('');
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{error}</p>
      </div>
    </div>
  );

  // İlk yükleme hiç veri getiremediyse "iş yok" DEMEYİZ: şoför işi olduğu
  // hâlde boş ekran görüp yola çıkmayabilir. Ayrımı açıkça söyle.
  if (!data) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-white border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <XCircle size={32} className="text-ink-muted mx-auto mb-3" />
        <p className="text-ink-soft font-semibold mb-4">{stale || 'Bilgiler yüklenemedi.'}</p>
        <button onClick={() => { setLoading(true); load(); }}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control py-3 transition-colors">
          Tekrar dene
        </button>
      </div>
    </div>
  );

  const jobs = data?.jobs || [];

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-md mx-auto p-4 pb-10">

        <div className="flex items-center gap-2 mb-1">
          <div className="bg-brand-600 text-white p-1.5 rounded-control"><Plane size={16} /></div>
          <span className="font-bold text-ink">{data?.company}</span>
        </div>
        <p className="text-sm text-ink-muted mb-4">
          {data?.driver_name ? `${data.driver_name} · ` : ''}İşleriniz
        </p>

        {/* Tazelenemedi ama eldeki veri duruyor: ekranı silmek yerine uyar. */}
        {stale && (
          <div className="mb-3 px-4 py-3 bg-warn-50 border border-warn-600/20 rounded-control text-sm text-warn-800 font-semibold">
            {stale}
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-white border border-surface-border rounded-card shadow-card p-8 text-center">
            <CalendarClock size={30} className="text-ink-muted mx-auto mb-3" />
            <p className="font-semibold text-ink mb-1">Şu an size atanmış iş yok</p>
            <p className="text-sm text-ink-soft">
              Firmanız size bir transfer atadığında burada görünür. Bu sayfayı telefonunuza
              kaydedin — link değişmez.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                open={openId === job.id}
                onToggle={() => { touched.current = true; setOpenId(openId === job.id ? null : job.id); }}
                onAdvance={advance}
                saving={openId === job.id ? saving : ''}
                flash={flash.id === job.id ? flash.text : ''}
              />
            ))}
          </div>
        )}

        {/* Firma telefonu her işte tekrarlanmaz: sayfanın altında bir kez durur.
            Sunucu bu alanı yalnız iş penceresindeyken doldurur. */}
        {data?.company_phone && (
          <a href={`tel:${data.company_phone}`}
             className="mt-4 flex items-center justify-center gap-2 bg-white border border-surface-borderstrong text-ink-soft font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
            <Building2 size={17} /> Firmayı Ara
          </a>
        )}
      </div>
    </div>
  );
}
