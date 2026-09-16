// KOTA UYARISI KAPISI (S1, 2026-09-16) — `src/lib/quota.js`
//
// NEDEN SABİT BEKLENTİ: `mobile/src/lib/quota.js` bu dosyanın İKİZİ ama iki
// depo CI'da yan yana duramıyor. Koruma, beklenen CÜMLENİN her iki depodaki
// kapıda birebir yazılı olması (`test-transfer.mjs` deseni). Metin bir tarafta
// değişirse o taraftaki kapı kırılır ve ayrışma canlıya çıkamaz.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
const check = (ad, kosul, ek = '') => {
  if (kosul) { passed++; console.log(`  ✓ ${ad}`); }
  else { failed++; console.log(`  ✗ ${ad} ${ek}`); }
};

const { kotaUyarisi, tl } = await import(new URL('../src/lib/quota.js', import.meta.url));

console.log('[1] Sessiz hâller — kota rahatken şerit BASILMAZ');
// Kalıcı bir "84/100" göstergesi her gün görülür, görüldükçe okunmaz olur ve
// gerçekten önemli olduğu gün de okunmaz.
check('durum ok → null', kotaUyarisi({ limit: 100, kullanim: 10, durum: 'ok' }) === null);
check('sınırsız (limit null) → null', kotaUyarisi({ limit: null, kullanim: 999, durum: 'ok' }) === null);
// ↑ BU KONTROL TEK BAŞINA YETMİYORDU ve mutasyon turunda yakalandı: yukarıdaki
// satır `durum: 'ok'` taşıdığı için LİMİT kapısı silinse bile DURUM kapısına
// takılıp yeşil kalıyordu — yani doğru sebepten geçmiyordu. Aşağıdaki hâl iki
// kapıyı AYIRIYOR: sınırsız bir kayıt, durumu ne olursa olsun sessiz kalmalı
// (sunucu böyle bir cevap üretmiyor ama savunma derinliği ölçülebilir olmalı).
check('sınırsız + "asildi" → yine null',
  kotaUyarisi({ limit: null, kullanim: 999, asim: 5, asimTutari: 70, durum: 'asildi' }) === null,
  'limit kapısı yok — kotasız firmaya aşım uyarısı basılır');
check('limit 0 → null', kotaUyarisi({ limit: 0, kullanim: 5, asim: 5, durum: 'asildi' }) === null);
check('veri yok → null', kotaUyarisi(null) === null);
check('boş nesne → null', kotaUyarisi({}) === null);
// Uç 403 döndüğünde (şoför rolü) istemci `null` yazıyor; çökmemeli.
check('tanınmayan durum → null', kotaUyarisi({ limit: 10, kullanim: 5, durum: 'mor' }) === null);

console.log('\n[2] Bin ayıracı — Hermes Intl\'e GÜVENİLMEZ');
// `toLocaleString` Hermes'te sürüme göre sessizce ayraçsız basıyor; o zaman
// aynı tutar webde "1.680 TL", telefonda "1680 TL" görünürdü.
check('420 → "420 TL"', tl(420) === '420 TL', tl(420));
check('1680 → "1.680 TL"', tl(1680) === '1.680 TL', tl(1680));
check('1234567 → "1.234.567 TL"', tl(1234567) === '1.234.567 TL', tl(1234567));
check('0 → "0 TL"', tl(0) === '0 TL', tl(0));
check('bozuk değer 0 sayılıyor', tl(undefined) === '0 TL' && tl('abc') === '0 TL');
// DAVRANIŞ BURADA YETMİYOR — ŞEKLE DE BAKILIR. Node tam ICU taşıdığı için
// `toLocaleString('tr-TR')` burada DOĞRU sonucu üretir ve testler yeşil kalır;
// arıza yalnız Hermes'te, yani ölçemediğimiz yerde doğar. Mutasyon turunda
// tam olarak bu kaçtı. Kaynağı yasaklamak, ölçülemeyen bir riski ölçülebilir
// bir kurala çeviriyor.
const quotaSrc = readFileSync(join(root, 'src', 'lib', 'quota.js'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
check('toLocaleString KULLANILMIYOR (Hermes Intl güvenilmez)',
  !/toLocaleString/.test(quotaSrc),
  'telefonda ayraçsız sayı basar; web "1.680 TL" derken mobil "1680 TL" gösterir');
check('Intl API\'si de kullanılmıyor', !/\bIntl\b/.test(quotaSrc));

console.log('\n[3] Cümleler — İKİZ SÖZLEŞME (mobil kapıda BİREBİR aynısı var)');
const yak = kotaUyarisi({ limit: 100, kullanim: 85, kalan: 15, asim: 0, asimTutari: 0, durum: 'yaklasiyor' });
check('yaklaşıyor tonu notice', yak?.tone === 'notice', JSON.stringify(yak));
check('yaklaşıyor başlığı', yak?.baslik === 'Aylık kotanızın sonuna yaklaştınız', yak?.baslik);
check('yaklaşıyor metni',
  yak?.detay === 'Bu ay 85 / 100 transfer kullandınız. Kota dolduğunda transferleriniz DURMAZ; aşan transferler faturaya eklenir.',
  yak?.detay);

const ast = kotaUyarisi({ limit: 100, kullanim: 130, kalan: 0, asim: 30, asimTutari: 420, durum: 'asildi' });
check('aşıldı tonu warn', ast?.tone === 'warn', JSON.stringify(ast));
check('aşıldı başlığı', ast?.baslik === 'Aylık kotanızı aştınız', ast?.baslik);
check('aşıldı metni',
  ast?.detay === 'Bu ay 130 / 100 transfer kullandınız. Transferleriniz devam ediyor; 30 aşım transferi 420 TL olarak faturalanacak.',
  ast?.detay);

// AŞIM ÜCRETSİZSE FARKLI CÜMLE: "0 TL olarak faturalanacak" saçma ve
// kullanıcıya ödeyeceği bir şey varmış hissi verir.
const bedava = kotaUyarisi({ limit: 20, kullanim: 25, asim: 5, asimTutari: 0, durum: 'asildi' });
check('ücretsiz aşımda "ek ücret yok" deniyor',
  bedava?.detay === 'Bu ay 25 / 20 transfer kullandınız. Transferleriniz devam ediyor; 5 transfer kotanızın üzerinde — bu ay için ek ücret yok.',
  bedava?.detay);

console.log('\n[4] ÜRÜN SÖZÜ: metin "durmaz/devam ediyor" demek ZORUNDA');
// Kota ENGELLEMEZ, UYARIR (migration 032). Kullanıcının kotaya dair ilk
// düşüncesi "transferlerim durdu mu?" olur; cevap verilmezse dispatcher ayın
// sonunda transfer kaydetmekten çekinir — ürünün işe yaramaz hâle geldiği an.
check('yaklaşıyor metni DURMAZ diyor', /DURMAZ/.test(yak?.detay || ''));
check('aşıldı metni devam ettiğini söylüyor', /devam ediyor/.test(ast?.detay || ''));
// Ve HİÇBİR metin engellemeden bahsetmemeli.
for (const [ad, u] of [['yaklasiyor', yak], ['asildi', ast], ['bedava', bedava]]) {
  check(`${ad}: engelleme/kilit dili yok`,
    !/durduruldu|engellend|kilitlend|kullanamazs|ekleyemezs/i.test(`${u.baslik} ${u.detay}`),
    u.detay);
}

console.log('\n[5] EKRANDA BASILIYOR MU — tanımlı ≠ kullanılan');
// Yardımcı doğru olup hiçbir ekran çağırmazsa yukarıdaki her kontrol yeşil
// kalır ve kullanıcı kotasını hiç görmez.
const dash = readFileSync(join(root, 'src', 'pages', 'DashboardPage.jsx'), 'utf8');
// ÇAĞRININ BULUNMASI YETMEZ, SONUCUNUN KULLANILMASI GEREKİR. İlk hâli yalnız
// `/kotaUyarisi\(usage\)/` arıyordu ve mutasyon turunda kaçtı:
// `const uyari = null; kotaUyarisi(usage);` yazmak kapıdan geçiyordu — çağrı
// yerinde duruyor, sonucu çöpe gidiyor, şerit hiç basılmıyor. Bu projede
// tekrar eden sınıf (`setLoadError(null)`, `if (1) return null` kaması):
// **kimliğin varlığı değil, değerin AKIŞI ölçülmeli.**
check('pano kota uyarısını çağırıyor VE sonucunu bağlıyor',
  /const uyari = kotaUyarisi\(usage\);/.test(dash),
  'çağrı var ama dönen değer kullanılmıyor olabilir');
check('pano kotayı sunucudan çekiyor', /api\.orgUsage\(\)/.test(dash));
check('şerit koşullu basılıyor', /if \(!uyari\) return null;/.test(dash));
check('şerit metni ortak yardımcıdan geliyor',
  /uyari\.baslik/.test(dash) && /uyari\.detay/.test(dash),
  'metin ekranda elle yazılmış olabilir — ikiz sözleşme kopar');
// KOTA HATASI ANA HATA ŞERİDİNE YAZILMAZ: kotası rahat olan kullanıcıya
// (ya da şoför rolüne, uç 403 döner) her açılışta kırmızı şerit gösterirdi.
check('kota hatası loadError\'a karışmıyor',
  /const errs = \[r, n\]\.filter/.test(dash),
  'kota reddi ana hata şeridine düşüyor');

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
