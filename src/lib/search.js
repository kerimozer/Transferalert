// Transfer araması — SAF fonksiyon, ekrandan bağımsız (test edilebilir olsun diye).
//
// TÜRKÇE I/İ TUZAĞI: `toLocaleLowerCase('tr')` `I`→`ı`, `İ`→`i` yapar. Sorgu ve
// veri aynı dönüşümden geçse bile harfler farklıysa eşleşme KOPAR:
//   veri "İbrahim" + sorgu "Ibrahim"  → eşleşmez (i vs ı)
//   veri "ISTANBUL" + sorgu "ist"     → eşleşmez (ı vs i)
// Dispatcher İngilizce klavyeyle "Ibrahim" yazar, "sonuç yok" görür ve kaydın
// silindiğini sanır. Arama sessizce başarısız olur — hata yok, boş liste var.
//
// Çözüm: karşılaştırmadan önce I/İ/ı/i ailesini TEK harfe katla. Aynı mantık
// mobilde de var (mobile/src/lib/search.js) — ikisi ayrışırsa aynı sorgu iki
// platformda farklı sonuç verir.
const FOLD_MAP = {
  'İ': 'i', 'I': 'i', 'ı': 'i', 'i': 'i',
  'Ş': 's', 'ş': 's', 'Ğ': 'g', 'ğ': 'g',
  'Ü': 'u', 'ü': 'u', 'Ö': 'o', 'ö': 'o', 'Ç': 'c', 'ç': 'c',
};

export function fold(value) {
  // Yalnız I/İ değil TÜM Türkçe harfler katlanır: sahada adlar şapkasız
  // yazılır (Isil ↔ Işıl, Gulsah ↔ Gülşah). Katlamazsak dispatcher
  // kendi müşterisinin adını arayıp bulamaz.
  return String(value ?? '')
    .replace(/[İIıiŞşĞğÜüÖöÇç]/g, (c) => FOLD_MAP[c])
    .toLocaleLowerCase('tr');
}

// Aranan alanlar. Yolcu adı ilk sırada bilinçli: dispatcher'ın sorusu çoğu
// zaman "Schmidt geldi mi", uçuş numarası değil. Şoför adı da dahil —
// "Ali'nin bugünkü işleri" pratikte sorulan bir soru.
const FIELDS = ['passenger_name', 'flight_number', 'pnr', 'driver_name', 'meeting_point', 'dropoff_point'];

// Boş sorgu HER ŞEYİ geçirir: filtre yokken liste kırpılmamalı.
export function matchesQuery(reservation, query) {
  const q = fold(query).trim();
  if (!q) return true;
  if (!reservation) return false;
  return FIELDS.some((f) => fold(reservation[f]).includes(q));
}
