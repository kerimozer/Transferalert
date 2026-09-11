// Durum → rozet etiket/renk eşlemesi — tek kaynak.
// Yeni bir rezervasyon/uçuş durumu eklerken SADECE burayı güncelle;
// sayfalar bu haritaları import eder (sayfaya özel etiket gerekiyorsa
// spread ile üzerine yazılır, ReservationsPage'deki "Takipte" gibi).
// UZANTI AÇIK YAZILIR (`./transfer.js`): Vite uzantısız hâli de çözer ama Node
// çözmez, ve `scripts/test-tokens.mjs` bu modülü DAVRANIŞ testi için doğrudan
// import ediyor. Uzantısızken kapı modülü hiç yükleyemiyordu.
import { isFlightTransfer } from './transfer.js';

export const RES_STATUS_BADGE = {
  active:    { label: 'Aktif',      cls: 'bg-brand-50 text-brand-700' },
  completed: { label: 'Tamamlandı', cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',      cls: 'bg-bad-50 text-bad-800' },
};

// DURUM ŞERİDİ — kartın üstündeki tam genişlik bandı. `FLIGHT_BADGE`ten AYRI
// ve bu bilinçli: o bir ROZET reçetesi (küçük çip, soft zemin) ve Ana Sayfa
// listesinde öyle kullanılıyor. Şerit büyük ve yalnız başına duruyor.
//
// NEDEN DOLU DEĞİL (2026-09-09 — bir tur önce DOLUYDU, geri alındı):
// dolu bant tek bir kartta harika, alt alta ON kartta dayanılmaz. Sayfa zemini
// L* 97.7 iken şeritler L* 36–43'te oturuyordu; göz artık satırları değil
// BANTLARI okuyordu.
//
// DİKKAT — ŞİKÂYET HARFİ HARFİNE DOĞRU DEĞİLDİ: "tonlar birbirine yakın"
// denmişti ama ölçüm dolu tonların ΔE 27.2 ile zaten çok uzak olduğunu
// gösterdi. Sorun AYRIM değil AĞIRLIKTI; tonları daha da uzaklaştırmak
// (ilk refleks) yanlış hastalığı tedavi ederdi.
//
// PEKİ NEDEN ESKİ `*-50` TONLARINA DÖNÜLMÜYOR: ölçüldü ve ELENDİ — Havada ↔
// İndi ΔE 4.1, yani doldurmadan önceki şikâyetin ta kendisi. Bu palet ikisini
// birden tutuyor: sayfa ağırlığı 5.35–7.08 → 1.19–1.27 ve en yakın çift 7.8.
//
// ETİKET BURADA TEKRARLANMAZ: `FLIGHT_BADGE`ten okunur. İki harita iki farklı
// ŞEYİ (çip rengi / şerit rengi) tutar, aynı METNİ değil — metin çoğaltılsaydı
// bu turda temizlediğimiz "İndi" ↔ "Uçak indi" ayrışması geri gelirdi.
//
// Metin kontrastları: Havada 8.77 · İndi 6.21 · İptal 6.27 · Yönlendi 7.18 ·
// Planlandı 5.56 — hepsi AA. Kapı: scripts/test-tokens.mjs (mobil ikizinde de).
export const FLIGHT_STRIP = {
  landed:    'bg-strip-landed text-strip-oliveink',
  cancelled: 'bg-strip-cancelled text-bad-800',
  active:    'bg-strip-air text-brand-700',
  scheduled: 'bg-surface-quiet text-strip-sandink',
  diverted:  'bg-strip-diverted text-strip-amberink',
};

// BİTEN işin şeridi — AYNI anahtarlar, sakin tonlar. Tek griye çökmüyor:
// listesi tamamen tamamlanmış bir firmada o kural her şeridi aynı yapıyor
// ve "hangi iş iptal olmuştu" sorusunu cevapsız bırakıyordu. Sesi kısılır,
// kimliği kalır. Mobil ikizi: theme.js → STRIP_DONE.
export const FLIGHT_STRIP_DONE = {
  landed:    'bg-done-landed text-done-landedink',
  cancelled: 'bg-done-cancelled text-done-cancelledink',
  active:    'bg-done-air text-done-airink',
  scheduled: 'bg-done-scheduled text-ink-soft',
  diverted:  'bg-done-diverted text-done-divertedink',
};

// TÜR TONU — canlı uçuş verisi YOK. Havalimanı ve şehir içi transfer AYNI tonu
// paylaşır (ikisi de aynı şeyi söyler), ayrımı ikon taşır. Ayrı iki nötr
// denendi ve aralarındaki fark ΔE 3.0'dı — gözle ayrılmıyordu.
export const TYPE_TONE = 'text-ink-soft bg-surface-neutral';

// ŞERİT TONU — "bu rezervasyon hangi tonu alır" sorusunun TEK cevabı.
//
// NEDEN AYRI BİR FONKSİYON: kural İKİ DEPODA kopyalanmış durumda (mobil ikizi
// `mobile/src/theme.js` → `stripTone`) ve satır-içi bırakıldığında hiçbir kapı
// onu göremiyordu — denetimde koşul kaldırıldı ve TÜM kapılar yeşil geçti.
// Saf fonksiyon olunca DAVRANIŞI test edilebiliyor (scripts/test-tokens.mjs [6]).
//
// BİTEN İŞTE ŞERİT SUSAR: uçuşun inmiş olması TAMAMLANMIŞ bir transfer için
// eski haberdir; kart "Tamamlandı" rozetini zaten taşıyor. Bağırma hakkı
// yalnız EYLEM BEKLEYEN işlerde. `cancelled` bilinçli olarak KAPSAM DIŞI:
// iptal hâlâ dikkat isteyen bir durumdur, biten iş değildir.
export function stripTone(r) {
  const fs = r?.latest_status?.flight_status;
  if (!fs) return TYPE_TONE;
  // Biten iş TEK GRİYE değil, KENDİ renginin sakin hâline düşer.
  if (r?.status === 'completed') return FLIGHT_STRIP_DONE[fs] || FLIGHT_STRIP_DONE.scheduled;
  return FLIGHT_STRIP[fs] || FLIGHT_STRIP.scheduled;
}

export const FLIGHT_BADGE = {
  landed:    { label: 'İndi',          cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',         cls: 'bg-bad-50 text-bad-800' },
  active:    { label: 'Havada',        cls: 'bg-brand-50 text-brand-700' },
  scheduled: { label: 'Planlandı',     cls: 'bg-surface-alt text-ink-soft' },
  diverted:  { label: 'Yönlendirildi', cls: 'bg-warn-50 text-warn-800' },
};

// ── İŞ AŞAMASI ETİKETLERİ — TEK KAYNAK ────────────────────────────────────
// Backend sözleşmesi: backend/src/config/constants.js JOB_STATUSES.
// null = şoför henüz başlamadı; o durumda rozet gösterilmez.
//
// NEDEN BURADA TOPLANDI: aynı dört etiket ÜÇ dosyada tekrarlanıyordu
// (lib/status.js, JobPage, DriverPortalPage) ve bu yüzden ayrı bir CI kapısı
// (scripts/test-job-labels.mjs) üçünü birbirine karşı doğrulamak zorundaydı.
// Türe göre varyant eklemek DÖRDÜNCÜ bir kopya demekti; kopyayı çoğaltmak
// yerine kaynağı teke indirdik.
//
// `p2p*` alanları YALNIZ farklı olan aşamada bulunur. Uçuşsuz transferde
// (otel→otel, şehir içi) "havalimanı" diye bir yer yoktur — şoför otelin
// önündedir. Şoföre "Havalimanına Geldim" butonu göstermek onu sistemin
// işini anlamadığına ikna eder.
//
// ÜÇ SES TONU, bilinçli olarak ayrı:
//   action → şoförün BASACAĞI buton, birinci tekil  ("Yola Çıktım")
//   state  → şoförün gördüğü rozet, kısa            ("Yolda")
//   view   → DIŞARIDAN bakanın gördüğü, üçüncü tekil ("Şoför yolda")
//            — otel/acenta portalı bunu okur.
// Web dispatcher panosu `jobBadge` üzerinden `state` okur (dar sütunda kısa
// etiket gerekiyor); mobil kartı `view` okur. Ayrım bilinçli, ama iki
// platformun AYNI rol için farklı ton göstermesi açık bir madde.
export const JOB_LABELS = {
  en_route:   { action: 'Yola Çıktım',          state: 'Yolda',          view: 'Şoför yolda',           cls: 'bg-brand-50 text-brand-700' },
  at_airport: { action: 'Havalimanına Geldim',  state: 'Havalimanında',  view: 'Şoför havalimanında',   cls: 'bg-accent-50 text-accent-800',
                p2pAction: 'Alış Noktasındayım', p2pState: 'Alış noktasında', p2pView: 'Şoför alış noktasında' },
  picked_up:  { action: 'Yolcuyu Aldım',        state: 'Yolcu alındı',   view: 'Yolcu alındı',          cls: 'bg-ok-50 text-ok-800' },
  completed:  { action: 'Transferi Tamamladım', state: 'Tamamlandı',     view: 'Tamamlandı',            cls: 'bg-ok-50 text-ok-800' },
};

// "Uçuşsuz mu?" sorusuna İKİNCİ bir cevap üretmiyoruz: lib/transfer.js tek
// kaynak. Burada yerel bir kopya vardı ve kuralı DAHA GEVŞEKTİ (yalnız türe
// bakıyordu, numaranın dolu olmasına bakmıyordu) — aynı dosyada uçuş satırı
// `isFlightTransfer` ile gizlenirken rozet `isP2P` ile "Havalimanında"
// basabiliyordu. "Kartta uçuşsuz, rozette uçuşlu" tam olarak bu ayrışmadır.
const isP2P = (res) => !isFlightTransfer(res);

// Şoförün BASACAĞI butonun metni (birinci tekil: "Yola Çıktım").
export function jobAction(stage, res) {
  const l = JOB_LABELS[stage];
  if (!l) return stage;
  return (isP2P(res) && l.p2pAction) || l.action;
}

// Mevcut aşamanın rozet metni — kısa, dar sütuna sığar ("Yolda").
export function jobState(stage, res) {
  const l = JOB_LABELS[stage];
  if (!l) return stage;
  return (isP2P(res) && l.p2pState) || l.state;
}

// DIŞARIDAN bakanın gördüğü metin (otel/acenta portalı): üçüncü tekil.
export function jobView(stage, res) {
  const l = JOB_LABELS[stage];
  if (!l) return stage;
  return (isP2P(res) && l.p2pView) || l.view;
}

// Dispatcher panosundaki rozet — etiket + renk birlikte.
export function jobBadge(res) {
  const l = JOB_LABELS[res?.job_status];
  return l ? { label: jobState(res.job_status, res), cls: l.cls } : null;
}
