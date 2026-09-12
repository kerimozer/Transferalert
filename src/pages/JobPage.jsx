import { FOCUS } from '../lib/focus';
// Taşeron şoförün girişsiz iş kartı — /job/:token
//
// Bu sayfayı direksiyon başındaki bir insan, tek eliyle, çoğu zaman gece ve
// aceleyle açar. Bu yüzden bilinçli olarak SADE: tek sütun, büyük dokunma
// hedefleri, önce "nerede buluşacağım", sonra tek bir eylem butonu.
// Uygulama kurmayan şoför için tek arayüz burasıdır.
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { formatPickup } from '../lib/format';
import {
  Plane, MapPin, User, Phone, Clock, Car, StickyNote,
  XCircle, CheckCircle2, Navigation, Share2, Building2,
} from 'lucide-react';
import { transferLabel, isFlightTransfer, initials } from '../lib/transfer';
import { jobAction, jobState } from '../lib/status';
import { StatusStrip } from '../components/ui';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Aşama etiketleri ARTIK BURADA DEĞİL: lib/status.js tek kaynak (jobAction /
// jobState). Bu dosyada kendi kopyası vardı ve türe göre varyant eklemek onu
// dördüncü bir kopyaya çevirirdi.
// Uçuş durumu etiketleri de aynı yolu izledi: bu dosyada "Uçak indi" yazan
// ayrı bir harita vardı, Transferlerim'de aynı duruma "İndi" deniyordu.
// Artık `StatusStrip` üzerinden lib/status.js → FLIGHT_BADGE'den geliyor.

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-3.5 border-b border-surface-border last:border-0">
      <Icon size={18} className="text-ink-muted shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink-muted mb-0.5">{label}</p>
        <div className="text-ink break-words">{children}</div>
      </div>
    </div>
  );
}

export default function JobPage() {
  const { token } = useParams();
  const [job, setJob]         = useState(null);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState('');
  const [flash, setFlash]     = useState('');

  async function load() {
    try {
      const res = await fetch(`${API}/api/public/job/${token}`);
      if (res.status === 410) { setError('Bu iş linkinin süresi doldu. Firmanızla görüşün.'); return; }
      if (!res.ok) { setError('İş linki bulunamadı veya iptal edilmiş.'); return; }
      setJob(await res.json());
      setError('');
    } catch {
      setError('Bağlantı kurulamadı. İnternetinizi kontrol edip tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [token]);

  async function advance(next) {
    setSaving(next); setFlash('');
    try {
      const res = await fetch(`${API}/api/public/job/${token}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_status: next }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.status === 409) {
        // Ofis bu arada işi değiştirmiş olabilir — ezmek yerine tazele.
        setFlash('İş bu arada değişti, güncel hali yüklendi.');
        await load();
        return;
      }
      if (!res.ok) { setFlash(body.error || 'Kaydedilemedi, tekrar deneyin.'); return; }
      // BİRLEŞTİR, değiştirme: durum ucu yalnız iş kartını döner — firma adı ve
      // firma telefonu yalnız GET'te gelir. Nesneyi tümüyle değiştirmek, şoför
      // butona bastığı anda "Firmayı Ara"yı ve başlığı ekrandan siliyordu.
      setJob((prev) => ({ ...prev, ...body }));
      setFlash(`"${jobAction(next, job)}" kaydedildi.`);
    } catch {
      setFlash('Bağlantı kurulamadı, tekrar deneyin.');
    } finally {
      setSaving('');
    }
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg text-ink-muted text-sm">Yükleniyor...</div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-surface-bg p-4">
      <div className="bg-surface border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{error}</p>
      </div>
    </div>
  );

  const done = job.status === 'completed';

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-md mx-auto p-4 pb-10">

        <div className="flex items-center gap-2 mb-4">
          <div className="bg-brand-600 text-onfill p-1.5 rounded-control"><Plane size={16} /></div>
          <span className="font-bold text-ink">{job.company}</span>
        </div>

        <div className="bg-surface border border-surface-border rounded-card shadow-card overflow-hidden mb-4">
          {/* DURUM ŞERİDİ — "Kart C" anatomisi, şoför panosu ve Transferlerim
              ile ORTAK bileşen. Bu sayfa tek işe özel olduğu için tarih önemsiz
              görünebilir; değil: taşeron şoför linki bir gün önceden gönderilir
              ve saatin hangi güne ait olduğu ekranda başka hiçbir yerde yazmaz. */}
          <StatusStrip r={job} />

          <div className="p-5">
          <div className="flex items-center gap-3 mb-4">
            {/* Baş harf rozeti — diğer iki kartla aynı kaynak (lib/transfer.js). */}
            <div className="w-10 h-10 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
              <span className="text-sm font-bold text-ink-soft">{initials(job.passenger_name)}</span>
            </div>
            <div className="min-w-0 flex-1">
              {/* Şoförün gördüğü en büyük yazı. `transferLabel` — uçuş no
                  ÖNCE: bu ekran numarayı başka hiçbir yerde basmıyor,
                  cardTitle kullanılsa TK1234 tamamen kaybolurdu. Uçuşsuzda
                  yolcu adına düşer ve uçuş durumu satırı hiç basılmaz.
                  Uçuş DURUMU artık şeritte — burada tekrarlanmaz. */}
              <p className={`font-bold text-2xl text-ink leading-tight truncate ${isFlightTransfer(job) ? 'font-mono' : ''}`}>{transferLabel(job)}</p>
              <p className="text-xs text-ink-muted mt-0.5 truncate">
                {isFlightTransfer(job) ? job.passenger_name : 'Transfer'}
              </p>
            </div>
            {job.job_status && (
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-ok-50 text-ok-800' : 'bg-brand-50 text-brand-700'}`}>
                {done && <CheckCircle2 size={13} aria-hidden="true" />}
                {jobState(job.job_status, job)}
              </span>
            )}
          </div>

          {/* Buluşma noktası en üstte ve vurgulu: şoförün ilk sorusu bu. */}
          {job.meeting_point && (
            <div className="bg-accent-50 border-l-4 border-accent-600 rounded-r-control px-4 py-3 mb-2">
              <p className="text-xs font-semibold text-accent-800 mb-0.5">Buluşma Noktası</p>
              <p className="text-ink font-semibold">{job.meeting_point}</p>
            </div>
          )}

          <Row icon={Clock} label="Alış Saati">{formatPickup(job.scheduled_pickup)}</Row>
          {/* İki alan BİRBİRİNDEN BAĞIMSIZ ve ikisi de opsiyonel: saati
              adresin guard'ı içine yuvalamak, adres boşken saati görünmez
              yapıyordu. "Planlanan" — "tahmini" (ETA) üçüncü bir kavram. */}
          {job.dropoff_point && <Row icon={MapPin} label="Varış">{job.dropoff_point}</Row>}
          {job.scheduled_dropoff && (
            <Row icon={Clock} label="Planlanan Varış">{formatPickup(job.scheduled_dropoff)}</Row>
          )}
          <Row icon={User} label="Yolcu">{job.passenger_name}</Row>
          {job.vehicle_plate && <Row icon={Car} label="Araç">{job.vehicle_plate}</Row>}
          {job.notes && <Row icon={StickyNote} label="Not">{job.notes}</Row>}
          {job.pnr && <Row icon={MapPin} label="PNR">{job.pnr}</Row>}
          </div>
        </div>

        {/* İletişim — sadece iş penceresindeyken sunucudan gelir. */}
        {(job.passenger_phone || job.company_phone) && (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {job.passenger_phone && (
              <a href={`tel:${job.passenger_phone}`}
                 className="flex items-center justify-center gap-2 bg-surface border border-surface-borderstrong text-ink font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
                <Phone size={17} /> Yolcuyu Ara
              </a>
            )}
            {job.company_phone && (
              <a href={`tel:${job.company_phone}`}
                 className="flex items-center justify-center gap-2 bg-surface border border-surface-borderstrong text-ink-soft font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
                <Building2 size={17} /> Firmayı Ara
              </a>
            )}
          </div>
        )}

        {flash && (
          <div className="mb-4 px-4 py-3 bg-brand-50 border border-brand-600/20 rounded-control text-sm text-brand-700 font-semibold">
            {flash}
          </div>
        )}

        {/* TEK BİRİNCİL EYLEM. Önceden kalan TÜM aşamalar tam genişlikte
            buton olarak alt alta basılıyordu: yeni bir işte ekranda dört
            büyük buton birden duruyordu ve şoförün "şimdi ne yapmalıyım"
            sorusu cevapsız kalıyordu — dördü de aynı ağırlıkta görünüyor.
            Şimdi sıradaki aşama TEK büyük buton; ileri atlama hâlâ mümkün
            ama görsel olarak geri planda (küçük çip satırı) ve yalnız
            atlanacak bir aşama varsa görünüyor. */}
        {job.next_statuses?.length > 0 ? (
          <div>
            <button
              onClick={() => advance(job.next_statuses[0])}
              disabled={!!saving}
              className={`w-full rounded-control py-4 font-semibold text-base bg-brand-600 hover:bg-brand-700 text-onfill transition-colors disabled:opacity-60 ${FOCUS}`}
            >
              {saving === job.next_statuses[0] ? 'Kaydediliyor...' : jobAction(job.next_statuses[0], job)}
            </button>

            {job.next_statuses.length > 1 && (
              <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5">
                <span className="text-xs text-ink-muted">Bir aşamayı atla:</span>
                {job.next_statuses.slice(1).map((s) => (
                  <button
                    key={s}
                    onClick={() => advance(s)}
                    disabled={!!saving}
                    className={`min-h-[44px] rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-60 ${FOCUS} ${
                        s === 'completed'
                          /* Nötr ama VURGULU: kalın kenarlık, zemin yok. Yeşil
                             kullanılmıştı ama bu üründe yeşil "tamamlandı"
                             demek — henüz bitmemiş bir işte tamamlanmış
                             görünümlü çip, "ağır sonuç" değil "zaten olmuş"
                             sinyali verir. Bu eylem geri alınamaz. */
                          ? 'border-2 border-ink-soft text-ink hover:bg-surface-alt'
                          : 'border-surface-borderstrong text-ink-soft hover:bg-surface-alt'
                      }`}
                  >
                    {saving === s ? 'Kaydediliyor...' : jobState(s, job)}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-ok-50 border border-ok-600/20 rounded-card p-5 text-center">
            <CheckCircle2 size={26} className="text-ok-800 mx-auto mb-2" />
            <p className="font-semibold text-ok-800">
              {done ? 'Bu transfer tamamlandı.' : 'Bu iş için yapılacak işlem kalmadı.'}
            </p>
          </div>
        )}

        {job.share_token && (
          <a href={`${window.location.origin}/track/${job.share_token}`} target="_blank" rel="noreferrer"
             className="mt-4 flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink font-semibold py-3">
            <Share2 size={15} /> Yolcunun takip sayfasını aç
          </a>
        )}

        {job.meeting_point && (
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.meeting_point)}`}
             target="_blank" rel="noreferrer"
             className="mt-1 flex items-center justify-center gap-2 text-sm text-ink-muted hover:text-ink font-semibold py-3">
            <Navigation size={15} /> Haritada aç
          </a>
        )}
      </div>
    </div>
  );
}
