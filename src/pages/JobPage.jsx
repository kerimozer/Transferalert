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

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Şoförün basacağı butonun metni — sistem terimleri değil, şoförün dili.
const ACTION_LABEL = {
  en_route:   'Yola Çıktım',
  at_airport: 'Havalimanına Geldim',
  picked_up:  'Yolcuyu Aldım',
  completed:  'Transferi Tamamladım',
};

// Mevcut aşamanın rozet metni.
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

function Row({ icon: Icon, label, children }) {
  return (
    <div className="flex gap-3 py-3.5 border-b border-surface-border last:border-0">
      <Icon size={18} className="text-ink-muted shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-0.5">{label}</p>
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
      setJob(body);
      setFlash(`"${ACTION_LABEL[next]}" kaydedildi.`);
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
      <div className="bg-white border border-surface-border rounded-card shadow-card p-8 max-w-sm text-center">
        <XCircle size={32} className="text-bad-600 mx-auto mb-3" />
        <p className="text-ink-soft font-semibold">{error}</p>
      </div>
    </div>
  );

  const done = job.status === 'completed';
  const flight = job.latest_status?.flight_status;

  return (
    <div className="min-h-screen bg-surface-bg">
      <div className="max-w-md mx-auto p-4 pb-10">

        <div className="flex items-center gap-2 mb-4">
          <div className="bg-brand-600 text-white p-1.5 rounded-control"><Plane size={16} /></div>
          <span className="font-bold text-ink">{job.company}</span>
        </div>

        <div className="bg-white border border-surface-border rounded-card shadow-card p-5 mb-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <p className="font-mono font-bold text-3xl text-ink leading-none">{job.flight_number}</p>
              {flight && <p className="text-sm text-ink-muted mt-1.5">{FLIGHT_LABEL[flight] || flight}</p>}
            </div>
            {job.job_status && (
              <span className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${done ? 'bg-ok-50 text-ok-800' : 'bg-brand-50 text-brand-700'}`}>
                {done && <CheckCircle2 size={13} />}
                {STATE_LABEL[job.job_status] || job.job_status}
              </span>
            )}
          </div>

          {/* Buluşma noktası en üstte ve vurgulu: şoförün ilk sorusu bu. */}
          {job.meeting_point && (
            <div className="bg-accent-50 border-l-4 border-accent-600 rounded-r-control px-4 py-3 mb-2">
              <p className="text-xs font-semibold text-accent-800 uppercase tracking-wide mb-0.5">Buluşma Noktası</p>
              <p className="text-ink font-semibold">{job.meeting_point}</p>
            </div>
          )}

          <Row icon={Clock} label="Alış Saati">{formatPickup(job.scheduled_pickup)}</Row>
          <Row icon={User} label="Yolcu">{job.passenger_name}</Row>
          {job.vehicle_plate && <Row icon={Car} label="Araç">{job.vehicle_plate}</Row>}
          {job.notes && <Row icon={StickyNote} label="Not">{job.notes}</Row>}
          {job.pnr && <Row icon={MapPin} label="PNR">{job.pnr}</Row>}
        </div>

        {/* İletişim — sadece iş penceresindeyken sunucudan gelir. */}
        {(job.passenger_phone || job.company_phone) && (
          <div className="grid grid-cols-1 gap-2 mb-4">
            {job.passenger_phone && (
              <a href={`tel:${job.passenger_phone}`}
                 className="flex items-center justify-center gap-2 bg-white border border-surface-borderstrong text-ink font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
                <Phone size={17} /> Yolcuyu Ara
              </a>
            )}
            {job.company_phone && (
              <a href={`tel:${job.company_phone}`}
                 className="flex items-center justify-center gap-2 bg-white border border-surface-borderstrong text-ink-soft font-semibold rounded-control py-3.5 hover:bg-surface-alt transition-colors">
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

        {/* Tek eylem sütunu. Sıradaki aşama en üstte ve dolu renkte; ileri
            atlamak serbest ama geri dönüş yok (sunucu da reddeder). */}
        {job.next_statuses?.length > 0 ? (
          <div className="flex flex-col gap-2">
            {job.next_statuses.map((s, i) => (
              <button
                key={s}
                onClick={() => advance(s)}
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
