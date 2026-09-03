// Transfer türü — SAF yardımcılar. Backend'deki src/utils/reservationLabel.js
// ile AYNI kuralı taşır; ayrışırlarsa aynı kayıt sunucuda "uçuşsuz", ekranda
// "uçuşlu" görünür.
//
// Tür kolonu migration 029 ile geldi. `transfer_type` yoksa 'flight' varsayılır:
// eski kayıtlar ve kolonu döndürmeyen eski uçlar bugünkü davranışı korumalı.

export const FLIGHT = 'flight';
export const POINT_TO_POINT = 'point_to_point';

// Bu kayıt bir uçuşa mı bağlı? İKİ koşul birden aranır — türü 'flight' olup
// numarası boş bir satırda uçuş satırı basmak "uçuş: (boş)" gibi bir yer
// tutucu üretirdi.
export function isFlightTransfer(r) {
  return (r?.transfer_type || FLIGHT) === FLIGHT && !!r?.flight_number;
}

// Kaydın ekranda görünecek adı. Uçuşsuzda yolcu adı ZORUNLUdur (backend
// kapısı), o yüzden son yedek yalnız bozuk/eski satırlar içindir.
export function transferLabel(r) {
  return r?.flight_number || r?.passenger_name || 'Transfer';
}

// DİSPATCHER LİSTESİNİN kart başlığı: yolcu adı varsa o, yoksa uçuş numarası.
//
// YALNIZ `showFlightLine` İLE BİRLİKTE KULLANILIR. Tek başına kullanılan bir
// ekranda uçuş numarası TAMAMEN KAYBOLUR — şoför panosunda ve yolcunun takip
// sayfasında bu tam olarak yaşandı: ekranın en büyük yazısı yolcu adı oldu,
// TK1234 sayfanın hiçbir yerinde kalmadı ve havalimanına giden şoför hangi
// uçuşa bakacağını göremedi. Uçuş satırı basmayan ekranlarda `transferLabel`
// kullan (uçuş no önce).
export function cardTitle(r) {
  const hasPassenger = !!r?.passenger_name && r.passenger_name !== r?.flight_number;
  return hasPassenger ? r.passenger_name : transferLabel(r);
}

// Kartta ayrı bir uçuş satırı basılmalı mı? Başlık zaten uçuş numarasıysa
// (yolcu adı girilmemiş uçuşlu kayıt) tekrar basmak gürültüdür.
export function showFlightLine(r) {
  return isFlightTransfer(r) && cardTitle(r) !== r.flight_number;
}

// Kartın durum şeridinde görünecek TÜR ANAHTARI.
//
// "Uçuşsuz transfer" etiketi 2026-08-28'de kaldırıldı: kaydı YOKLUĞUYLA
// tanımlıyordu ve kullanıcı haklı olarak yadırgadı. Üç hâl var ve hiçbiri
// olumsuzlama değil:
//   · uçuş var + canlı veri geldi → uçuş durumu basılır (Havada/İndi/Rötarlı),
//     bu fonksiyon devreye GİRMEZ; karar ekranda latest_status ile verilir
//   · uçuş var, canlı veri yok     → 'airport'  → "Havalimanı"
//   · uçuş yok                     → 'transfer' → "Transfer"
//
// "Havalimanı" seçildi çünkü firmanın zaten kullandığı kelime ("havalimanı
// transferi" / "şehir içi transfer"); "uçuşlu" uydurma bir sıfat, parantezli
// etiket de rozette sonradan eklenmiş durur.
//
// DİKKAT: bu YALNIZ görünen etikettir. Veritabanındaki transfer_type kolonu
// ve backend sözleşmesi ('flight' | 'point_to_point') DEĞİŞMEZ.
export const TYPE_AIRPORT = 'airport';
export const TYPE_TRANSFER = 'transfer';

export function typeKey(r) {
  return isFlightTransfer(r) ? TYPE_AIRPORT : TYPE_TRANSFER;
}

// Yazılan sorgu bir UÇUŞ NUMARASINA benziyor mu?
//
// NEDEN VAR: Ana Sayfa'daki arama YALNIZ kayıtlı transferleri filtreler.
// Kullanıcı oraya kayıtlı olmayan bir uçuş numarası yazınca boş liste
// görüyor ve "arama çalışmıyor" sanıyordu — oysa canlı uçuş sorgusu ayrı bir
// iştir ve o ekrana geçiş yolu boş sonuç ekranında hiç sunulmuyordu.
// Bu yardımcı, "sonuç yok" durumunda canlı aramayı ÖNERMEK için kullanılır.
//
// Kural backend'in `utils/sanitize.js` → `flightNumber()` kapısından DAHA GEVŞEK
// olmalı: burada amaç doğrulamak değil, niyeti tahmin etmek. "TK1" de "PC4567"
// de öneriyi hak eder; kabul kararını backend verir.
export function looksLikeFlightNumber(q) {
  const s = String(q ?? '').toUpperCase().replace(/\s+/g, '');
  return /^[A-Z]{1,3}\d{1,4}[A-Z]?$/.test(s);
}

// Bir transfer ŞOFÖR BEKLİYOR mu?
//
// TEK KAYNAK OLMAK ZORUNDA: bu koşul dört yerde kopyalanmıştı (Ana Sayfa
// uyarı şeridi, kartın kırmızı kenarlığı + "Şoför ata" düğmesi, Transferlerim
// listesi). Kopyalar ayrışırsa şerit "1 transferde şoför yok" derken listedeki
// hiçbir kartta uyarı olmayan bir hâl doğar ve dispatcher hangisine
// inanacağını bilemez.
//
// ATANMA = ÜYELİK SATIRI (migration 025). `driver_name` ise taşeron/elle
// yazılan şoförü kapsar: adı yazılmış bir iş atanmamış sayılmaz.
export function needsDriver(r) {
  return r?.status === 'active' && !r?.assigned_member_id && !r?.driver_name;
}

// Yolcu adından baş harfler — kart gövdesine insani bir çapa verir.
//
// İKİ KOPYAYDI (mobil TransferCard + web FlightCard) ve Kart C'ye geçen her
// yeni ekran üçüncüsünü üretecekti.
//
// `toLocaleUpperCase('tr')` BURADA DOĞRU ve plakadaki kuralın TERSİDİR:
// bu bir insan adı, "İbrahim" → "İ" olmalı (düz toUpperCase 'i'yi 'I' yapar).
// Plakada ise tam tersi geçerli — Türk plakasında yalnız A-Z var ve tr yereli
// oraya geçersiz karakter yazar. İkisini birbirine benzetip "düzeltme".
export function initials(name) {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '–';
  const first = parts[0][0] || '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toLocaleUpperCase('tr');
}
