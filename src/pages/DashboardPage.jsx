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
import { RES_STATUS_BADGE as STATUS_BADGE, FLIGHT_BADGE, jobBadge } from '../lib/status';
import { StatRow, Card, Badge, EmptyState, LoadingBlock } from '../components/ui';
import { Plane, ArrowRight, Search, X, AlertTriangle, UserCheck, Car } from 'lucide-react';
import AssignDriverModal from '../components/AssignDriverModal';
import { matchesQuery } from '../lib/search';
import { cardTitle, showFlightLine, isFlightTransfer, looksLikeFlightNumber, needsDriver as isDriverless } from '../lib/transfer';

export default function DashboardPage() {
  const [reservations,  setReservations]  = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery]     = useState('');
  const [assignFor, setAssignFor] = useState(null);
  // Şoförsüz uyarı şeridinin "Göster"i — listeyi şoförsüz işlere daraltır.
  // Şeridin kendisi bir ÇIKMAZ olmasın diye var: "1 transferde şoför yok"
  // deyip kullanıcıyı sekiz kayıtlık listede o birini aramaya bırakmak,
  // uyarıyı bilgiden çok gürültüye çevirir.
  const [driverlessOnly, setDriverlessOnly] = useState(false);

  const load = () => Promise.all([api.listReservations(), api.listNotifications()])
    .then(([r, n]) => { setReservations(r || []); setNotifications(n || []); });

  useEffect(() => { load().finally(() => setLoading(false)); }, []);

  const active    = reservations.filter(r => r.status === 'active').length;
  const completed = reservations.filter(r => r.status === 'completed').length;
  const cancelled = reservations.filter(r => r.status === 'cancelled').length;
  // GÖNDERİLEN, toplam DEĞİL — mobille (DashboardScreen) birebir aynı ölçüt.
  // Burada `notifications.length` yazılıydı ve aynı hesapta iki platform
  // farklı sayı gösteriyordu: canlıda 46 bildirimin 46'sı da 'failed', yani
  // web "46 bildirim gitti" derken gerçekte hiçbiri gitmemişti. Başarısızı
  // sayan bir sayı, tam da bakılma sebebini (gitti mi?) yanlış cevaplar.
  // Kapı: scripts/test-stats.mjs (mobilde de aynısı var).
  const sentCount = notifications.filter(n => n.status === 'sent').length;

  // Eşleştirme SAF fonksiyonda (lib/search.js) ve mobille AYNI: Türkçe I/İ ve
  // ş/ğ/ü/ö/ç katlaması olmadan 'Ibrahim' sorgusu 'İbrahim'i bulmuyordu.
  const q = query.trim();

  const upcoming = useMemo(() => reservations
    // ALT SINIR: poller pickup+12s'e kadar kaydı 'active' bırakıyor.
    // Sınır olmadan sabah bitmiş ama kapatılmamış işler listenin başını
    // kaplıyor ve öğleden sonraki gerçek işler hiç görünmüyordu.
    .filter(r => r.status === 'active' && new Date(r.scheduled_pickup) > Date.now() - 3 * 3600 * 1000)
    .sort((a, b) => new Date(a.scheduled_pickup) - new Date(b.scheduled_pickup)), [reservations]);

  // Şerit KOŞULLU: şoförsüz iş yoksa hiç basılmaz.
  const driverlessCount = upcoming.filter(isDriverless).length;

  // TÜRETİLMİŞ, saklanmış değil: arama başlayınca daraltma kendiliğinden düşer
  // (şerit de o an ekrandan çekiliyor — görünür sebebi olmayan bir filtre
  // listeyi "eksik" gösterir) ve son şoför atandığında sayı sıfıra inip
  // daraltma kapanır, yoksa kullanıcı boş bir listeyle baş başa kalırdı.
  const showDriverlessOnly = !q && driverlessOnly && driverlessCount > 0;

  // Ve BAYRAĞIN KENDİSİ de temizlenmeli, yalnız türetilmiş değer değil: aksi
  // hâlde dispatcher daraltır, son şoförü atar, liste normale döner ama bayrak
  // true kalır — sonraki şoförsüz kayıt geldiğinde liste kendiliğinden daralır.
  useEffect(() => { if (driverlessCount === 0) setDriverlessOnly(false); }, [driverlessCount]);

  const listedAll = useMemo(() => {
    if (!q) return showDriverlessOnly ? upcoming.filter(isDriverless) : upcoming;
    // Arama varken GEÇMİŞ de taranır: "geçen haftaki Petrov" da bir soru.
    return reservations
      .filter(r => matchesQuery(r, q))
      .sort((a, b) => new Date(b.scheduled_pickup) - new Date(a.scheduled_pickup));
  }, [reservations, q, upcoming, showDriverlessOnly]);

  // Sayaç KIRPMADAN ÖNCEKİ uzunluğu bilmeli: "(30)" gösterip 200 sonucu
  // gizlemek, dispatcher'a aradığı kaydın olmadığını düşündürür.
  const listed = listedAll.slice(0, q ? 30 : 8);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-ink mb-1">Ana Sayfa</h1>
      <p className="text-sm text-ink-muted mb-6">Transferlerinizi buradan arayın ve takip edin.</p>

      <div className="relative mb-6">
        {/* Aktifken büyüteç marka rengine döner: "ekran seni dinliyor"
            sinyali, kullanıcının BAKTIĞI yerde verilir. */}
        <Search size={17} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${q ? 'text-brand-600' : 'text-ink-muted'}`} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Transfer ara — yolcu, uçuş no, PNR, şoför"
          className={`w-full rounded-card pl-11 pr-11 py-3 text-sm bg-white border focus:outline-none focus:ring-2 focus:ring-brand-600/30 ${
            q ? 'border-brand-600' : 'border-surface-borderstrong'
          }`}
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Aramayı temizle"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-ink-muted hover:text-ink rounded-control">
            <X size={16} />
          </button>
        )}
      </div>

      {/* ARAMA BİR MOD, bir filtre değil — mobille aynı karar (bkz.
          DashboardScreen). İstatistikler hesabın ÖZETİDİR, aramanın cevabı
          değil: arama kutusu ile sonuç arasında durup cevabı aşağı itiyorlar.
          Dar ekranda ızgara iki satıra kırılıyor ve sonuç katlamanın altında
          kalıyor; kullanıcı yukarıda yazıp aşağıda bir şey görmeyince
          "arama tepki vermiyor" diyor. Bu tam olarak mobilde yaşandı. */}
      {!q && (
        <div className="mb-6 space-y-3">
          {/* Etiketler TEK KELİME. "Aktif Transfer" ve "Toplam Bildirim" 375px
              ekranda 77px'lik hücreye sığmayıp "Aktif Transf…" diye kırpılıyordu
              — kırpılmış bir etiket, sayının neyi saydığını söylemeyi bırakır.
              Tasarım artboard'u da bu kısa hâli kullanıyor.

              "Bildirim" DEĞİL "Gönderilen": sayı yalnız status='sent' satırları
              sayıyor, "Bildirim" ise toplamı sayıyormuş gibi okunuyordu — etiket
              ölçütü söylemediği için iki platformun ayrıştığı da fark edilmedi.
              ÖLÇÜLDÜ (Manrope 600, 11px, TTF advance): "Gönderilen" 58.1px —
              hücreye sığar ve hâlihazırda basılan "Tamamlanan"dan (67.5px)
              dardır. Sığmayan alternatifler: "Toplam Bildirim" 80.3px,
              "Gönderilen Bildirim" daha da uzun. */}
          <StatRow items={[
            { label: 'Aktif',      value: active,    to: '/app/reservations', tone: 'brand' },
            { label: 'Tamamlanan', value: completed, to: '/app/reservations' },
            { label: 'İptal',      value: cancelled, to: '/app/reservations' },
            { label: 'Gönderilen', value: sentCount, to: '/app/notifications' },
          ]} />

          {/* KOŞULLU şerit: şoförsüz iş varsa çıkar, yoksa hiç basılmaz.
              Sayılar durum bildirir, şerit EYLEM ister — her zaman duran bir
              şerit ikisini de sayıya çevirir ve göz onu okumayı bırakır.
              Mobille aynı karar (DashboardScreen). */}
          {driverlessCount > 0 && (
            <button
              type="button"
              onClick={() => setDriverlessOnly(v => !v)}
              className="w-full flex items-center gap-2.5 min-h-[44px] px-3.5 py-2.5 text-left bg-bad-50 border border-surface-dangerborder rounded-control hover:bg-bad-50/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-bad-600/40"
              aria-pressed={showDriverlessOnly}
            >
              <AlertTriangle size={16} className="text-bad-800 shrink-0" aria-hidden="true" />
              <span className="flex-1 text-sm font-semibold text-bad-800">
                {driverlessCount} transferde şoför yok
              </span>
              {/* "Tümü" DEĞİL: kartın sağ üstünde zaten bir "Tümü →" var ve o
                  Transferlerim'e gidiyor. Aynı kelime iki farklı şey yaparsa
                  daraltmayı kapatmak isteyen dispatcher ekrandan çıkar.
                  Uzun da olamaz — mobilde ölçüldü: sabit genişlikli eylem
                  sıkışmanın tamamını mesaja yıkıyor. Metin iki platformda aynı. */}
              <span className="text-sm font-bold text-bad-800 underline shrink-0">
                {showDriverlessOnly ? 'Vazgeç' : 'Göster'}
              </span>
            </button>
          )}
        </div>
      )}

      <Card padding="none">
        <div className="px-5 py-4 border-b border-surface-border flex items-center justify-between">
          <h2 className="font-semibold text-ink text-sm">
            {q ? 'Arama sonuçları' : showDriverlessOnly ? 'Şoförsüz Transferler' : 'Yaklaşan Transferler'}
          </h2>
          {/* Sayı ROZETTE: arama sırasında ekrandaki ilk cevap odur, parantez
              içi düz metin olarak göze çarpmıyordu. Sıfır sonuç bir HATA
              değil bir cevaptır — kırmızı değil, nötr yüzey. */}
          {/* DARALTMA MODUNDA DA BASILIR: liste 8 kartla sınırlı, şerit ise
              "12 transferde şoför yok" diyor. Aradaki farkı söyleyen bir şey
              olmadan dispatcher 8'ini atayıp listenin boşaldığını görünce
              "hepsini hallettim" sanar — oysa şerit hâlâ 4 diyecektir. */}
          {q || showDriverlessOnly ? (
            // Rozet ELLE yazılmaz: aynı kartın altındaki durum rozetleri
            // Badge'den geliyor, elle yazılan kopya bir ton ve bir ağırlık
            // sapıyordu. `role=status` + `aria-live`: sayı ekrandaki ilk
            // cevap, başlıktan koparıldığı için ekran okuyucuya çıplak "3"
            // olarak düşüyordu.
            <Badge
              tone={listedAll.length === 0 ? 'neutral' : 'brand'}
              className="min-w-[28px] justify-center"
              role="status"
              aria-live="polite"
              aria-label={`${listedAll.length} ${q ? 'sonuç' : 'şoförsüz transfer'}`}
            >
              {listedAll.length > listed.length ? `${listed.length}/${listedAll.length}` : listedAll.length}
            </Badge>
          ) : (
            // "Tümü" arama sırasında sorguyu DÜŞÜREN bir yol — gizlenir ki
            // ekranda tek anlamlı ileri adım kalsın.
            <Link to="/app/reservations" className="flex items-center gap-1 text-xs text-brand-600 hover:underline">
              Tümü <ArrowRight size={12} aria-hidden="true" />
            </Link>
          )}
        </div>

        {listed.length === 0 ? (
          <EmptyState
            icon={q ? Search : Plane}
            title={q ? 'Kayıtlı transferlerinizde eşleşme yok' : 'Yaklaşan transfer yok'}
            description={q
              ? 'Yolcu adı, uçuş numarası, PNR, şoför adı veya adresle arayabilirsiniz. Bu arama YALNIZ kayıtlı transferlerinizi tarar.'
              : 'İlk transferi ekleyin — uçuş yaklaştığında durum güncellemeleri otomatik gelir.'}
            /* ÇIKMAZI KAPAT: kullanıcı buraya bir uçuş numarası yazıp boş liste
               görünce "arama çalışmıyor" sanıyordu — oysa canlı uçuş sorgusu
               ayrı bir iş ve bu sayfada ona giden HİÇBİR yol yoktu. Numara gibi
               görünen sorguda Transferlerim'in ekleme formunu o numarayla açar;
               form açılışta canlı sorguyu kendisi çalıştırır. */
            action={
              q
                ? (looksLikeFlightNumber(q) && (
                    <Link
                      to={`/app/reservations?flight=${encodeURIComponent(q.toUpperCase().replace(/\s+/g, ''))}`}
                      className="inline-flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-control px-5 py-2.5 transition-colors"
                    >
                      <Plane size={16} aria-hidden="true" />
                      {q.toUpperCase().replace(/\s+/g, '')} uçuşunu canlı ara
                    </Link>
                  ))
                : <Link to="/app/reservations" className="text-sm font-semibold text-brand-600 hover:underline">Transfer Ekle →</Link>
            }
          />
        ) : (
          <div className="divide-y divide-surface-border">
            {listed.map(r => {
              const status = STATUS_BADGE[r.status] || STATUS_BADGE.active;
              const flight = r.latest_status ? (FLIGHT_BADGE[r.latest_status.flight_status] || null) : null;
              // `jobBadge` rezervasyonun KENDİSİNİ alır: uçuşsuz transferde
              // "Havalimanında" rozeti yanlış bilgi verir, "Alış noktasında" der.
              const job    = jobBadge(r);
              const pickup = new Date(r.scheduled_pickup);
              // Transferlerim listesiyle AYNI kural — ve kural ortak
              // dosyada (lib/transfer.js). Aynı transferin iki ekranda farklı
              // görünmesi (birinde uçuş satırı olup diğerinde olmaması)
              // güveni bozar.
              const showFlight = showFlightLine(r);
              const needsDriver = isDriverless(r);

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
                      {!isFlightTransfer(r) && <span className="flex items-center gap-1"><Car size={11} />Transfer</span>}
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
