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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// `src/` altındaki HER dosya — ada değil ŞEKLE bakan taramalar için.
function walkSrc(dir = join(root, 'src')) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walkSrc(p) : (/\.jsx?$/.test(n) ? [p] : []);
  });
}
let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
}

// KANONİK SÖZLEŞME (mobildeki kopyasıyla birebir aynı olmalı)
const CANON = {
  // notifications.status ÜÇ değer alır (migration 031):
  // 'sent' | 'failed' | 'skipped'. Yalnız 'sent' gönderilen sayılır.
  status: 'sent',
  window: 100,               // backend /api/notifications tavanı; liste de bu pencereyi gösterir
  labelTr: 'Gönderilen',
  // "Tamamlanan" (67.5px) ~68px'lik hücrede kırpılıyordu (2026-09-09).
  // Mobil ikizinde `dashboard.completed` = 'Biten' / 'Done'.
  doneTr: 'Biten',
};

const page = readFileSync(join(root, 'src', 'pages', 'DashboardPage.jsx'), 'utf8');

console.log('[1] Sayaç ölçütü: yalnız gönderilmiş bildirimler');
// Ölçüt artık SATIR İÇİNDE değil, `lib/notify.js` → `isSent`'te. Aynı soru
// dört ekranda soruluyordu (Ana Sayfa, Bildirimler, Raporlar ×2) ve satır-içi
// kopyalar üçüncü hâl (`skipped`) gelince ayrışmaya hazırdı.
check('sayaç ORTAK ölçütü kullanıyor (isSent)',
  /sentCount\s*=\s*notifications\.filter\(isSent\)/.test(page),
  'ölçüt bulunamadı — satır-içi kopya kalmış olabilir');
check('isSent lib/notify\'dan import edilmiş',
  /import\s*\{[^}]*\bisSent\b[^}]*\}\s*from\s*'\.\.\/lib\/notify'/.test(page));

// Ham toplam bir daha istatistik değeri olmasın: hatayı doğuran tek satır
// tam olarak buydu (`value: notifications.length`).
check('ham `notifications.length` istatistik değeri değil',
  !/value:\s*notifications\.length/.test(page),
  'notifications.length doğrudan StatRow değerine veriliyor');

console.log('[1b] ÜÇ HÂL ayrı: "denenmedi" ne gönderildi ne başarısız');
// X1'in özü buydu: yapılandırma eksikken gönderici mock dönüyor, `success:true`
// olduğu için satır `sent` yazılıyordu — hiç gönderilmemiş bildirim panelde
// "Gönderilen" sayılıyordu. Sayaç yalan söyleyince arıza görünmez olur.
// Bu kontroller DAVRANIŞA bakar (regex'e değil): ölçüt gerçekten ne diyor?
{
  const { isSent, notifyKey, notifyTone, notifyReason } =
    await import(new URL('../src/lib/notify.js', import.meta.url));

  check('sent → gönderilen sayılır', isSent({ status: 'sent' }));
  check('skipped gönderilen SAYILMAZ', !isSent({ status: 'skipped' }));
  check('failed gönderilen SAYILMAZ', !isSent({ status: 'failed' }));
  // İkisini aynı torbaya atmak "sistem denedi ve olmadı" dedirtir; oysa gerçek
  // "kanal hiç kurulmamış"tır ve çözümü bambaşkadır.
  check('skipped, failed\'dan AYIRT EDİLİYOR', notifyKey('skipped') !== notifyKey('failed'));
  // Ton adları web Badge bileşeninin SÖZLEŞMESİ: brand|ok|warn|bad|neutral.
  // Sözleşmede olmayan bir ad sessizce neutral'a düşer ve ton artık burada
  // değil, Badge'in yedeğinde kararlaşır.
  check('skipped NÖTR ton alır (kırmızı değil)', notifyTone('skipped') === 'neutral', notifyTone('skipped'));
  check('sent yeşil, failed kırmızı', notifyTone('sent') === 'ok' && notifyTone('failed') === 'bad');
  check('bilinmeyen/eksik değer failed sayılır',
    notifyKey('pending') === 'failed' && notifyKey(undefined) === 'failed');
  check('gerekçe okunuyor ve kırpılıyor', notifyReason({ error: '  Netgsm: 30  ' }) === 'Netgsm: 30');
  check('gerekçe yoksa null', notifyReason({}) === null && notifyReason({ error: '   ' }) === null);

  // TON SÖZLEŞMESİ GERÇEKTEN VAR MI: Badge'in bilmediği bir ton üretirsek
  // rozet sessizce nötr olur ve "kırmızı olmalıydı" hatası hiç görünmez.
  const badge = readFileSync(join(root, 'src', 'components', 'ui', 'Badge.jsx'), 'utf8');
  for (const s of ['sent', 'failed', 'skipped']) {
    check(`Badge '${notifyTone(s)}' tonunu tanıyor (${s})`,
      new RegExp(`^\\s*${notifyTone(s)}:`, 'm').test(badge));
  }
}

console.log('[1c] Gerekçe EKRANDA basılıyor');
// Gerekçesiz bir "Başarısız" rozeti X1'i başlatan şikâyetin ta kendisidir.
const notifPage = readFileSync(join(root, 'src', 'pages', 'NotificationsPage.jsx'), 'utf8');
check('bildirim listesi üç hâli de basıyor', /notifyKey\(/.test(notifPage));
check('bildirim listesi gerekçeyi basıyor', /notifyReason\(/.test(notifPage));
check('üç hâlin de kendi etiketi var',
  /skipped:\s*'Denenmedi'/.test(notifPage), 'NOTIFY_LABEL eksik');
// Anlam yalnız renkle verilmez: her hâlin kendi ikonu olmalı (erişilebilirlik).
check('üç hâlin de kendi ikonu var',
  /NOTIFY_ICON\s*=\s*\{[^}]*sent:[^}]*failed:[^}]*skipped:/.test(notifPage));

// Raporlar sayfası "başarısız"ı `toplam - gönderilen` diye hesaplıyordu;
// yapılandırılmamış kanalın hiç denenmemiş satırlarını arıza gibi gösterirdi.
const reports = readFileSync(join(root, 'src', 'pages', 'ReportsPage.jsx'), 'utf8');
check('Raporlar `toplam - gönderilen` ile başarısız SAYMIYOR',
  !/notifications\.length\s*-\s*sentSms/.test(reports));
check('Raporlar denenmedi sayısını ayrı tutuyor', /skippedSms/.test(reports));

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

console.log('[3b] "Biten" — hücreye SIĞAN etiket');
// "Tamamlanan" 67.5px iken hücre ~68px: varsayılan yazı ölçeğinde bile tam
// sınırda ve mobilde "Tamamlan…" diye KIRPILIYORDU. Kırpılmış bir etiket,
// sayının neyi saydığını söylemeyi bırakır — yani bu, tercih değil HATA
// düzeltmesiydi ve kapıya girmesi gerekiyor.
//
// Kapı GENİŞLİĞE bakıyor, ada değil: biri "Tamamlanan"ı geri koyarsa (ya da
// başka uzun bir eşanlamlı yazarsa) yakalanır. Ada baksaydı yalnız o tek
// kelimeyi korur, sorunun kendisini değil.
const doneLabel = page.match(/\{\s*label:\s*'([^']+)',\s*value:\s*completed/);
check('completed bir StatRow hücresine bağlı', !!doneLabel,
  'sayaç hücreden koptuysa etiketi de ölçemeyiz');
check(`etiket = ${CANON.doneTr}`, !!doneLabel && doneLabel[1] === CANON.doneTr,
  doneLabel ? `bulunan ${doneLabel[1]}` : '');
// Manrope 600 @11px'te Türkçe etiketler kabaca 6.1px/karakter: 9 karakter
// ~55px, hücre ~68px. Tavan 8 karakter — "Tamamlanan" (10) çarpar.
check('etiket hücreye sığacak kadar kısa',
  !!doneLabel && doneLabel[1].length <= 8,
  doneLabel ? `${doneLabel[1]} (${doneLabel[1].length} karakter)` : '');

console.log('[4] Satırda TEK baş sayı var');
// Hiyerarşi kararı (2026-09-09): "Aktif" büyük + marka renginde, diğer üçü
// küçük + inkSoft. İkinci bir `lead` eklemek dördü yeniden eşitler ve
// "anlaşılır değil" şikâyetini geri getirir. Eski adı `brand`'di; artık
// yalnız rengi değil BOYUTU da belirlediği için o ad yanıltıcıydı.
const leads = [...page.matchAll(/tone:\s*'lead'/g)].length;
check('tam olarak bir hücre `lead`', leads === 1, `bulunan ${leads}`);

// ÇAĞRI YERİNİ KONTROL ETMEK YETMEZ — TÜKETİCİYE DE BAK. Kapının ilk hâli
// yalnız `DashboardPage`i okuyordu; tüketici (`StatRow.jsx`) AYRI BİR DOSYA ve
// kapı onu hiç açmıyordu. Denetimde `it.tone === 'lead'` → `'brand'` yapıldı ve
// `npm test` 30/30 YEŞİL kaldı. İki uç ayrışırsa "Aktif" 28px/marka yerine
// 16px/inkSoft basılır, dört sayı yeniden eşitlenir ve A0'ın 3. maddesi
// SESSİZCE yok olur.
const row = readFileSync(join(root, 'src', 'components', 'ui', 'StatRow.jsx'), 'utf8');
check('StatRow `lead` değerini tanıyor', /tone === 'lead'/.test(row),
  'tüketici başka bir ada bakıyor — çağrı yeriyle ayrışmış');
// Ada değil ŞEKLE bak: `src/` altında `tone` değeri olarak kalan HER `brand`.
const brandKalinti = walkSrc().filter((f) =>
  /tone\s*(===|==|:|=)\s*'brand'/.test(readFileSync(f, 'utf8')));
check('hiçbir dosyada `tone` değeri olarak `brand` kalmamış',
  brandKalinti.length === 0, brandKalinti.join(', '));

// İKİ PUNTO DA GERÇEKTEN TANIMLI: hiyerarşi tek reçeteye çökerse sayılar yine
// eşitlenir ama yukarıdaki ad kontrolleri bunu göremez.
check('lead 28px reçetesi var', /text-\[28px\]/.test(row));
check('rest 16px reçetesi var', /text-base/.test(row));
check('rest inkSoft renginde', /text-ink-soft/.test(row));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
