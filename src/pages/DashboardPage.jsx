// Ana Sayfa — ARTIK BİR ÖZET DEĞİL, çalışma ekranı.
//
// Önceden burada "son 5 rezervasyon" duruyordu ve arama hiç yoktu: dispatcher
// "Schmidt geldi mi" diye bakmak için önce Transferlerim'e geçmek zorundaydı.
// Şimdi transfer araması ve kayıtlı liste doğrudan burada.
//
// Transferlerim sayfası kalıyor: orası YÖNETİM (ekle, toplu içe aktar, geçmiş,
// ödeme, tabela). Burası bakma ve bulma.
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { RES_STATUS_BADGE as STATUS_BADGE, FLIGHT_BADGE, JOB_BADGE } from '../lib/status';
import { StatCard, Card, Badge, EmptyState, LoadingBlock } from '../components/ui';
import { Plane, CheckCircle, XCircle, MessageSquare, ArrowRight, Search, X, AlertTriangle, UserCheck, Car } from 'lucide-react';
import AssignDriverModal from '../components/AssignDriverModal';
import { matchesQuery } from '../lib/search';
import { cardTitle, showFlightLine, isFlightTransfer } from '../lib/transfer';

export default function DashboardPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [assignFor, setAssignFor] = useState(null);

  const load = () => Promise.all([api.listReservations(), api.listNotifications()])
    .then(([r, n]) => { setReservations(r || []); setNotifications(n || []); });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const active    = reservations.filter(r => r.status === 'active').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;

  // Eşleştirme SAF fonksiyonda (lib/search.js) ve mobille AYNI: Türkçe I/İ ve
  // ş/ğ/ü/ö/ç katlaması olmadan 'Ibrahim' sorgusu 'İbrahim'i bulmuyordu.
  const q = query.trim();
  const listedAll = useMemo(() => {
    if (!q) {
      return reservations
        // ALT SINIR: poller pickup+12s'e kadar kaydı 'active' bırakıyor.
        // Sınır olmadan sabah bitmiş ama kapatılmamış işler listenin başını
        // kaplıyor ve öğleden sonraki gerçek işler hiç görünmüyordu.
        .filter(r => r.status === 'active' && new Date(r.scheduled_pickup) > Date.now() - 3 * 3600 * 1000)
        .sort((a, b) => new Date(a.scheduled_pickup) - new Date(b.scheduled_pickup));
    }
    // Arama varken GEÇMİŞ de taranır: "geçen haftaki Petrov" da bir soru.
    return reservations
      .filter(r => matchesQuery(r, q))
      .sort((a, b) => new Date(b.scheduled_pickup) - new Date(a.scheduled_pickup));
  }, [reservations, q]);

  // Sayaç KIRPMADAN ÖNCEKİ uzunluğu bilmeli: "(30)" gösterip 200 sonucu
  // gizlemek, dispatcher'a aradığı kaydın olmadığını düşündürür.
  const listed = listedAll.slice(0, q ? 30 : 8);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Ana Sayfa</h1>
      <p className="text-sm text-ink-muted mb-6">Transferlerinizi buradan arayın ve takip edin.</p>

      <div className="relative mb-6">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-muted pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Transfer ara — yolcu, uçuş no, PNR, şoför"
          className="w-full border border-surface-borderstrong rounded-card pl-11 pr-11 py-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-600/30"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Aramayı temizle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink rounded-control">
            <X size={16} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Aktif Transfer"  value={active}               icon={Plane}         tone="brand" />
        <StatCard label="Tamamlanan"      value={completed}            icon={CheckCircle}   tone="ok" />
        <StatCard label="İptal"           value={cancelled}            icon={XCircle}       tone="bad" />
        <StatCard label="Toplam Bildirim" value={notifications.length} icon={MessageSquare} tone="accent" />
      </div>

      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm">
            {q ? `Arama sonuçları (${listedAll.length > listed.length ? `${listed.length}/${listedAll.length}` : listed.length})` : 'Yaklaşan Transferler'}
          </h2>
          <Link to="/app/reservations" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
            Tümü <ArrowRight size={12} aria-hidden="true" />
          </Link>
        </div>

        {listed.length === 0 ? (
          <EmptyState
            icon={q ? Search : Plane}
            title={q ? 'Eşleşen transfer yok' : 'Yaklaşan transfer yok'}
            description={q
              ? 'Yolcu adı, uçuş numarası, PNR veya şoför adıyla arayabilirsiniz.'
              : 'İlk transferi ekleyin — uçuş yaklaştığında durum güncellemeleri otomatik gelir.'}
            action={!q && <Link to="/app/reservations" className="text-sm font-semibold text-brand-600 hover:underline">Transfer Ekle →</Link>}
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {listed.map(r => {
              const status = STATUS_BADGE[r.status] || STATUS_BADGE.active;
              const flight = r.latest_status ? (FLIGHT_BADGE[r.latest_status.flight_status] || null) : null;
              const job    = r.job_status ? JOB_BADGE[r.job_status] : null;
              const pickup = new Date(r.scheduled_pickup);
              // Transferlerim listesiyle AYNI kural — ve kural ortak
              // dosyada (lib/transfer.js). Aynı transferin iki ekranda farklı
              // görünmesi (birinde uçuş satırı olup diğerinde olmaması)
              // güveni bozar.
              const showFlight = showFlightLine(r);
              const needsDriver = r.status === 'active' && !r.assigned_member_id && !r.driver_name;

              return (
                <div key={r.id} className={`px-5 py-3.5 flex items-center gap-4 ${needsDriver ? 'border-l-4 border-bad-600' : ''}`}>
                  <div className="w-14 shrink-0 text-center">
                    <div className="text-sm font-bold text-ink leading-tight">
                      {pickup.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[11px] text-ink-muted">
                      {pickup.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
                    </div>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ink truncate">
                      {cardTitle(r)}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted mt-0.5 truncate">
                      {showFlight && <span className="font-mono">{r.flight_number}</span>}
                      {!isFlightTransfer(r) && <span className="flex items-center gap-1"><Car size={11} />Uçuşsuz</span>}
                      {r.latest_status?.arrival_delay > 0 && (
                        <span className="font-semibold text-warn-800">+{r.latest_status.arrival_delay} dk</span>
                      )}
                      {(r.meeting_point || r.dropoff_point) && (
                        <span className="truncate">{[r.meeting_point, r.dropoff_point].filter(Boolean).join(' → ')}</span>
                      )}
                    </div>
                  </div>

                  {needsDriver ? (
                    <button onClick={() => setAssignFor(r)}
                            className="shrink-0 flex items-center gap-1 text-xs font-semibold text-bad-800 bg-bad-50 hover:bg-bad-50/70 px-2 py-1 rounded-full transition-colors">
                      <AlertTriangle size={11} /> Şoför ata
                    </button>
                  ) : r.driver_name ? (
                    <span className="shrink-0 hidden sm:flex items-center gap-1 text-xs text-ink-soft max-w-[140px]">
                      <UserCheck size={11} className="shrink-0" /> <span className="truncate">{r.driver_name}</span>
                    </span>
                  ) : null}

                  {job && <Badge cls={job.cls}>{job.label}</Badge>}
                  {flight && <Badge cls={flight.cls}>{flight.label}</Badge>}
                  <Badge cls={status.cls}>{status.label}</Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {assignFor && (
        <AssignDriverModal
          reservation={assignFor}
          onClose={() => setAssignFor(null)}
          onAssigned={load}
        />
      )}
    </div>
  );
}
