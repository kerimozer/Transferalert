// Tarih/saat biçimlendirme yardımcıları — tek kaynak.
// Listelerdeki alış tarihi her yerde aynı kısa biçimde görünür: "GG.AA SS:DD".

// <input type="datetime-local"> değeri ("2026-09-01T14:00") saat dilimi
// TAŞIMAZ. Ham gönderilirse sunucu onu KENDİ yerel saatinde (UTC) yorumlar:
// kullanıcının yazdığı 14:00, veritabanına 14:00Z = TR saatiyle 17:00 olarak
// düşer. Doğrulandı (2026-08-19, canlı): 3 saat kayma gerçekti.
//
// Tarayıcı `new Date()` ile aynı dizgeyi KULLANICININ dilimiyle yorumlar —
// dönüşümü burada, istemcide yapmak zorundayız; sunucu istemcinin dilimini
// bilemez. Boş değer null döner (opsiyonel alanlar için).
export function localInputToIso(value) {
  if (!value) return null;
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

export function formatPickup(d) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
