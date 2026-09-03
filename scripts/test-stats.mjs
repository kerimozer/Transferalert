// Ana Sayfa istatistik satırı kapısı — "Gönderilen" sayacı iki platformda
// AYNI ŞEYİ saymak zorunda.
//
// NEDEN VAR: burası `notifications.length` (TÜM bildirimler), mobil
// `status === 'sent'` sayıyordu. Etiket ikisinde de "Bildirim"di, yani
// ölçütü söylemiyordu; aynı hesapta iki farklı sayı aylarca kimseye
// çarpmadı. Canlı veride 46 bildirimin 46'sı 'failed' — web "46 bildirim"
// derken gerçekte hiçbiri gitmemişti.
//
// NEDEN SABİT LİSTE: web ve mobil AYRI git depoları; ne biri diğerini
// checkout edebiliyor ne de CI'da yan yana duruyorlar. `test-transfer.mjs`
// ve `test-tokens.mjs` ile aynı çözüm: kanonik ölçüt burada SABİT yazılı,
// her depo kendi kopyasını ona karşı ölçüyor. Biri değişirse KENDİ kapısı
// kırılır. Ölçütü değiştirirken ÜÇÜNÜ birden güncelle: bu dosya, mobil
// scripts/test-stats.mjs ve iki ekranın kendisi.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

// KANONİK SÖZLEŞME (mobildeki kopyasıyla birebir aynı olmalı)
const CANON = {
  status: 'sent',            // notifications.status yalnız 'sent' | 'failed' alır
  window: 100,               // backend /api/notifications tavanı; liste de bu pencereyi gösterir
  labelTr: 'Gönderilen',
};

const page = readFileSync(join(root, 'src', 'pages', 'DashboardPage.jsx'), 'utf8');

console.log('[1] Sayaç ölçütü: yalnız gönderilmiş bildirimler');
check(`sentCount = filter(status === '${CANON.status}')`,
  new RegExp(`sentCount\\s*=\\s*notifications\\.filter\\([^)]*status\\s*===\\s*'${CANON.status}'`).test(page),
  'ölçüt bulunamadı');

// Ham toplam bir daha istatistik değeri olmasın: hatayı doğuran tek satır
// tam olarak buydu (`value: notifications.length`).
check('ham `notifications.length` istatistik değeri değil',
  !/value:\s*notifications\.length/.test(page),
  'notifications.length doğrudan StatRow değerine veriliyor');

console.log('[2] Sayaç ile liste AYNI pencereyi gösteriyor');
// Bildirimler backend ucundan alınır ve orada son 100 satırla sınırlıdır
// (routes/notifications.js). Doğrudan Supabase'e giden bir sorgu bu tavanı
// atlar; sayı, dokunulduğunda açılan listede olmayan satırları da sayar.
check(`bildirimler api.listNotifications() ile alınıyor (son ${CANON.window})`,
  /api\.listNotifications\(\)/.test(page), 'doğrudan supabase sorgusu tavanı atlar');
check('sayfa Supabase bildirim tablosuna doğrudan gitmiyor',
  !/from\(['"]notifications['"]\)/.test(page), 'backend tavanı atlanıyor');

console.log('[3] Etiket ölçütü söylüyor');
const label = page.match(/\{\s*label:\s*'([^']+)',\s*value:\s*sentCount/);
check(`etiket = ${CANON.labelTr}`, !!label && label[1] === CANON.labelTr,
  label ? `bulunan ${label[1]}` : 'sentCount bir StatRow hücresine bağlı değil');
// Etiket hücresi ~69-77px (11/600 Manrope). ÖLÇÜLDÜ: "Gönderilen" 58.1px
// sığar; "Toplam Bildirim" 80.3px sığmaz ve kırpılınca ölçütü yine söylemez.
check('etiket tek kelime', !!label && !label[1].includes(' '), label ? label[1] : '');

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
