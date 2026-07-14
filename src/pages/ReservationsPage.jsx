import { useEffect, useState, lazy, Suspense } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Plane, X, AlertCircle, Clock, CheckCircle, XCircle, AlertTriangle, CheckSquare, Calendar, Bell, Share2, UserCheck, CreditCard, FileSpreadsheet, Link2, Check, Inbox } from 'lucide-react';
import WelcomeSignModal from '../components/WelcomeSignModal';
import PaymentLinkModal from '../components/PaymentLinkModal';

// xlsx ağır — sadece modal açılınca yüklensin (ana bundle'ı şişirmesin)
const BulkImportModal = lazy(() => import('../components/BulkImportModal'));

// Bugünün datetime-local değeri (min için)
function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

const EMPTY = { flight_number: '', pnr: '', scheduled_pickup: '', notes: '' };

const FLIGHT_STATUS = {
  landed:    { label: 'İndi',          icon: CheckCircle,   cls: 'text-ok-600 bg-ok-50 border-ok-600/20' },
  cancelled: { label: 'İptal',         icon: XCircle,       cls: 'text-bad-800 bg-bad-50 border-bad-600/20' },
  active:    { label: 'Havada',        icon: Plane,         cls: 'text-brand-600 bg-brand-50 border-brand-600/20' },
  scheduled: { label: 'Planlandı',     icon: Clock,         cls: 'text-ink-muted bg-surface-bg border-surface-border' },
  diverted:  { label: 'Yönlendi',      icon: AlertTriangle, cls: 'text-warn-600 bg-warn-50 border-warn-600/20' },
};

const RES_STATUS = {
  active:    { label: 'Takipte',    cls: 'bg-brand-50 text-brand-700' },
  completed: { label: 'Tamamlandı', cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',      cls: 'bg-bad-50 text-bad-800' },
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
        scheduled_pickup: form.scheduled_pickup,
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
    await api.deleteReservation(id);
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Uçuş Takibi</h1>
          <p className="text-sm text-ink-muted mt-0.5">Gelecekteki uçuşları önceden ekleyin. Yaklaştığında otomatik bildirim alırsınız.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={copyBookingLink} className="flex items-center gap-2 border border-surface-border hover:bg-surface-bg text-ink-soft rounded-card px-4 py-2.5 text-sm font-semibold transition-colors" title="Otel/acentalarınızın transfer talep edebileceği link">
            {linkCopied ? <><Check size={16} className="text-ok-600" /> Kopyalandı</> : <><Link2 size={16} className="text-brand-600" /> Talep Linki</>}
          </button>
          <button onClick={() => setShowBulk(true)} className="flex items-center gap-2 border border-surface-border hover:bg-surface-bg text-ink-soft rounded-card px-4 py-2.5 text-sm font-semibold transition-colors">
            <FileSpreadsheet size={16} className="text-ok-600" /> Toplu İçe Aktar
          </button>
          <button onClick={openForm} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-card px-4 py-2.5 text-sm font-semibold transition-colors shadow-sm">
            <Plus size={16} /> Uçuş Ekle
          </button>
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
                    <span className="flex items-center gap-1"><Calendar size={11} />{new Date(r.scheduled_pickup).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    {r.passenger_name && r.passenger_name !== r.flight_number && <span>{r.passenger_name}</span>}
                    {r.passenger_phone && <span>{r.passenger_phone}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-ink-muted mt-0.5">{r.notes}</p>}
                </div>
                <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-ok-600 hover:bg-ok-800 text-white rounded-control px-3 py-1.5 text-xs font-semibold">
                  <Check size={14} /> Onayla
                </button>
                <button onClick={() => handleReject(r.id)} className="p-1.5 text-ink-muted hover:text-bad-600 hover:bg-bad-50 rounded-control" title="Reddet">
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

      {signFor && <WelcomeSignModal reservation={signFor} onClose={() => setSignFor(null)} />}
      {payFor && <PaymentLinkModal reservation={payFor} onClose={() => setPayFor(null)} onPaid={load} />}

      {/* Gruplu Liste */}
      {Object.entries(grouped).map(([label, flights]) => (
        <div key={label} className="mb-6">
          <h2 className="text-xs font-semibold text-ink-muted uppercase tracking-wide mb-3">{label} ({flights.length})</h2>
          <div className="space-y-3">
            {flights.map(r => <FlightCard key={r.id} r={r} onDelete={handleDelete} onComplete={handleComplete} onShowSign={setSignFor} onShowPay={setPayFor} />)}
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

function FlightCard({ r, onDelete, onComplete, onShowSign, onShowPay, isPast }) {
  const [copied, setCopied] = useState(false);
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

  const pickup = new Date(r.scheduled_pickup);
  const now    = new Date();
  const hoursLeft = (pickup - now) / (1000 * 60 * 60);
  const isClose = hoursLeft > 0 && hoursLeft <= 6;

  return (
    <div className={`bg-white border rounded-card p-4 flex items-center gap-4 transition-all ${
      isPast ? 'border-surface-border' : isClose ? 'border-brand-600/20 shadow-sm ring-1 ring-brand-600/20' : 'border-surface-border shadow-sm'
    }`}>
      {/* İkon */}
      <div className={`w-11 h-11 rounded-card flex items-center justify-center border shrink-0 ${fs?.cls || 'text-ink-muted bg-surface-bg border-surface-border'}`}>
        <Icon size={20} />
      </div>

      {/* Bilgiler */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-mono font-bold text-ink text-base">{r.flight_number}</span>
          {fs && (
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${fs.cls}`}>
              {fs.label}{ls?.arrival_delay > 0 && ` +${ls.arrival_delay}dk`}
            </span>
          )}
          {isClose && !fs && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-warn-50 text-warn-800 border border-warn-600/20 flex items-center gap-1">
              <Bell size={10} /> {Math.round(hoursLeft)}s kaldı
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted">
          <span className="flex items-center gap-1"><Calendar size={11} />{pickup.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
          {r.pnr   && <span className="font-mono bg-surface-alt px-1.5 py-0.5 rounded">PNR: {r.pnr}</span>}
          {r.notes && <span className="text-ink-muted">{r.notes}</span>}
        </div>
      </div>

      {/* Sağ */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${rs.cls}`}>{rs.label}</span>
        {r.share_token && (
          <button onClick={handleShare} title={copied ? 'Kopyalandı' : 'Takip linkini kopyala'} className={`p-1.5 rounded-control transition-colors ${copied ? 'text-ok-600 bg-ok-50' : 'text-ink-muted hover:text-brand-600 hover:bg-brand-50'}`}>
            {copied ? <CheckCircle size={14} /> : <Share2 size={14} />}
          </button>
        )}
        {!isPast && onShowSign && (
          <button onClick={() => onShowSign(r)} title="Karşılama tabelası" className="p-1.5 text-ink-muted hover:text-accent-600 hover:bg-accent-50 rounded-control transition-colors">
            <UserCheck size={14} />
          </button>
        )}
        {!isPast && onShowPay && (
          r.payment_status === 'paid' ? (
            <span className="text-xs font-semibold px-2 py-1 rounded-full bg-ok-50 text-ok-800 flex items-center gap-1">
              <CheckCircle size={11} /> Ödendi
            </span>
          ) : (
            <button onClick={() => onShowPay(r)} title="Ödeme linki oluştur" className="p-1.5 text-ink-muted hover:text-ok-600 hover:bg-ok-50 rounded-control transition-colors">
              <CreditCard size={14} />
            </button>
          )
        )}
        {!isPast && onComplete && (
          <button onClick={() => onComplete(r.id)} title="Tamamlandı" className="p-1.5 text-ink-muted hover:text-ok-600 hover:bg-ok-50 rounded-control transition-colors">
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
