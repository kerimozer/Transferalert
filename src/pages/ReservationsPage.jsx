import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../lib/api';
import { RES_STATUS_BADGE, jobBadge } from '../lib/status';
import { formatPickup, localInputToIso } from '../lib/format';
import { FLIGHT, isFlightTransfer, cardTitle, showFlightLine, needsDriver as driverPending, hasDriver, initials } from '../lib/transfer';
import TransferTypeToggle from '../components/TransferTypeToggle';
import { Button, StatusStrip } from '../components/ui';
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

const EMPTY = { transfer_type: FLIGHT, flight_number: '', pnr: '', passenger_name: '', passenger_phone: '', meeting_point: '', scheduled_pickup: '', dropoff_point: '', scheduled_dropoff: '', notes: '' };

// SALT İKON. Burada eskiden `label` ve `cls` de vardı ve şerit onları
// kullanıyordu; şerit ortak `StatusStrip`'e taşınınca ikisi de ÖLDÜ. Ölü
// alanları bırakmak tehlikeli: bu haritada `diverted` için 'Yönlendi' yazıyordu,
// `lib/status.js` → FLIGHT_BADGE'de aynı durum 'Yönlendirildi'. Tam bu ayrışmayı
// temizlemek için yapılan turdan sonra birinin yine `fs.label`'a uzanması
// yeterdi. Etiket ve renk TEK KAYNAKTA (FLIGHT_BADGE); burada yalnız uçuş
// satırının küçük ikonu kalır.
const FLIGHT_ICON = {
  landed:    CheckCircle,
  cancelled: XCircle,
  active:    Plane,
  scheduled: Clock,
  diverted:  AlertTriangle,
};

// Ortak haritayı kullan; bu sayfada aktif rezervasyon "Takipte" olarak etiketlenir.
const RES_STATUS = {
  ...RES_STATUS_BADGE,
  active: { ...RES_STATUS_BADGE.active, label: 'Takipte' },
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState([]);
  const [loadError, setLoadError] = useState(null);
  const [showForm, setShowForm]         = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [submitting, setSubmitting]     = useState(false);
  const [error, setError]               = useState('');
  // Form hatası MODAL İÇİNDE basılır; eylem hatası SAYFA düzeyinde. İkisi tek
  // state olsaydı (öyleydi) modal kapalıyken yazılan mesaj hiç görünmezdi.
  const [actionError, setActionError]   = useState('');
  // Aynı anda tek eylem: çift PATCH'i ve "bastım mı basmadım mı"yı önler.
  const [busyAction, setBusyAction]     = useState('');
  // Hata şeridine odaklanmak için — uzun listede şerit ekran dışında kalıyor.
  const errorRef = useRef(null);
  const [flightInfo, setFlightInfo]     = useState(null);
  // Canlı sorgu sonuç vermedi mi? `flightInfo === null` YETMEZ: "henüz
  // aranmadı" ile "arandı, bulunamadı" aynı değere düşüyordu.
  const [flightMiss, setFlightMiss]     = useState(false);
  const [searching, setSearching]       = useState(false);
  const [signFor, setSignFor]           = useState(null);
  const [assignFor, setAssignFor]       = useState(null);
  const [payFor, setPayFor]             = useState(null);
  const [showBulk, setShowBulk]         = useState(false);
  const [linkCopied, setLinkCopied]     = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  // Formun yarısı buna bağlı (uçuş alanları, etiketler, zorunluluklar).
  // Tek yerden türetiliyor ki alanlardan biri diğerinden farklı bir dala
  // düşmesin — "uçuş numarası gizli ama hâlâ required" gibi bir durumda
  // form sessizce gönderilemez hale gelir ve sebebi ekranda görünmez.
  const isFlight = form.transfer_type === FLIGHT;

  // HATA YUTULMAZ. `.catch` yoktu ve bu fonksiyon yalnız ilk açılışta değil
  // SİLME / OLUŞTURMA / ONAYLAMA sonrasında da çağrılıyor — yani bir istek
  // düştüğünde dispatcher "Henüz transfer yok" görüyor ve az önce yaptığı
  // işlemin kayıtları sildiğini sanabiliyordu.
  const load = () => api.listReservations()
    .then(d => { setReservations(d || []); setLoadError(null); })
    .catch(e => setLoadError(e?.message || String(e)));
  useEffect(() => { load(); }, []);

  // Ana Sayfa'daki "TK1234 uçuşunu canlı ara" bağlantısından gelindiyse formu
  // O NUMARAYLA aç ve canlı sorguyu hemen çalıştır.
  //
  // NEDEN: Ana Sayfa araması yalnız KAYITLI transferleri tarar; kayıtlı olmayan
  // bir uçuş numarası yazan kullanıcı boş liste görüp "arama çalışmıyor"
  // sanıyordu ve o sayfada canlı sorguya giden hiçbir yol yoktu. Numarayı
  // ikinci kez yazdırmak, açtığımız yolu yeniden çıkmaz yapardı.
  useEffect(() => {
    const flight = searchParams.get('flight');
    if (!flight) return;
    const val = flight.toUpperCase().replace(/\s+/g, '');
    setForm({ ...EMPTY, flight_number: val });
    setShowForm(true);
    setError('');
    handleFlightSearch(val, { force: true });
    // Adres çubuğunu ROUTER ÜZERİNDEN temizle: sayfa yenilenince form tekrar
    // açılmasın. `window.history.replaceState({}, ...)` kullanılmıştı ama o,
    // react-router'ın geçmiş girdisindeki `{usr, key, idx}` durumunu siliyor
    // ve geri/ileri düğmesi ile `navigate(-1)` yanlış yere gidebiliyordu.
    setSearchParams({}, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // `force`: kullanıcı YAZARKEN değil, açıkça "bu uçuşu ara" dediğinde çağrılır.
  //
  // İKİ FARKLI SORU, iki farklı eşik — ve bu bilinçli:
  //   • yazarken (force yok): "her tuş vuruşunda sağlayıcıya gitmeli miyim?"
  //     Hayır — 4 karakter altı elenir, yoksa "TK1234" yazan biri dört ayrı
  //     sorgu tetikler ve ücretsiz kota (ayda ~1700 birim) boşa yanar.
  //   • parametreyle gelindiğinde (force): "kullanıcı bu numarayı ARAMAMI
  //     İSTEDİ mi?" Evet — tek bir istek, tuş vuruşu değil.
  // Eşiği ortak yapmak ilk bakışta temiz görünüyor ama YANLIŞ olurdu: uzunluk
  // kapısı kota içindir, `looksLikeFlightNumber` niyet tahminidir.
  //
  // KAPI OLMADAN NE OLUYORDU: Ana Sayfa "TK1 uçuşunu canlı ara" butonu basıyor
  // (3 karakter kabul ediliyor, backend de kabul ediyor), kullanıcı basıyor,
  // form açılıyor ve HİÇBİR İSTEK GİTMİYOR — şikâyet bir ekran ileri taşınmış
  // oluyordu.
  async function handleFlightSearch(number, { force = false } = {}) {
    if (!force && number.length < 4) { setFlightInfo(null); setFlightMiss(false); return; }
    setSearching(true);
    setFlightMiss(false);
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
      // BULUNAMADI GERİ BİLDİRİMİ ŞART. Önceden hata sessizce yutuluyordu ve
      // ekranda hiçbir iz kalmıyordu: kullanıcı "canlı ara"ya basıp boş form
      // görüyor, "yine tepki vermedi" diyordu. Mobil bunu zaten doğru yapıyor
      // (SearchScreen → notFoundTitle); iki istemci ayrışmıştı.
      setFlightInfo(null);
      setFlightMiss(true);
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
        transfer_type:    form.transfer_type,
        // Uçuşsuzda uçuş alanları HİÇ gönderilmez. Kullanıcı önce uçuşlu
        // seçip numara yazıp sonra türü değiştirdiyse formda eski değer
        // duruyor olabilir; backend zaten yok sayar ama burada da temizlemek
        // "gönderdiğim şey kaydedildi mi" belirsizliğini ortadan kaldırır.
        flight_number:    isFlight ? form.flight_number : null,
        pnr:              isFlight ? (form.pnr || null) : null,
        // Liste artık yolcu adını başlık yapıyor; alan gönderilmezse backend
        // onu uçuş numarasıyla doldurur ve her kart 'girilmemiş' görünür.
        // Uçuşsuzda ZORUNLU — kaydın tek etiketi odur.
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

  const openForm = () => { setShowForm(true); setError(''); setForm(EMPTY); setFlightInfo(null); setFlightMiss(false); };

  // EYLEM hatası FORM hatasından AYRI bir state'te durur.
  //
  // NEDEN: `error` YALNIZ form modalinin içinde render ediliyor. `handleDelete`
  // ona yazıyordu ama modal kapalı olduğu için mesaj hiçbir zaman görünmüyordu;
  // diğer üç eylemde `try/catch` HİÇ YOKTU — istek reddedilirse yakalanmamış
  // promise reddi ve ekranda SIFIR iz. Dispatcher "Onayla"ya basar, uç 403/409
  // döner, kayıt `pending` kalır, hiçbir şey söylenmez, bir daha basar.
  //
  // Ortak sarmalayıcı: her eylem aynı yoldan geçsin. Beşinci bir eylem
  // eklendiğinde `try/catch` yazmayı unutmak, kuralı yeniden bozmak demek.
  async function runAction(label, fn) {
    // UÇUŞ SIRASINDA DA İZ BIRAK. Kilit yokken yavaş şebekede: dispatcher
    // "Onayla"ya basar → eski hata silinir, yeni bir şey belirmez, düğme
    // aktif kalır → ikinci kez basar (iki PATCH). "İşlem sürüyor" ile
    // "hiçbir şey olmadı" yine ayırt edilemez hâle gelir.
    if (busyAction) return;
    setBusyAction(label);
    try {
      setActionError('');
      await fn();
    } catch (err) {
      // Sunucunun KENDİ cümlesi basılır: "Sunucu hatası" 403'ü, 409'u ve
      // 500'ü aynı torbaya atar ve hangi kapının kapandığını söylemez.
      setActionError(`${label}: ${err.message}`);
      // CEVAP, SORUNUN SORULDUĞU YERDE DOĞMALI. Şerit sayfanın tepesinde;
      // 30 transferlik listede aşağıdaki bir karta basan dispatcher için
      // ekranda GÖRÜNEN hiçbir şey değişmezdi ve şikâyet yine "sildim, tepki
      // vermedi" olurdu. Bu, projenin iki tam tur yaktığı kendi dersi.
      errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    } finally {
      setBusyAction('');
    }
    // Her hâlükârda tazele — 404 bile olsa kaydın gitmiş olması istenen
    // sonuçtur ve liste gerçeği göstermelidir.
    load();
  }

  async function handleDelete(id) {
    if (!confirm('Bu uçuşu takip listesinden kaldırmak istiyor musunuz?')) return;
    await runAction('Transfer silinemedi', () => api.deleteReservation(id));
  }

  async function handleComplete(id) {
    await runAction('Tamamlandı olarak işaretlenemedi',
      () => api.updateReservation(id, { status: 'completed' }));
  }

  async function handleApprove(id) {
    await runAction('Talep onaylanamadı',
      () => api.updateReservation(id, { status: 'active' }));
  }

  async function handleReject(id) {
    if (!confirm('Bu talebi reddetmek istiyor musunuz?')) return;
    await runAction('Talep reddedilemedi',
      () => api.updateReservation(id, { status: 'cancelled' }));
  }

  async function copyBookingLink() {
    try {
      const { token } = await api.getBookingLink();
      const url = `${window.location.origin}/request/${token}`;
      await navigator.clipboard.writeText(url);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    } catch (err) {
      // `alert()` DEĞİL: kapatılınca iz kalmaz ve kullanıcı "bastım, bir şey
      // olmadı" der — projenin kendi sessiz-desen listesinde (CLAUDE.md).
      setActionError(`Talep linki alınamadı: ${err.message}`);
      errorRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
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

      {/* HATA ŞERİDİ listenin ÜSTÜNDE. `load()` silme/ekleme/onaylama sonrası
          da koşuyor: sessiz kalırsa dispatcher az önceki işleminin kayıtları
          sildiğini sanar. Sunucunun kendi cümlesi basılır. */}
      {loadError && (
        <div className="mb-6 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertTriangle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-bad-800">
            <span className="font-semibold">Transferler yüklenemedi — aşağıdaki liste eksik olabilir.</span>{' '}
            <span className="break-words">{loadError}</span>
          </p>
        </div>
      )}

      {/* EYLEM hatası — sil / tamamla / onayla / reddet. Yükleme hatasından
          AYRI kutu: "liste eksik olabilir" ile "az önceki işlem yapılamadı"
          bambaşka iki cümle ve dispatcher'ın alacağı aksiyon da farklı.
          KALICI: kapatma düğmesiyle kapanır, kendi kendine kaybolmaz.
          `role="alert"` — ekran okuyucu, sayfanın altındaki bir karta basıp
          yukarıdaki şeridi hiç görmeyen kullanıcıyı da uyarsın. */}
      {actionError && (
        <div ref={errorRef} role="alert" className="mb-6 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertTriangle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="flex-1 text-sm text-bad-800 break-words">{actionError}</p>
          <button
            type="button"
            onClick={() => setActionError('')}
            aria-label="Hatayı kapat"
            className="shrink-0 text-bad-800 hover:bg-bad-600/15 rounded-control p-0.5"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {showBulk && <Suspense fallback={null}><BulkImportModal onClose={() => setShowBulk(false)} onDone={load} /></Suspense>}

      {/* Onay Bekleyen Talepler (otel/acenta) */}
      {pending.length > 0 && (
        <div className="mb-6 bg-warn-50 border border-warn-600/20 rounded-card p-4">
          <h2 className="text-sm font-semibold text-warn-800 flex items-center gap-2 mb-3">
            <Inbox size={16} /> Onay Bekleyen Talepler ({pending.length})
          </h2>
          <div className="space-y-2">
            {pending.map(r => (
              <div key={r.id} className="bg-surface border border-warn-600/20 rounded-card p-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Başlık aynı kuraldan geçer: uçuşsuz talepte
                        flight_number NULL'dur ve başlık boş kalırdı. */}
                    <span className={`font-bold text-ink ${showFlightLine(r) || !isFlightTransfer(r) ? '' : 'font-mono'}`}>{cardTitle(r)}</span>
                    {r.source && <span className="text-xs bg-warn-50 text-warn-800 px-2 py-0.5 rounded-full">{r.source}</span>}
                  </div>
                  <div className="text-xs text-ink-muted mt-0.5 flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1"><Calendar size={11} />{formatPickup(r.scheduled_pickup)}</span>
                    {showFlightLine(r) && <span className="font-mono">{r.flight_number}</span>}
                    {!isFlightTransfer(r) && <span className="flex items-center gap-1"><Car size={11} />Transfer</span>}
                    {r.passenger_phone && <span>{r.passenger_phone}</span>}
                  </div>
                  {r.notes && <p className="text-xs text-ink-muted mt-0.5">{r.notes}</p>}
                </div>
                <button onClick={() => handleApprove(r.id)} className="flex items-center gap-1 bg-ok-600 hover:bg-ok-800 text-onfill rounded-control px-3 py-1.5 text-xs font-semibold">
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
          <div className="bg-surface rounded-card shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">{isFlight ? 'Uçuş Takibe Al' : 'Transfer Ekle'}</h2>
              <button onClick={() => setShowForm(false)} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex items-start gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <TransferTypeToggle
                value={form.transfer_type}
                onChange={(t) => {
                  setForm(f => ({ ...f, transfer_type: t }));
                  setFlightMiss(false);
                  // Tür değişince önceki türün uçuş önerisi ekranda kalmamalı:
                  // uçuşsuza geçen kullanıcı "TK123 · IST → AYT" kutusunu
                  // görmeye devam ederse kaydın hâlâ uçuşa bağlı olduğunu sanır.
                  setFlightInfo(null);
                }}
              />

              {/* Uçuş Numarası — YALNIZ uçuşlu transferde */}
              {isFlight && (
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
                    className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm font-mono font-semibold tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    required autoFocus
                  />
                  {searching && <p className="text-xs text-ink-muted mt-1">Uçuş aranıyor...</p>}
                  {flightInfo && !searching && (
                    <div className="mt-2 px-3 py-2 bg-ok-50 border border-ok-600/20 rounded-control text-xs text-ok-800 flex items-center gap-2">
                      <CheckCircle size={13} className="text-ok-600 shrink-0" />
                      <span><strong>{flightInfo.airline}</strong> · {flightInfo.departure_airport} → {flightInfo.arrival_airport}</span>
                    </div>
                  )}
                  {/* BULUNAMADI DA BİR CEVAPTIR. Sessiz kalmak, kullanıcının
                      "tepki vermiyor" dediği şeyin ta kendisi: sorgu koştu,
                      sonuç yok ve ekranda hiçbir iz kalmıyordu. Ölümcül değil —
                      uçuş bilgisi opsiyonel, kayıt elle girilerek açılabilir;
                      bunu da söylüyoruz ki kullanıcı takılıp kalmasın. */}
                  {flightMiss && !searching && (
                    <div className="mt-2 px-3 py-2 bg-warn-50 border border-warn-600/20 rounded-control text-xs text-warn-800 flex items-start gap-2">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>Bu numarayla canlı uçuş bulunamadı. Numarayı kontrol edin ya da bilgileri elle girip kaydedin — takip, uçuş yayına girince kendiliğinden başlar.</span>
                    </div>
                  )}
                </div>
              )}

              {/* YOLCU — listenin başlığı artık bu. Alan formda yoktu:
                  webden eklenen her transfer "Yolcu adı girilmemiş" olarak
                  görünüyordu, çünkü backend passenger_name'i uçuş numarasıyla
                  dolduruyor. Mobil bu alanı zaten gönderiyordu; iki istemci
                  ayrışmış durumdaydı. */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">
                    Yolcu Adı {!isFlight && <span className="text-bad-600">*</span>}
                  </label>
                  <input
                    value={form.passenger_name}
                    onChange={e => setForm(f => ({ ...f, passenger_name: e.target.value }))}
                    placeholder="Anna Schmidt"
                    className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    // Uçuşsuzda kaydın TEK etiketi yolcu adıdır (uçuş numarası
                    // yok). Boş bırakılırsa liste adsız bir satır gösterir ve
                    // aramada bulunamaz — backend de 400 döner, kapıyı burada
                    // da tutmak kullanıcıyı sunucuya gidip gelmekten kurtarır.
                    required={!isFlight}
                    autoFocus={!isFlight}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Yolcu Telefonu</label>
                  <input
                    value={form.passenger_phone}
                    onChange={e => setForm(f => ({ ...f, passenger_phone: e.target.value }))}
                    placeholder="0532 111 22 33"
                    className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">{isFlight ? 'Buluşma Noktası' : 'Alış Noktası'}</label>
                <input
                  value={form.meeting_point}
                  onChange={e => setForm(f => ({ ...f, meeting_point: e.target.value }))}
                  placeholder={isFlight ? 'Dış Hatlar Çıkış · 4 numaralı kapı' : 'Hilton Bomonti · Lobi'}
                  className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              {/* Uçuş Tarihi & Saati */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">
                  <Calendar size={13} className="inline mr-1 text-brand-600" />
                  {isFlight ? 'Tahmini Varış Tarihi & Saati' : 'Alış Tarihi & Saati'} <span className="text-bad-600">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={form.scheduled_pickup}
                  onChange={e => setForm(f => ({ ...f, scheduled_pickup: e.target.value }))}
                  min={nowLocal()}
                  className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  required
                />
                {/* Vaat türe göre DEĞİŞİR. Uçuşsuz transferde uçuş takibi
                    yoktur (sağlayıcıya sorulacak bir uçuş yok); eski metni
                    olduğu gibi bırakmak "inince bildirim gelir" diye bir söz
                    verirdi ve o söz hiç tutulmazdı. */}
                <p className="text-xs text-ink-muted mt-1 flex items-center gap-1">
                  <Bell size={11} className="shrink-0" />
                  {isFlight
                    ? 'Uçuştan 2 saat önce hatırlatma, inince/rötar olunca bildirim gönderilir.'
                    : 'Alıştan 2 saat önce hatırlatma gönderilir. Uçuş takibi yapılmaz.'}
                </p>
              </div>

              {/* PNR — havayolu rezervasyon kodudur, uçuşsuz transferde
                  karşılığı yoktur. Gösterilseydi dispatcher doldurulacak bir
                  alan sanıp arardı. */}
              {isFlight && (
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">PNR <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                  <input
                    value={form.pnr}
                    onChange={e => setForm(f => ({ ...f, pnr: e.target.value.toUpperCase().replace(/\s/g, '') }))}
                    placeholder="ABC123"
                    className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  />
                </div>
              )}

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
                  className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Tahmini Varış <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                <input
                  type="datetime-local"
                  value={form.scheduled_dropoff}
                  onChange={e => setForm(f => ({ ...f, scheduled_dropoff: e.target.value }))}
                  min={form.scheduled_pickup || nowLocal()}
                  className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              {/* Not */}
              <div>
                <label className="block text-sm font-semibold text-ink-soft mb-1">Not <span className="text-ink-muted font-normal">(yolcu adı, VIP vb.)</span></label>
                <input
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder="Ahmet Yılmaz, Oda 204..."
                  className="w-full border border-surface-inputborder rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
                <button type="submit" disabled={submitting} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-onfill rounded-card px-4 py-2.5 text-sm font-semibold transition-colors">
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
          <h2 className="text-xs font-semibold text-ink-muted mb-3">{label} ({flights.length})</h2>
          <div className="space-y-3">
            {flights.map(r => <FlightCard key={r.id} r={r} onDelete={handleDelete} onComplete={handleComplete} onShowSign={setSignFor} onShowPay={setPayFor} onAssign={setAssignFor} />)}
          </div>
        </div>
      ))}

      {/* Geçmiş */}
      {past.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-ink-muted mb-3">Geçmiş</h2>
          <div className="space-y-2 opacity-60">
            {past.map(r => <FlightCard key={r.id} r={r} onDelete={handleDelete} isPast />)}
          </div>
        </div>
      )}

      {/* Hata varken BOŞ DURUM BASILMAZ — mobil `FlightListScreen` ile aynı
          karar. "Henüz uçuş yok / İlk Uçuşu Ekle" ile "okuyamadım" aynı ekranı
          üretirse dispatcher kayıtlarının silindiğini sanar; hata şeridi
          yukarıda zaten neyin olduğunu söylüyor. */}
      {reservations.length === 0 && !loadError && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 bg-brand-50 rounded-card flex items-center justify-center mb-4">
            <Plane size={28} className="text-brand-600" />
          </div>
          <p className="text-ink-soft font-semibold mb-1">Henüz uçuş yok</p>
          <p className="text-sm text-ink-muted mb-5">Gelecekteki uçuşları önceden ekleyin.</p>
          <button onClick={openForm} className="bg-brand-600 text-onfill rounded-card px-5 py-2.5 text-sm font-semibold hover:bg-brand-700 transition-colors">İlk Uçuşu Ekle</button>
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
  // Kart içi hata: şoför linki üretilemezse cevap BU kartta görünür.
  const [driverErr, setDriverErr] = useState('');
  const ls   = r.latest_status;
  // `fs` artık yalnız BİR SORUYA cevap veriyor: canlı uçuş verisi VAR MI?
  // (Aşağıda "yaklaşıyor" çanının şeritte tekrar etmemesi için kullanılır.)
  const fs   = !!ls?.flight_status;
  const rs   = RES_STATUS[r.status] || RES_STATUS.active;
  const Icon = (ls && FLIGHT_ICON[ls.flight_status]) || Clock;

  // ŞERİT: artık ortak `StatusStrip` bileşeninde — tür/durum kararını o veriyor.
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
    } catch (err) {
      // `alert()` DEĞİL (kapatılınca iz kalmaz) ve sayfa şeridine de DEĞİL:
      // bu hata KARTA ait, cevabı da kartın içinde doğmalı. Dispatcher 30
      // transferlik listede aşağıdaki bir karttaysa sayfanın tepesindeki
      // şeridi hiç görmez. Sunucunun kendi cümlesi korunur.
      setDriverErr(err?.message || 'Bilinmeyen hata');
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
  // Geçmiş kartta uyarı basılmaz — sayım kuralı ORTAK (lib/transfer.js), üstüne
  // bu ekrana özel `!isPast` kapısı biner.
  const needsDriver = !isPast && driverPending(r);
  // Yolcu adı yoksa başlık uçuş numarasına düşer; o durumda alt satırda
  // TEKRAR yazmak aynı bilgiyi iki kez göstermek olur. Uçuşsuz transferde
  // uçuş satırı HİÇ basılmaz — kural lib/transfer.js'te, çünkü aynı karar
  // Ana Sayfa listesinde de veriliyor ve ikisi ayrışırsa aynı transfer iki
  // ekranda farklı görünür.
  const showFlight = showFlightLine(r);

  return (
    <div className={`bg-surface border rounded-card overflow-hidden transition-all ${
      isPast ? 'border-surface-border'
        : needsDriver ? 'border-bad-600 shadow-card'
        : isClose ? 'border-brand-600/40 shadow-card'
        : 'border-surface-border shadow-card'
    }`}>
      {/* DURUM ŞERİDİ — "Kart C" anatomisi (design/yon-secimi/KARAR.md), mobil
          TransferCard ile aynı. Canlı uçuş verisi varsa DURUMU söyler
          (Havada/İndi/Rötarlı), yoksa TÜRÜ (Havalimanı/Transfer).
          Saat ve tarih artık sabit genişlikli bir sol sütunda değil: mobilde
          o sütun "13:00"ü ikiye bölüyordu, iki platform aynı kuralı taşısın. */}
      {/* Şerit ORTAK bileşende (components/ui/StatusStrip): şoför panosu ve
          taşeron iş linki de aynısını kullanıyor. Üçü ayrı yazılıyken wording
          ayrışmıştı — burada "İndi" derken panoda "Uçak indi" yazıyordu.
          Bu ekrana ÖZEL iki ek şeridin içine `children` ile giriyor. */}
      {/* Ekler ŞERİDİN KENDİ RENGİNİ devralır (`text-warn-800` YAZMA): şerit
          artık dolu renkli olabiliyor ve sabit bir amber, koyu petrol/yeşil
          zeminde okunmaz. Renk zaten durumu söylüyor; notun ayrı bir hue'ya
          ihtiyacı yok. Mobilde aynı sebeple `notes` dizeleri kullanılıyor. */}
      <StatusStrip r={r}>
        {ls?.arrival_delay > 0 && (
          <span className="text-xs font-medium whitespace-nowrap">+{ls.arrival_delay} dk rötar</span>
        )}
        {isClose && !fs && (
          <span className="inline-flex items-center gap-1 text-xs font-medium whitespace-nowrap">
            <Bell size={11} aria-hidden="true" /> {Math.round(hoursLeft)}s
          </span>
        )}
      </StatusStrip>

      <div className="flex items-center gap-3 px-4 py-3">
        {/* Baş harf rozeti — mobil kartla aynı. Bilgi taşımaz, satıra insani
            bir çapa verir ve boş bir avatar kutusundan iyidir. */}
        <div className="w-9 h-9 rounded-full bg-surface-alt flex items-center justify-center shrink-0">
          <span className="text-xs font-bold text-ink-soft">{initials(cardTitle(r))}</span>
        </div>

        {/* Bilgiler */}
        <div className="flex-1 min-w-0">
        <div className="font-bold text-ink truncate">
          {cardTitle(r)}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-xs text-ink-muted mt-0.5">
          {showFlight
            ? <span className="flex items-center gap-1"><Icon size={11} />{r.flight_number}</span>
            /* Uçuşsuz transferde uçuş satırının yerini türün kendisi alır:
               boş bırakılırsa kart "eksik veri" gibi durur ve dispatcher
               uçuş numarasının girilmediğini sanıp aramaya çıkar. */
            : !isFlightTransfer(r) && <span className="flex items-center gap-1"><Car size={11} />Transfer</span>}
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

      {/* Kart içi hata — cevabın sorunun sorulduğu yerde doğması için.
          `alert()` ile basılıyordu: kapatılınca iz kalmıyor ve dispatcher
          linkin oluşup oluşmadığını bilmiyordu. Dokunmayla kapanır. */}
      {driverErr && (
        <button
          type="button"
          onClick={() => setDriverErr('')}
          role="alert"
          className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-start gap-2 rounded-control bg-bad-50 px-3 py-2 text-left"
        >
          <AlertCircle size={14} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <span className="text-xs text-bad-800 break-words">
            Şoför linki oluşturulamadı: {driverErr}
          </span>
        </button>
      )}

      {/* TEK EYLEM SATIRI — Kart C. Kim sürüyor ve iş nerede: dispatcher'ın
          panoda görmesi gereken iki şey. Şoför YOKSA satır uyarı zeminlidir ve
          tıklanabilir; varsa nötr. Eskiden ikisi de aynı ağırlıktaydı ve
          operasyonun tek gerçek alarmı gövdenin içinde kaybolan bir çip gibi
          duruyordu. */}
      {!isPast && (
        needsDriver ? (
          <button
            onClick={() => onAssign && onAssign(r)}
            className="w-full flex items-center gap-2 px-4 min-h-[44px] bg-bad-50 border-t border-bad-600/20 text-left hover:bg-bad-50/70 transition-colors"
          >
            <AlertTriangle size={14} className="text-bad-800 shrink-0" aria-hidden="true" />
            <span className="text-sm font-semibold text-bad-800 grow">Şoför atanmadı</span>
            <span className="text-sm font-bold text-bad-800 underline shrink-0">Ata</span>
          </button>
        ) : (hasDriver(r) || jobBadge(r)) ? (
          <div className="flex items-center gap-2 px-4 min-h-[44px] border-t border-surface-alt">
            <UserCheck size={14} className="text-ink-soft shrink-0" aria-hidden="true" />
            {/* "Atanmış mı" ölçütü ad DEĞİL atamanın kendisidir: profilinde adı
                olmayan bir üyeye atandığında kart yanlışlıkla "atanmadı" derdi. */}
            <span className="text-sm font-semibold text-ink truncate">
              {/* Aşağıdaki satır "şoförü var mı" SORMUYOR — o karar yukarıda
                  hasDriver(r) ile verildi. Burada hangi ETİKETİN basılacağı
                  seçiliyor: adı varsa ad, yoksa "atandı ama adı girilmemiş".
                  Bu yüzden şekil kapısından muaf; işaret ifadeyle AYNI satırda
                  olmak zorunda (muafiyet satır bazında çalışır). */}
              {/* driver-def-ok */ r.driver_name || (r.assigned_member_id ? 'Şoför atandı (adı girilmemiş)' : 'Şoför atanmadı')}
            </span>
            {/* Rozet rezervasyondan türetilir: uçuşsuz transferde
                "Havalimanında" yanlış bilgidir, "Alış noktasında" denir. */}
            {jobBadge(r) && (
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${jobBadge(r).cls}`}>
                {jobBadge(r).label}
              </span>
            )}
          </div>
        ) : null
      )}
    </div>
  );
}
