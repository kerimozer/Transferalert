// Bildirim gönderim sonucu — ÜÇ HÂL.
//
// NEDEN VAR (2026-09-03b): ekranlar bu değeri İKİLİ okuyordu —
// `status === 'sent' ? 'Gönderildi' : 'Başarısız'`. Migration 031 üçüncü bir
// hâl getirdi (`skipped`) ve ikili okuma onu kırmızı "Başarısız" olarak
// basıyordu.
//
// FARK ÖNEMSİZ DEĞİL:
//   sent    → sağlayıcı kabul etti
//   failed  → sağlayıcıya GİDİLDİ ve reddetti (kota, numara, içerik)
//   skipped → kanal yapılandırılmadığı için HİÇ DENENMEDİ
//
// İkisini aynı kırmızıya boyamak, dispatcher'a "sistem denedi ve olmadı"
// dedirtir; oysa gerçek "kanal hiç kurulmamış"tır ve çözümü bambaşkadır.
// X1'in tamamı tam olarak bu ayrımın yokluğundan aylarca görünmez kaldı.
//
// İKİ KOPYA (mobil + web) BİREBİR AYNI olmak zorunda — `lib/transfer.js` ile
// aynı kural. Kapı: her iki depodaki `scripts/test-stats.mjs`.

export const SENT    = 'sent';
export const FAILED  = 'failed';
export const SKIPPED = 'skipped';

// Ekranın basacağı hâl anahtarı. Bilinmeyen/eksik değer `failed`'a düşer:
// sessizce "gönderildi" saymaktansa görünür şekilde başarısız saymak yeğdir.
export function notifyKey(status) {
  if (status === SENT)    return SENT;
  if (status === SKIPPED) return SKIPPED;
  return FAILED;
}

// Rozet tonu. `skipped` NÖTR'dür — kırmızı değil: kimse başarısız olmadı,
// kanal hiç kurulmadı. Kırmızı yapmak "arıza var" sinyali verir ve
// dispatcher'ı olmayan bir arızayı kovalamaya yollar.
//
// Dönen değerler web `Badge` bileşeninin TON SÖZLEŞMESİDİR
// (`components/ui/Badge.jsx` → brand|ok|warn|bad|neutral). Buraya sözleşmede
// olmayan bir ad ('quiet' gibi) yazmak sessizce `neutral`'a düşer — çalışır
// görünür ama ton artık burada değil, Badge'in yedeğinde kararlaşır.
export function notifyTone(status) {
  const k = notifyKey(status);
  if (k === SENT)    return 'ok';
  if (k === SKIPPED) return 'neutral';
  return 'bad';
}

// "Gönderilen" sayacının TEK ölçütü. `skipped` ve `failed` SAYILMAZ.
//
// Mock gönderim bir dönem `success: true` döndüğü için satır `sent` yazılıyor
// ve hiç gönderilmemiş bildirim panelde "Gönderilen" sayılıyordu — sayaç yalan
// söylüyordu. Ölçüt tek yerde dursun ki bir daha ayrışmasın.
export function isSent(n) {
  return n?.status === SENT;
}

// Başarısızlık gerekçesi (`notifications.error`, migration 031).
//
// Sağlayıcının kendi cümlesi ya da yapılandırma eksiği burada durur. EKRANDA
// GÖSTERİLMEK ZORUNDA: gerekçesiz bir "Başarısız" rozeti, X1'i başlatan
// şikâyetin ta kendisidir ("gitmiyor ama neden bilmiyorum").
export function notifyReason(n) {
  const s = String(n?.error || '').trim();
  return s || null;
}
