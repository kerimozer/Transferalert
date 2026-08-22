import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../lib/api';
import { RES_STATUS_BADGE, JOB_BADGE } from '../lib/status';
import { formatPickup, localInputToIso } from '../lib/format';
import { Button } from '../components/ui';
import { Plus, Trash2, Plane, X, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle, CheckSquare, Calendar, Bell, Share2, UserCheck, CreditCard, FileSpreadsheet, Link2, Check, Inbox, Car } from 'lucide-react';
import WelcomeSignModal from '../components/WelcomeSignModal';
import PaymentLinkModal from '../components/PaymentLinkModal';
import AssignDriverModal from '../components/AssignDriverModal';

// xlsx ağır — sadece modal açılınca yüklensin (ana bundle'ı şişirmesin)
const BulkImportModal = lazy(() => import('../components/BulkImportModal'));

// Bugünün datetime-local değeri (min için)
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = { flight_number: '', pnr: '', passenger_name: '', passenger_phone: '', meeting_point: '', scheduled_pickup: '', dropoff_point: '', scheduled_dropoff: '', notes: '' };

const FLIGHT_STATUS = {
  landed:    { label: 'İndi',          icon: CheckCircle,   cls: 'text-ok-600 bg-ok-50 border-ok-600/20' },
  cancelled: { label: 'İptal',         icon: XCircle,       cls: 'text-bad-800 bg-bad-50 border-bad-600/20' },
  active:    { label: 'Havada',        icon: Plane,         cls: 'text-brand-600 bg-brand-50 border-brand-600/20' },
  scheduled: { label: 'Planlandı',     icon: Clock,         cls: 'text-ink-muted bg-surface-bg border-surface-border' },
  diverted:  { label: 'Yönlendi',      icon: AlertTriangle, cls: 'text-warn-600 bg-warn-50 border-warn-600/20' },
};

// Ortak haritayı kullan; bu sayfada aktif rezervasyon "Takipte" olarak etiketlenir.
const RES_STATUS = {
  ...RES_STATUS_BADGE,
  active: { ...RES_STATUS_BADGE.active, label: 'Takipte' },
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  const [flightInfo, setFlightInfo]     = useState(null);
  const [searching, setSearching]       = useState(false);
  const [signFor, setSignFor]           = useState(null);
  const [assignFor, setAssignFor]       = useState(null);
  const [payFor, setPayFor]             = useState(null);
  const [showBulk, setShowBulk]         = useState(false);
  const [linkCopied, setLinkCopied]     = useState(false);

  const load = () => api.listReservations().then(d => setReservations(d || []));
  useEffect(() => { load(); }, []);

  async function handleFlightSearch(number) {
    if (number.length < 4) { setFlightInfo(null); return; }
    setSearching(true);
    try {
      const data = await api.searchFlight(number);
      setFlightInfo(data);
      // Eğer uçuş bulunduysa ve tarih girilmediyse scheduled_arrival'ı öner
      if (data?.scheduled_arrival && !form.scheduled_pickup) {
        const d = new Date(data.scheduled_arrival);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        setForm(f => ({ ...f, scheduled_pickup: d.toISOString().slice(0, 16) }));
      }
    } catch {
      setFlightInfo(null);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.createReservation({
        flight_number:    form.flight_number,
        pnr:              form.pnr || null,
        // Liste artık yolcu adını başlık yapıyor; alan gönderilmezse backend
        // onu uçuş numarasıyla doldurur ve her kart 'girilmemiş' görünür.
        passenger_name:   form.passenger_name || null,
        passenger_phone:  form.passenger_phone || null,
        meeting_point:    form.meeting_point || null,
        // İKİSİ DE aynı dönüşümden geçmeli: biri ham biri ISO gidince
        // sunucu ikisini farklı dilimde yorumluyor ve sıra kuralı patlıyordu.
        scheduled_pickup:  localInputToIso(form.scheduled_pickup),
        dropoff_point:     form.dropoff_point || null,
        scheduled_dropoff: localInputToIso(form.scheduled_dropoff),
        notes:            form.notes,
      });
      setForm(EMPTY);
      setFlightInfo(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const openForm = () => { setShowForm(true); setError(''); setForm(EMPTY); setFlightInfo(null); };

  async function handleDelete(id) {
    if (!confirm('Bu uçuşu takip listesinden kaldırmak istiyor musunuz?')) return;
    // Silme ucu artık dokunduğu satırı doğruluyor: kayıt başka bir sekmede
    // (ya da başka bir kullanıcı tarafından) çoktan silinmişse 404 gelir.
    // Yakalanmazsa liste hiç tazelenmez ve ekranda HİÇBİR ŞEY olmaz — kullanıcı
    // butona basıp basmadığını bilemez. Her hâlükârda tazele: 404 de olsa
    // kaydın gitmiş olması istenen sonuçtur.
    try {
      await api.deleteReservation(id);
      setError('');
    } catch (err) {
      setError(err.message);
    }
    load();
  }

  async function handleComplete(id) {
    await api.updateReservation(id, { status: 'completed' });
    load();
  }

  async function handleApprove(id) {
    await api.updateReservation(id, { status: 'active' });
    load();
  }

  async function handleReject(id) {
    if (!confirm('Bu talebi reddetmek istiyor musunuz?')) return;
    await api.updateReservation(id, { status: 'cancelled' });
    load();
  }

  async function copyBookingLink() {
    try {
      const { token } = await api.getBookingLink();
      const url = `${window.location.origin}/request/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      alert('Link alınamadı: ' + err.message);
    }
  }

  const pending = reservations.filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.scheduled_pickup) - new Date(b.scheduled_pickup));

  // Tarihe göre sırala, aktif + bekleyenleri önce
  const upcoming  = reservations.filter(r => r.status === 'active').sort((a, b) => new Date(a.scheduled_pickup) - new Date(b.scheduled_pickup));
  const past      = reservations.filter(r => r.status !== 'active' && r.status !== 'pending').sort((a, b) => new Date(b.scheduled_pickup) - new Date(a.scheduled_pickup));

  // Tarih gruplarına ayır (bugün, yarın, bu hafta, gelecek)
  const grouped = groupByDate(upcoming);

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Transferlerim</h1>
          <p className="text-sm text-ink-muted mt-0.5">Transferleri önceden ekleyin; uçuş yaklaşınca ve inince otomatik bildirim alırsınız.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" onClick={copyBookingLink} icon={linkCopied ? Check : Link2} title="Otel/acentalarınızın transfer talep edebileceği link">
            {linkCopied ? 'Kopyalandı' : 'Talep Linki'}
          </Button>
          <Button variant="secondary" onClick={() => setShowBulk(true)} icon={FileSpreadsheet}>Toplu İçe Aktar</Button>
          <Button onClick={openForm} icon={Plus}>Transfer Ekle</Button>
        </div>
      </div>

      {showBulk && <Suspense fallback={null}><BulkImportModal onClose={() => setShowBulk(false)} onDone={load} /></Suspense>}

      {/* Onay Bekleyen Talepler (otel/acenta) */}
      {pending.length > 0 && (
        <div className="mb-6 bg-warn-50 border border-warn-600/20 rounded-card p-4">
          <h2 className="text-sm font-semibold text-warn-800 flex items-center gap-2 mb-3">
            <Inbox size={16} /> Onay Bekleyen Talepler ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-white border border-warn-600/20 rounded-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-bold text-ink">{r.flight_number}</span>
                    {r.source && <span className="text-xs bg-warn-50 text-warn-800 px-2 py-0.5 rounded-full">{r.source}</span>}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatPickup(r.scheduled_pickup)}</span>
                    {r.passenger_name && r.passenger_name !== r.flight_number && <span>{r.passenger_name}</span>}
                    {r.passenger_phone && <span>{r.passenger_phone}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-ink-muted mt-0.5">{r.notes}</p>}
                </div>
                <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-ok-600 hover:bg-ok-800 text-white rounded-control px-3 py-1.5 text-xs font-semibold">
                  <Check size={14} /> Onayla
                </button>
                <button onClick={() => handleReject(r.id)} aria-label="Reddet" title="Reddet" className="p-1.5 text-ink-muted hover:text-bad-600 hover:bg-bad-50 rounded-control">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Uçuş Takibe Al</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-start gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              {/* Uçuş Numarası */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Uçuş Numarası <span className="text-bad-600">*</span></label>
                <input
                  value={form.flight_number}
                  onChange={e => {
                    const val = e.target.value.toUpperCase().replace(/\s/g, '');
                    setForm(f => ({ ...f, flight_number: val }));
                    handleFlightSearch(val);
                  }}
                  placeholder="TK123, PC456..."
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm font-mono font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  required autoFocus
                />
                {searching && <p className="text-xs text-ink-muted mt-1">Uçuş aranıyor...</p>}
                {flightInfo && !searching && (
                  <div className="mt-2 px-3 py-2 bg-ok-50 border border-ok-600/20 rounded-control text-xs text-ok-800 flex items-center gap-2">
                    <CheckCircle size={13} className="text-ok-600 shrink-0" />
                    <span><strong>{flightInfo.airline}</strong> · {flightInfo.departure_airport} → {flightInfo.arrival_airport}</span>
                  </div>
                )}
              </div>

              {/* YOLCU — listenin başlığı artık bu. Alan formda yoktu:
                  webden eklenen her transfer "Yolcu adı girilmemiş" olarak
                  görünüyordu, çünkü backend passenger_name'i uçuş numarasıyla
                  dolduruyor. Mobil bu alanı zaten gönderiyordu; iki istemci
                  ayrışmış durumdaydı. */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Yolcu Adı</label>
                  <input
                    value={form.passenger_name}
                    onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
                    placeholder="Anna Schmidt"
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Yolcu Telefonu</label>
                  <input
                    value={form.passenger_phone}
                    onChange={e => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
                    placeholder="0532 111 22 33"
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Buluşma Noktası</label>
                <input
                  value={form.meeting_point}
                  onChange={e => setForm(f => ({ ...f, meeting_point: e.target.value }))}
                  placeholder="Dış Hatlar Çıkış · 4 numaralı kapı"
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              {/* Uçuş Tarihi & Saati */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">
                  <Calendar size={13} className="inline mr-1 text-brand-600" />
                  Tahmini Varış Tarihi & Saati <span className="text-bad-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_pickup}
                  onChange={e => setForm(f => ({ ...f, scheduled_pickup: e.target.value }))}
                  min={nowLocal()}
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  required
                />
                <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                  <Bell size={11} /> Uçuştan 2 saat önce hatırlatma, inince/rötar olunca bildirim gönderilir.
                </p>
              </div>

              {/* PNR */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">PNR <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                <input
                  value={form.pnr}
                  onChange={e => setForm(f => ({ ...f, pnr: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                  placeholder="ABC123"
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              {/* Varış — U-ETDS'te zorunlu alan, ama şimdiden şoför kartında
                  ve planlamada işe yarıyor. İkisi de opsiyonel bırakıldı ki
                  hızlı ekleme akışı yavaşlamasın. */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Varış Noktası <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                <input
                  value={form.dropoff_point}
                  onChange={e => setForm(f => ({ ...f, dropoff_point: e.target.value }))}
                  placeholder="Rixos Downtown, Konyaaltı"
                  maxLength={200}
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Tahmini Varış <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                <input
                  type="datetime-local"
                  value={form.scheduled_dropoff}
                  onChange={e => setForm(f => ({ ...f, scheduled_dropoff: e.target.value }))}
                  min={form.scheduled_pickup || nowLocal()}
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              {/* Not */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Not <span className="text-ink-muted font-normal">(yolcu adı, VIP vb.)</span></label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ahmet Yılmaz, Oda 204..."
                  className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-2.5 text-sm font-semibold transition-colors">
                  {submitting ? 'Ekleniyor...' : 'Takibe Al'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {assignFor && <AssignDriverModal reservation={assignFor} onClose={() => setAssignFor(null)} onAssigned={load} />}
      {signFor && <WelcomeSignModal reservation={signFor} onClose={() => setSignFor(null)} />}
      {payFor && <PaymentLinkModal reservation={payFor} onClose={() => setPayFor(null)} onPaid={load} />}

      {/* Gruplu Liste */}
      {Object.entries(grouped).map(([label, flights]) => (
        <div key={label} className="mb-6">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">{label} ({flights.length})</h2>
          <div className="space-y-3">
            {flights.map(r => <FlightCard key={r.id} r={r} onDelete={handleDelete} onComplete={handleComplete} onShowSign={setSignFor} onShowPay={setPayFor} onAssign={setAssignFor} />)}
          </div>
        </div>
      ))}

      {/* Geçmiş */}
      {past.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">Geçmiş</h2>
          <div className="space-y-2 opacity-60">
            {past.map(r => <FlightCard key={r.id} r={r} onDelete={handleDelete} isPast />)}
          </div>
        </div>
      )}

      {reservations.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-card flex items-center justify-center mb-4">
            <Plane size={28} className="text-brand-600" />
          </div>
          <p className="text-ink-soft font-semibold mb-1">Henüz uçuş yok</p>
          <p className="text-sm text-ink-muted mb-5">Gelecekteki uçuşları önceden ekleyin.</p>
          <button onClick={openForm} className="bg-brand-600 text-white rounded-card px-5 py-2.5 text-sm font-semibold hover:bg-brand-700 transition-colors">İlk Uçuşu Ekle</button>
        </div>
      )}
    </div>
  );
}

function groupByDate(reservations) {
  const groups = {};
  const now = new Date();
  const todayStr  = now.toDateString();
  const tomorrow  = new Date(now); tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  for (const r of reservations) {
    const d = new Date(r.scheduled_pickup);
    const dStr = d.toDateString();
    let label;
    if (dStr === todayStr)     label = 'Bugün';
    else if (dStr === tomorrowStr) label = 'Yarın';
    else {
      label = d.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' });
    }
    if (!groups[label]) groups[label] = [];
    groups[label].push(r);
  }
  return groups;
}

function FlightCard({ r, onDelete, onComplete, onShowSign, onShowPay, onAssign, isPast }) {
  const [copied, setCopied] = useState(false);
  const [driverCopied, setDriverCopied] = useState(false);
  const [driverBusy, setDriverBusy] = useState(false);
  const ls   = r.latest_status;
  const fs   = ls ? (FLIGHT_STATUS[ls.flight_status] || FLIGHT_STATUS.scheduled) : null;
  const rs   = RES_STATUS[r.status] || RES_STATUS.active;
  const Icon = fs?.icon || Clock;

  function handleShare() {
    const link = `${window.location.origin}/track/${r.share_token}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // Taşeron şoför linki: uygulama kurmayacak şoföre SMS/WhatsApp ile gönderilir.
  // Her çağrı YENİ token üretir — yani yanlış numaraya giden bir linki iptal
  // etmenin yolu butona tekrar basmaktır.
  async function handleDriverLink() {
    setDriverBusy(true);
    try {
      const { driver_token } = await api.createDriverLink(r.id);
      await navigator.clipboard.writeText(`${window.location.origin}/job/${driver_token}`);
      setDriverCopied(true);
      setTimeout(() => setDriverCopied(false), 2500);
    } catch {
      alert('Şoför linki oluşturulamadı. Tekrar deneyin.');
    } finally {
      setDriverBusy(false);
    }
  }

  const pickup = new Date(r.scheduled_pickup);
  const now    = new Date();
  const hoursLeft = (pickup - now) / (1000 * 60 * 60);
  const isClose = hoursLeft > 0 && hoursLeft <= 6;

  // Şoförü olmayan AKTİF transfer operasyonda bir boşluktur ve poller'ın alarm
  // ürettiği tek durum budur — kart seviyesinde ayrışsın ki dispatcher rozeti
  // okumadan da görsün. Onay bekleyen (otel talebi) kayıt bu sayıma GİRMEZ:
  // henüz kabul edilmemiş bir talepte şoför yokluğu eksiklik değildir.
  const needsDriver = !isPast && r.status === 'active' && !r.assigned_member_id && !r.driver_name;
  // Yolcu adı yoksa başlık uçuş numarasına düşer; o durumda alt satırda
  // TEKRAR yazmak aynı bilgiyi iki kez göstermek olur.
  const hasPassenger = !!r.passenger_name && r.passenger_name !== r.flight_number;

  return (
    <div className={`bg-white border rounded-card p-4 flex items-center gap-4 transition-all ${
      isPast ? 'border-surface-border'
        : needsDriver ? 'border-bad-600 border-l-4 shadow-sm'
        : isClose ? 'border-brand-600/20 shadow-sm ring-1 ring-brand-600/20'
        : 'border-surface-border shadow-sm'
    }`}>
      {/* SAAT sütunu. Bu ekranın adı artık "Transferlerim": dispatcher'ın
          taradığı şey uçuş numarası değil, KAÇTA ve KİM. Uçuş bilgisi bu
          soruların cevabını destekler, başlığı olmaz. */}
      <div className="w-14 shrink-0 text-center">
        <div className="text-lg font-bold text-ink leading-tight">
          {pickup.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </div>
        <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wide">
          {pickup.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
        </div>
        {fs && (
          <span className={`mt-1.5 inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${fs.cls}`}>
            {fs.label}
          </span>
        )}
        {isClose && !fs && (
          <span className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-warn-50 text-warn-800 border border-warn-600/20">
            <Bell size={10} /> {Math.round(hoursLeft)}s
          </span>
        )}
      </div>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink truncate">
          {hasPassenger ? r.passenger_name : r.flight_number}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted mt-0.5">
          {hasPassenger && <span className="flex items-center gap-1"><Icon size={11} />{r.flight_number}</span>}
          {ls?.arrival_delay > 0 && <span className="font-semibold text-warn-800">+{ls.arrival_delay} dk rötar</span>}
          {r.pnr   && <span className="font-mono bg-surface-alt px-1.5 py-0.5 rounded">PNR: {r.pnr}</span>}
        </div>
        {/* Güzergâh: şoförün ilk sorusu, dispatcher'ın da doğrulaması gereken şey. */}
        {(r.meeting_point || r.dropoff_point) && (
          <div className="flex items-center gap-1 text-xs text-ink-soft mt-1 min-w-0">
            <Calendar size={11} className="shrink-0 opacity-0" />
            <span className="truncate">
              {r.meeting_point || '—'}{r.dropoff_point ? ` → ${r.dropoff_point}` : ''}
            </span>
          </div>
        )}
        {r.notes && <div className="text-xs text-ink-muted truncate mt-0.5">{r.notes}</div>}

        {/* Kim sürüyor ve iş nerede — dispatcher'ın panoda görmesi gereken iki
            şey buydu; ikisi de görünmüyordu. Şoför yoksa sessiz kalmak yerine
            açıkça söylenir: atanmamış bir iş operasyonda bir boşluktur. */}
        {!isPast && (
          <div className="flex items-center gap-2 flex-wrap mt-1.5">
            {/* "Atanmış mı" ölçütü ad DEĞİL atamanın kendisidir: profilinde adı
                olmayan bir üyeye atandığında kart yanlışlıkla "atanmadı" derdi. */}
            {r.driver_name ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                <UserCheck size={11} /> {r.driver_name}
              </span>
            ) : r.assigned_member_id ? (
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-soft">
                <UserCheck size={11} /> Şoför atandı (adı girilmemiş)
              </span>
            ) : r.status === 'active' ? (
              // Tek dokunuşla çözülebilen bir eksik: uyarıyı eylemin KENDİSİ
              // yap, dispatcher'ı ayrıca bir ikon aramaya zorlama.
              <button
                onClick={() => onAssign && onAssign(r)}
                className="flex items-center gap-1 text-xs font-semibold text-bad-800 bg-bad-50 hover:bg-bad-50/70 px-2 py-1 rounded-full transition-colors"
              >
                <AlertTriangle size={11} /> Şoför atanmadı — ata
              </button>
            ) : (
              <span className="flex items-center gap-1 text-xs font-semibold text-ink-muted">
                <AlertTriangle size={11} /> Şoför atanmadı
              </span>
            )}
            {r.job_status && JOB_BADGE[r.job_status] && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${JOB_BADGE[r.job_status].cls}`}>
                {JOB_BADGE[r.job_status].label}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sağ */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rs.cls}`}>{rs.label}</span>
        {r.share_token && (
          <button onClick={handleShare} aria-label="Takip linkini kopyala" title={copied ? 'Kopyalandı' : 'Takip linkini kopyala'} className={`p-1.5 rounded-control transition-colors ${copied ? 'text-ok-600 bg-ok-50' : 'text-ink-muted hover:text-brand-600 hover:bg-brand-50'}`}>
            {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
          </button>
        )}
        {!isPast && onAssign && (
          <button onClick={() => onAssign(r)}
            aria-label="Şoför ata"
            title={r.assigned_member_id ? 'Atanan şoförü değiştir' : 'Kadrolu şoför ata'}
            className={`p-1.5 rounded-control transition-colors ${r.assigned_member_id ? 'text-brand-600 bg-brand-50' : 'text-ink-muted hover:text-brand-600 hover:bg-brand-50'}`}>
            <UserCheck size={14} />
          </button>
        )}
        {!isPast && (
          <button onClick={handleDriverLink} disabled={driverBusy}
            aria-label="Şoför iş linki oluştur ve kopyala"
            title={driverCopied ? 'Link kopyalandı — şoföre gönderin' : 'Şoför iş linki oluştur (taşeron şoför için)'}
            className={`p-1.5 rounded-control transition-colors disabled:opacity-50 ${driverCopied ? 'text-ok-600 bg-ok-50' : 'text-ink-muted hover:text-brand-600 hover:bg-brand-50'}`}>
            {driverCopied ? <CheckCircle size={14} /> : <Car size={14} />}
          </button>
        )}
        {!isPast && onShowSign && (
          <button onClick={() => onShowSign(r)} aria-label="Karşılama tabelası" title="Karşılama tabelası" className="p-1.5 text-ink-muted hover:text-accent-600 hover:bg-accent-50 rounded-control transition-colors">
            <UserCheck size={14} />
          </button>
        )}
        {!isPast && onShowPay && (
          r.payment_status === 'paid' ? (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-ok-50 text-ok-800 flex items-center gap-1">
              <CheckCircle size={11} /> Ödendi
            </span>
          ) : (
            <button onClick={() => onShowPay(r)} aria-label="Ödeme linki oluştur" title="Ödeme linki oluştur" className="p-1.5 text-ink-muted hover:text-ok-600 hover:bg-ok-50 rounded-control transition-colors">
              <CreditCard size={14} />
            </button>
          )
        )}
        {!isPast && onComplete && (
          <button onClick={() => onComplete(r.id)} aria-label="Tamamlandı" title="Tamamlandı" className="p-1.5 text-ink-muted hover:text-ok-600 hover:bg-ok-50 rounded-control transition-colors">
            <CheckSquare size={14} />
          </button>
        )}
        <button onClick={() => onDelete(r.id)} className="p-1.5 text-ink-muted hover:text-bad-600 hover:bg-bad-50 rounded-control transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
