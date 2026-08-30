// Yolcu takip sayfasının metinleri — BEŞ DİL.
//
// NEDEN BURADA: bu sayfa yolcuya gider ve yolcu Türk olmak zorunda değil.
// `reservations.passenger_lang` beş dili taşıyor (backend PASSENGER_LANGS) ve
// yolcuya giden WhatsApp/SMS metinleri zaten beş dilde yazılıyor
// (mobile/src/passengerMessage.js). Ama takip SAYFASI tamamen Türkçeydi:
// Alman yolcu linke dokunup Türkçe bir sayfa buluyordu.
//
// Panelin geri kalanı Türkçe kalır — o dispatcher'ın ekranı. Burası yolcunun.
import { JOB_LABELS } from './status';

export const LANGS = ['tr', 'en', 'de', 'ru', 'ar'];

// Sağdan sola yazılan diller. `dir` niteliği kök elemana konur.
export const RTL = new Set(['ar']);

export function trackLang(code) {
  return LANGS.includes(code) ? code : 'tr';
}

// Uçuş durumu — sağlayıcının `latest_status.flight_status` değeri.
const FLIGHT = {
  tr: { scheduled: 'Planlandı', active: 'Havada',      landed: 'İndi',     cancelled: 'İptal edildi', diverted: 'Yönlendirildi' },
  en: { scheduled: 'Scheduled', active: 'In the air',  landed: 'Landed',   cancelled: 'Cancelled',    diverted: 'Diverted' },
  de: { scheduled: 'Geplant',   active: 'In der Luft', landed: 'Gelandet', cancelled: 'Storniert',    diverted: 'Umgeleitet' },
  ru: { scheduled: 'По расписанию', active: 'В воздухе', landed: 'Приземлился', cancelled: 'Отменён', diverted: 'Перенаправлен' },
  ar: { scheduled: 'مجدولة',    active: 'في الجو',     landed: 'هبطت',     cancelled: 'ملغاة',        diverted: 'محوّلة' },
};

// Şoför aşamaları. `at_airport` TÜRE DUYARLI: uçuşsuz transferde "havalimanı"
// demek yanlıştır, şoför bir otelin önünde bekliyordur.
//
// SES TONU: yolcu DIŞARIDAN bakan taraftır → üçüncü tekil ("Şoför yolda").
// Şoförün kendi ekranındaki birinci tekil ("Yola Çıktım") buraya GİRMEZ.
//
// stage-i18n-ok — TÜRKÇE BURADA YAZILMAZ, lib/status.js'ten TÜRETİLİR (aşağıda).
// Geri kalan dört dil gerçekten yeni veridir, kopya değil. Aşama listesi
// değişince bu dosyanın sessizce eksik kalmaması `test-job-labels.mjs`
// [5] kontrolüyle güvenceye alınmıştır: her aşama × her dil aranır.
const STAGE = {
  en: { en_route: 'Driver on the way', at_airport: 'Driver at the airport', at_airport_p2p: 'Driver at pickup point', picked_up: 'Passenger picked up', completed: 'Completed' },
  de: { en_route: 'Fahrer unterwegs',  at_airport: 'Fahrer am Flughafen',   at_airport_p2p: 'Fahrer am Treffpunkt',   picked_up: 'Fahrgast abgeholt',  completed: 'Abgeschlossen' },
  ru: { en_route: 'Водитель в пути',   at_airport: 'Водитель в аэропорту',  at_airport_p2p: 'Водитель на месте',      picked_up: 'Пассажир принят',    completed: 'Завершено' },
  ar: { en_route: 'السائق في الطريق',  at_airport: 'السائق في المطار',      at_airport_p2p: 'السائق في نقطة الاستلام', picked_up: 'تم استقبال الراكب',  completed: 'اكتملت' },
};

// Türkçe TEK KAYNAKTAN türetilir — obje literali olarak yazılsaydı beşinci bir
// aşama eklendiğinde status.js güncellenir, burası sessizce eksik kalırdı.
// `view` alanı doğru ses tonudur (üçüncü tekil), `p2pView` türe duyarlı varyant.
STAGE.tr = Object.fromEntries(
  Object.entries(JOB_LABELS).flatMap(([key, l]) =>
    l.p2pView ? [[key, l.view], [`${key}_p2p`, l.p2pView]] : [[key, l.view]]
  )
);

const UI = {
  tr: { notStarted: 'Şoför henüz yola çıkmadı', driver: 'Şoför', plate: 'Plaka', pickup: 'Planlanan alış',
        departure: 'Kalkış', arrival: 'Varış', eta: 'Tahmini varış', delay: 'dk gecikme',
        cancelled: 'Bu transfer iptal edildi', auto: 'Bu sayfa otomatik güncellenir',
        notFound: 'Takip linki bulunamadı veya geçersiz.', loading: 'Yükleniyor...',
        stale: 'Güncellenemedi — son bilgi',
        typeAirport: 'Havalimanı', typeTransfer: 'Transfer' },
  en: { notStarted: 'Driver has not set off yet', driver: 'Driver', plate: 'Plate', pickup: 'Scheduled pickup',
        departure: 'Departure', arrival: 'Arrival', eta: 'Estimated arrival', delay: 'min delay',
        cancelled: 'This transfer was cancelled', auto: 'This page updates automatically',
        notFound: 'Tracking link not found or invalid.', loading: 'Loading...',
        stale: 'Could not refresh — last update',
        typeAirport: 'Airport', typeTransfer: 'Transfer' },
  de: { notStarted: 'Fahrer ist noch nicht losgefahren', driver: 'Fahrer', plate: 'Kennzeichen', pickup: 'Geplante Abholung',
        departure: 'Abflug', arrival: 'Ankunft', eta: 'Voraussichtliche Ankunft', delay: 'Min. Verspätung',
        cancelled: 'Dieser Transfer wurde storniert', auto: 'Diese Seite wird automatisch aktualisiert',
        notFound: 'Tracking-Link nicht gefunden oder ungültig.', loading: 'Wird geladen...',
        stale: 'Aktualisierung fehlgeschlagen — Stand',
        typeAirport: 'Flughafen', typeTransfer: 'Transfer' },
  ru: { notStarted: 'Водитель ещё не выехал', driver: 'Водитель', plate: 'Номер', pickup: 'Запланированная подача',
        departure: 'Вылет', arrival: 'Прилёт', eta: 'Расчётное прибытие', delay: 'мин задержки',
        cancelled: 'Этот трансфер отменён', auto: 'Страница обновляется автоматически',
        notFound: 'Ссылка отслеживания не найдена или недействительна.', loading: 'Загрузка...',
        stale: 'Не удалось обновить — последние данные',
        typeAirport: 'Аэропорт', typeTransfer: 'Трансфер' },
  ar: { notStarted: 'لم ينطلق السائق بعد', driver: 'السائق', plate: 'رقم اللوحة', pickup: 'موعد الاستلام',
        departure: 'المغادرة', arrival: 'الوصول', eta: 'الوصول المتوقع', delay: 'دقيقة تأخير',
        cancelled: 'تم إلغاء هذه الرحلة', auto: 'يتم تحديث هذه الصفحة تلقائياً',
        notFound: 'رابط التتبع غير موجود أو غير صالح.', loading: 'جارٍ التحميل...',
        stale: 'تعذّر التحديث — آخر تحديث',
        typeAirport: 'المطار', typeTransfer: 'نقل' },
};

export function tUi(lang, key) {
  const l = trackLang(lang);
  return UI[l][key] ?? UI.tr[key] ?? key;
}

export function tFlight(lang, status) {
  const l = trackLang(lang);
  return FLIGHT[l][status] || FLIGHT[l].scheduled;
}

// `isP2P` çağıran taraftan gelir — bu dosya tür kuralına İKİNCİ bir cevap
// üretmez, lib/transfer.js tek kaynaktır.
export function tStage(lang, stage, isP2P) {
  const l = trackLang(lang);
  if (stage === 'at_airport' && isP2P) return STAGE[l].at_airport_p2p;
  return STAGE[l][stage] || stage;
}
