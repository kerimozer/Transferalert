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
