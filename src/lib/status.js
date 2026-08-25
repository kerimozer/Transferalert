// Durum → rozet etiket/renk eşlemesi — tek kaynak.
// Yeni bir rezervasyon/uçuş durumu eklerken SADECE burayı güncelle;
// sayfalar bu haritaları import eder (sayfaya özel etiket gerekiyorsa
// spread ile üzerine yazılır, ReservationsPage'deki "Takipte" gibi).
import { isFlightTransfer } from './transfer';

export const RES_STATUS_BADGE = {
  active:    { label: 'Aktif',      cls: 'bg-brand-50 text-brand-700' },
  completed: { label: 'Tamamlandı', cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',      cls: 'bg-bad-50 text-bad-800' },
};

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
