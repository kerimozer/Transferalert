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

const { kotaUyarisi, tl, KOTA_KURALI, KOTA_KURALI_EN } = await import(new URL('../src/lib/quota.js', import.meta.url));

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

// KOTA TAM DOLDUĞU AN (denetim bulgusu D7): 100/100'de ekran hem "sonuna
// YAKLAŞTINIZ" diyor hem "100 / 100" gösteriyor, üstelik "kota DOLDUĞUNDA"
// diye GELECEK ZAMAN kullanıyordu — kota zaten dolu. Kullanıcının şeridi en
// dikkatli okuyacağı an tam olarak bu andı ve ekran kendi kendisiyle
// çelişiyordu. Hâl `kalan`/`asim`den TÜRETİLİR; backend'in `durum` alanı
// (hâlâ 'yaklasiyor') DEĞİŞMEZ — o bir eşik ölçüsü, bu bir cümle kararı.
const dolu = kotaUyarisi({ limit: 100, kullanim: 100, kalan: 0, asim: 0, asimTutari: 0, asimFiyat: 16, durum: 'yaklasiyor' });
check('tam doluda BAŞLIK "doldu" diyor', dolu?.baslik === 'Aylık kotanız doldu', dolu?.baslik);
check('tam doluda metin gelecek zaman KULLANMIYOR',
  !/dolduğunda|yaklaştınız/.test(dolu?.detay || '') && !/yaklaştınız/.test(dolu?.baslik || ''),
  dolu?.detay);
check('tam dolu metni',
  dolu?.detay === 'Bu ay 100 / 100 transfer kullandınız. Transferleriniz DURMAZ; bundan sonraki her transfer 16 TL olarak faturaya eklenir.',
  dolu?.detay);
// BİRİM FİYAT ŞART: tam doluda aşım henüz 0 olduğu için `asimTutari` de 0'dır
// ve toplamdan geri hesaplanamaz (0/0). Fiyat gelmiyorsa kullanıcı yükseltme
// kararını ödeyeceği tutarı görmeden vermek zorunda kalır.
const doluBedava = kotaUyarisi({ limit: 20, kullanim: 20, kalan: 0, asim: 0, asimTutari: 0, asimFiyat: 0, durum: 'yaklasiyor' });
check('tam dolu + ücretsiz aşımda farklı cümle',
  doluBedava?.detay === 'Bu ay 20 / 20 transfer kullandınız. Transferleriniz DURMAZ; bundan sonraki transferler için ek ücret alınmaz.',
  doluBedava?.detay);
// 99/100 hâlâ "yaklaşıyor" olmalı — yeni dal bir öncekini yutmamalı.
check('99/100 hâlâ "yaklaşıyor"',
  kotaUyarisi({ limit: 100, kullanim: 99, kalan: 1, asim: 0, asimTutari: 0, durum: 'yaklasiyor' })?.baslik
    === 'Aylık kotanızın sonuna yaklaştınız');

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
check('tam dolu metni DURMAZ diyor', /DURMAZ/.test(dolu?.detay || ''));
// Ve HİÇBİR metin engellemeden bahsetmemeli.
// YENİ DAL MEVCUT SÖZLEŞMENİN KAPSAMINA ALINIR. 'dolu' buraya eklenmeseydi
// ürün sözü (engelleme dili yok) yalnız eski üç dalda ölçülür ve yeni dal
// kalıcı serbest bölgeye dönerdi — bu projenin tekrar eden dersi.
for (const [ad, u] of [['yaklasiyor', yak], ['asildi', ast], ['bedava', bedava], ['dolu', dolu], ['doluBedava', doluBedava]]) {
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
// ÇEKMEK YETMEZ, STATE'E İNMELİ. Denetimde `setUsage(...)` → `setUsage(null)`
// mutasyonu 31/31 yeşil geçti: çağrı yerinde duruyor, `usage` sonsuza kadar
// `null` kalıyor, şerit HİÇ basılmıyor. "Saydığın şeyin doğru yere indiğini
// de ölç" (A7-2) bulgusunun birebir tekrarı.
check('çekilen kota state\'e YAZILIYOR',
  /setUsage\(u\.status === 'fulfilled' \? u\.value : null\)/.test(dash),
  'kota çekiliyor ama state\'e inmiyor — şerit hiç basılmaz');
check('şerit koşullu basılıyor', /if \(!uyari\) return null;/.test(dash));
check('şerit metni ortak yardımcıdan geliyor',
  /uyari\.baslik/.test(dash) && /uyari\.detay/.test(dash),
  'metin ekranda elle yazılmış olabilir — ikiz sözleşme kopar');
// KOTA HATASI ANA HATA ŞERİDİNE YAZILMAZ: kotası rahat olan kullanıcıya
// (ya da şoför rolüne, uç 403 döner) her açılışta kırmızı şerit gösterirdi.
check('kota hatası loadError\'a karışmıyor',
  /const errs = \[r, n\]\.filter/.test(dash),
  'kota reddi ana hata şeridine düşüyor');

console.log('\n[6] FİYATI GÖSTEREN HER YÜZEY KOTAYI BASIYOR MU');
// DENETİM BULGUSU (S1): fiyatın YAPISI değişti ama fiyatı GÖSTEREN yüzeyler
// değişmedi ve bu ÜÇ ayrı bloklayıcı üretti. En ağırı canlıdaydı: landing
// sayfası kotalı planlara "Sınırsız uçuş takibi" diyordu — müşteri "490 ₺ ·
// Sınırsız" okuyup satın alır, ertesi ay 30 transferi aşınca 16 ₺/transfer
// fatura görürdü. Panoda "Aylık kotanızı aştınız" diyen bir ürünün satış
// sayfasında "sınırsız" demesi, üründen önce bir dürüstlük sorunu.
//
// KAPI ADA DEĞİL ŞEKLE BAKAR: fiyat basan dosyalar `p.price` ile bulunuyor,
// yani yarın eklenecek üçüncü bir fiyat yüzeyi de kendiliğinden kapsama girer.
{
  const { readdirSync, statSync } = await import('node:fs');
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : (/\.(jsx?|tsx?)$/.test(n) ? [p] : []);
  });
  const soy = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const fiyatYuzeyleri = walk(join(root, 'src'))
    .map((f) => [f, soy(readFileSync(f, 'utf8'))])
    .filter(([, s]) => /p\.price/.test(s));
  check(`fiyat basan yüzey bulundu (${fiyatYuzeyleri.length})`, fiyatYuzeyleri.length >= 2,
    'tarama boşaldı — aşağıdaki kontrol anlamsız');

  // KİMLİĞİN DOSYADA BULUNMASI YETMEZ (mutasyon turunda İKİ KEZ kaçtı).
  // `/transfer_limit/` araması, alanı yalnız bir koşulda ya da bir `value=`
  // bağlamasında taşıyan ama EKRANA BASMAYAN/GÖNDERMEYEN dosyayı yeşil
  // geçiriyordu. İki farklı yüzey türü, iki farklı sözleşme:
  //   · SATIŞ yüzeyi (alıcıya fiyat gösteren) → kota DEĞERİNİ basmalı
  //   · DÜZENLEME yüzeyi (`updatePlan` çağıran) → kotayı GÖNDERMELİ
  // Ayrım dosya adına değil, dosyanın NE YAPTIĞINA bakıyor.
  const duzenleyen = fiyatYuzeyleri.filter(([, s]) => /updatePlan\(/.test(s));
  const satan = fiyatYuzeyleri.filter(([, s]) => !/updatePlan\(/.test(s));

  const basmayan = satan.filter(([, s]) =>
    !/\$\{p\.transfer_limit\}|\{p\.transfer_limit\}/.test(s));
  check(`satış yüzeyi kota DEĞERİNİ basıyor (${satan.length} yüzey)`,
    satan.length > 0 && basmayan.length === 0,
    basmayan.map(([f]) => String(f).split(/[\\/]/).pop()).join(', ') +
    ' — fiyat görünüyor, karşılığı görünmüyor');

  const gondermeyen = duzenleyen.filter(([, s]) =>
    !/transfer_limit:\s*transfer_limit/.test(s) || !/overage_price:\s*overage_price/.test(s));
  check(`düzenleme yüzeyi kotayı GÖNDERİYOR (${duzenleyen.length} yüzey)`,
    duzenleyen.length > 0 && gondermeyen.length === 0,
    gondermeyen.map(([f]) => String(f).split(/[\\/]/).pop()).join(', ') +
    ' — alan ekranda var ama kaydedilmiyor');
  // VE "SINIRSIZ" VAADİ KOTALI PLANLA BİR ARADA DURAMAZ.
  const yalan = fiyatYuzeyleri.filter(([, s]) => /Sınırsız uçuş takibi/.test(s));
  check('kotalı planlara "sınırsız" denmiyor', yalan.length === 0,
    yalan.map(([f]) => String(f).split(/[\\/]/).pop()).join(', '));

  console.log('\n[7] KOTA KURALI — müşteriye söylenen cümle (D8, 2026-09-17)');
  // NEDEN SABİT YAZILI: `KOTA_KURALI` ikiz dosyada da var ve iki depo CI'da
  // yan yana duramıyor. Cümle bir tarafta değişirse o taraftaki kapı kırılır
  // (`test-transfer.mjs` deseni).
  //
  // BU BİR SÖZ: sayaç artık silinemez bir defterden türüyor (migration 033)
  // ve kaydı silmenin kotayı düşürmediğini kullanıcı bir yerden öğrenmek
  // zorunda. Öğrenmezse üründe hata olduğunu sanar — D8 tam olarak "ya
  // append-only'e taşı YA DA müşteriye yazılı söyle" diyordu; ikisi de yapıldı.
  const BEKLENEN_KURAL =
    'Kota, transfer kaydı açıldığında düşer. Alış saatinden önce iptal ettiğiniz ' +
    'ya da sildiğiniz transferler kotanıza geri eklenir; alış saati geçmiş bir ' +
    'kaydı silmek kotayı geri getirmez.';
  check('kota kuralı cümlesi ikiz sözleşmeye uyuyor', KOTA_KURALI === BEKLENEN_KURAL,
    JSON.stringify(KOTA_KURALI));
  // CÜMLE İKİ TARAFI BİRDEN SÖYLEMELİ. Yalnız "silmek düşürmez" kalsaydı ceza
  // gibi okunurdu; yalnız "iptal iade edilir" kalsaydı asıl değişiklik hiç
  // söylenmemiş olurdu. Sabit karşılaştırma bunu zaten yakalar; bu iki satır
  // kuralın GEREKÇESİNİ kapıda görünür tutuyor.
  check('kural İADE tarafını söylüyor', /geri eklenir/.test(KOTA_KURALI));
  check('kural SİLME tarafını söylüyor', /silmek kotayı geri getirmez/.test(KOTA_KURALI));

  // VE EKRANDA BASILIYOR. Tanımlı ama hiçbir yüzeyin çağırmadığı bir cümle,
  // bu projede defalarca yaşanan "tanımlı ≠ kullanılan" sınıfıdır: kural
  // yazılı olur, kullanıcı asla görmez, D8'in ikinci yarısı fiilen yapılmaz.
  //
  // TARAMA ŞEKLE BAKIYOR: `src/` altındaki HER dosya. Sayfa adına çivilenseydi
  // yarın eklenecek bir fiyat yüzeyi kapsama girmezdi.
  const tumDosyalar = walk(join(root, 'src'))
    // Sabitin TANIMLANDIĞI dosya sayılmaz: tanım her zaman oradadır ve onu
    // saymak "tanımlı ≠ kullanılan" kapısını kendi kendine yeşile boyar.
    .filter((f) => !/lib[\\/]quota\.js$/.test(String(f)))
    // YORUMLAR SOYULUYOR — bu kapının ilk hâli soymuyordu ve denetimde
    // kırıldı: şeritteki satırı `{/* eski hal: <span>{KOTA_KURALI}</span> */}`
    // JSX yorumuna çevirmek 52/52 YEŞİL geçiyordu, yani kural ekrandan
    // kalkıyor ve kapı hiçbir şey demiyordu. CLAUDE.md'nin kendi kuralı:
    // "Metin tarayan her kapı önce YORUMLARI SOYMALI." JSX yorumu
    // `{/* ... */}` biçiminde, yani blok yorumu soymak onu da götürüyor —
    // ama süslü parantezler kalmasın diye `{}` kabuğu da temizleniyor.
    .map((f) => [f, soy(readFileSync(f, 'utf8')).replace(/\{\s*\}/g, '')]);
  // VE `import` SATIRLARI SAYILMIYOR. Sabiti içe aktarıp HİÇ kullanmayan bir
  // dosya, ada bakan bir aramada "basıyor" görünür.
  const basanlar = tumDosyalar
    .map(([f, s]) => [f, s.replace(/^\s*import[^;]*;/gm, '')])
    .filter(([, s]) => /\{\s*KOTA_KURALI\s*\}/.test(s));
  check(`kural ekranda basılıyor (${basanlar.length} yüzey)`, basanlar.length >= 2,
    'kural tanımlı ama ekranda görünmüyor — kullanıcı hiç öğrenmez');
  // SATIŞ SAYFASI AYRICA ÖLÇÜLÜYOR: kotanın nasıl sayıldığını müşteri
  // faturayı gördüğünde değil, SATIN ALMADAN ÖNCE okumalı. S1 denetiminde
  // yakalanan "sınırsız" hatasının aynı sınıfı.
  check('satış sayfası da kuralı gösteriyor',
    basanlar.some(([f]) => /LandingPage/.test(String(f))),
    'fiyat sayfasında kotanın nasıl sayıldığı yazmıyor');

  // VE SAYININ YANINDA (denetim bulgusu Ö3). İlk hâlinde kural yalnız
  // `OrganizationPage`in plan yükseltme bloğundaydı: o blok `role === 'admin'`
  // VE "yükseltilebilir plan var" koşullarının içinde. Yani kaydı SİLEN ve
  // "sayaç neden düşmedi?" diyen DISPATCHER kuralı hiç göremiyordu — üstelik
  // `lib/quota.js`teki gerekçe tam olarak o kişiyi anlatıyor; en üst paketteki
  // admin de göremiyordu. Kapı yalnız "bir yerde basılıyor mu" diye sorsaydı
  // bu hâli onaylardı: sayacın göründüğü TEK yüzey kota şeridi.
  check('kural, sayacın basıldığı şeritte de var',
    basanlar.some(([f]) => /DashboardPage/.test(String(f))),
    'kuralı yalnız plan yükseltme bloğunda gören admin okur, dispatcher HİÇ okumaz');

  // İNGİLİZCESİ İKİZDE DURUYOR (denetim bulgusu Ö4). Web panelinde dil seçimi
  // yok — burada kullanılmıyor ama İKİZ SÖZLEŞME gereği tanımlı ve aynı
  // olmak zorunda: mobil ekran `lang === 'en'` dalında bunu basıyor ve cümle
  // iki depoda ayrışırsa aynı kullanıcı telefonunda başka, tarayıcısında
  // başka bir söz okur.
  const BEKLENEN_KURAL_EN =
    'Quota is used when a transfer is created. Transfers you cancel or delete ' +
    'before their pickup time are credited back; deleting a record after its ' +
    'pickup time does not restore the quota.';
  check('kuralın İngilizcesi ikiz sözleşmeye uyuyor', KOTA_KURALI_EN === BEKLENEN_KURAL_EN,
    JSON.stringify(KOTA_KURALI_EN));
  check('İngilizce metin Türkçesinden FARKLI',
    KOTA_KURALI_EN !== KOTA_KURALI,
    'çeviri yapılmamış — İngilizce kullanıcı Türkçe paragraf görür');
}

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
