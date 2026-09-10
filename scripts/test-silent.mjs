// Sessiz yol kapısı — "okuyamadım" ile "hiç kayıt yok" ayrı kalsın.
//
// NEDEN VAR: bu sayfalarda `.catch` YOKTU. Jetonu düşmüş / 429 yemiş bir
// kullanıcı "Henüz bildirim gönderilmedi" görüyordu; Raporlar sayfası ise her
// sayacı SIFIR basıyordu — "0 transfer · 0 gönderildi · %0 başarı". Yani
// okunamayan bir veri, "hiç iş yapılmadı" diye RAPORLANIYOR ve firma sahibi
// bunu gerçek bir rapor sanıyordu. Sayı yanlış olduğunda bile kendinden emin
// görünür; en tehlikeli hata sınıfı budur.
//
// Mobil karşılığı `mobile/scripts/test-silent.mjs`. İki kapı BİREBİR AYNI
// DEĞİL (platformlar farklı veri yolu kullanıyor: burada `api.*`, mobilde
// doğrudan Supabase) — ortak olan SÖZLEŞME: hata state'e yazılır, ekrana
// basılır ve hata varken boş durum basılmaz.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const page = (f) => readFileSync(join(root, 'src', 'pages', f), 'utf8');

// KAPI ADA DEĞİL ŞEKLE BAKAR — ilk hâli iki dosya adına ÇİVİLİYDİ
// (`['NotificationsPage.jsx','ReportsPage.jsx']`) ve tam bu yüzden webin ANA
// çalışma ekranını (`DashboardPage`) ve `ReservationsPage`i görmedi: ikisi de
// aynı turda elle düzenlenmişti, yani açılıp bakılmış ve sessiz yol
// bırakılmıştı. Denetçi buldu. Artık `api.list*` çağıran HER sayfa taranır.
//
// `NOT_YET`: bugün sözleşmeyi taşımayan sayfalar. Bilerek listede — biri
// düzeltilince buradan SİL, yenisi eklenirse kapı kırılır. Boş bırakmak
// (yani hepsini yasaklamak) bu turda kapsam dışı bir temizlik dayatırdı;
// gizlemek ise kapıyı ada bağlamanın başka bir biçimi olurdu.
const NOT_YET = new Set(['LandingPage.jsx', 'OrganizationPage.jsx', 'PartnersPage.jsx', 'PlatformAdminPage.jsx']);

const PAGES = readdirSync(join(root, 'src', 'pages'))
  .filter((f) => f.endsWith('.jsx'))
  .filter((f) => /api\.list\w+\(/.test(page(f)));

console.log(`[1] Veri yükleyen sayfalar hatayı EKRANA basıyor (${PAGES.length} sayfa bulundu)`);
check('taranacak sayfa bulundu', PAGES.length >= 6, 'api.list* deseni değişmiş olabilir');

for (const file of PAGES) {
  if (NOT_YET.has(file)) continue;
  const src = page(file);

  // Bir kimliğin dosyada BULUNMASI, DOĞRU YERDE çağrıldığı anlamına gelmez —
  // mobil kapısının ilk hâli tam bu yüzden yanlış sebepten geçiyordu
  // (`setLoadError(null)` da bir eşleşmedir). Kapı reddedilen dalın KENDİSİNİ
  // görmeli: ya `.catch(...)` zinciri ya `allSettled` reddi.
  check(`${file}: reddedilen istek yakalanıyor`,
    /\.catch\(\s*\w*\s*=>\s*setLoadError\(/.test(src) || /status\s*===\s*'rejected'/.test(src),
    'sessizce yutuluyor olabilir');
  check(`${file}: hata state'e yazılıyor`, /setLoadError\(/.test(src));
  // Sunucunun KENDİ cümlesi basılmalı: "Bir hata oluştu" 401'i, 429'u ve 500'ü
  // aynı torbaya atar ve hangi kapının kapandığını söylemez.
  check(`${file}: hata metni ekranda`, /\{loadError\}/.test(src),
    'yalnız sabit bir uyarı basılıyor olabilir');
  check(`${file}: boş catch yok`, !/catch\s*(\([^)]*\))?\s*\{\s*\}/.test(src));
}

console.log('[2] Hata varken BOŞ DURUM basılmıyor (sözleşmeli TÜM sayfalar)');
// "Henüz kayıt yok" ile "okuyamadım" aynı ekranı üretirse ayrım kaybolur ve
// kullanıcı kayıtlarının silindiğini sanar. Bu proje aynı sınıftaki şikâyeti
// üç tur kovaladı.
//
// İLK HÂLİ YALNIZ `NotificationsPage`i SINIYORDU ve tam bu yüzden webin ana
// çalışma ekranı ile Transferlerim, mobil karşılıkları düzeltilirken açıkta
// kaldı — iki platform aynı turda YİNE ayrıştı. Kural artık sözleşmeyi taşıyan
// her sayfaya uygulanıyor. İki yazım da kabul: `loadError ? null` (ternary)
// ve `&& !loadError` (koşullu render).
for (const file of PAGES) {
  if (NOT_YET.has(file)) continue;
  const src = page(file);
  const hasEmptyState = /<EmptyState|Henüz .* yok/.test(src);
  if (!hasEmptyState) continue;
  check(`${file}: boş durum bastırılıyor`,
    /loadError[^?\n]*\?\s*null/.test(src) || /&&\s*!loadError/.test(src),
    '"hiç kayıt yok" ile "okuyamadım" aynı ekranı basıyor');
}

console.log('[2b] NOT_YET listesi kendini denetliyor');
// Mobil kardeşinde bu kontrol vardı, burada YOKTU. Muafiyet listesi
// denetlenmezse: (a) düzeltilen bir sayfa listede kalır ve kapı o sayfada
// SESSİZCE zayıflar, (b) silinen bir sayfa ölü kayıt olarak yaşar.
for (const file of NOT_YET) {
  const exists = PAGES.includes(file) || existsSync(join(root, 'src', 'pages', file));
  check(`${file}: hâlâ var`, exists, 'silinmiş ya da adı değişmiş — NOT_YET\'ten çıkar');
  if (!exists) continue;
  const src = page(file);
  const compliant = (/\.catch\(\s*\w*\s*=>\s*setLoadError\(/.test(src) || /status\s*===\s*'rejected'/.test(src))
    && /\{loadError\}/.test(src);
  check(`${file}: hâlâ sözleşmeyi taşımıyor`, !compliant,
    'DÜZELMİŞ — NOT_YET listesinden çıkar, yoksa kapı bu sayfada kör kalır');
}

console.log('[3] Raporlar tek bir uç düşünce HEPSİNİ atmıyor');
// `Promise.all` biri reddedilince diğerinin verisini de çöpe atar: tek bir uç
// 429 alsa sayfa tamamen boşalır. `allSettled` geleni gösterir, gelmeyeni söyler.
const reports = page('ReportsPage.jsx');
check('Promise.allSettled kullanılıyor', /Promise\.allSettled\(/.test(reports),
  'Promise.all tek hatada tüm veriyi düşürür');
check('Promise.all ARTIK kullanılmıyor', !/Promise\.all\(/.test(reports));

console.log('[3b] EYLEM yolları da hata basıyor (yalnız YÜKLEME değil)');
// Denetçi bulgusu B9: yükleme yolları kapatılmıştı, EYLEM yolları açık kaldı.
// `ReservationsPage`te `error` state'i YALNIZ form modalinin içinde render
// ediliyordu — `handleDelete` ona yazıyordu ama modal kapalı olduğu için
// mesaj hiç görünmüyordu; `handleComplete`/`handleApprove`/`handleReject`
// içinde `try/catch` HİÇ YOKTU. Dispatcher "Onayla"ya basar, uç 403 döner,
// ekranda sıfır iz kalır, bir daha basar.
//
// Kapı ADA değil ŞEKLE bakıyor: "eylem hatası için AYRI bir state var mı,
// sayfa düzeyinde basılıyor mu, ve `api.*` çağıran eylemler ortak
// sarmalayıcıdan mı geçiyor". Yeni bir eylem eklendiğinde `try/catch`
// yazmayı unutmak kuralı yeniden bozardı; sarmalayıcı bunu yapısal olarak
// engelliyor.
{
  const res = page('ReservationsPage.jsx');
  check('eylem hatası AYRI state\'te', /setActionError\(/.test(res),
    'form hatasıyla aynı state kullanılırsa modal kapalıyken mesaj görünmez');
  check('eylem hatası SAYFA düzeyinde basılıyor', /\{actionError\}/.test(res),
    'yalnız modal içinde render ediliyorsa kimse göremez');
  check('eylemler ortak sarmalayıcıdan geçiyor', /async function runAction\(/.test(res));

  // ADA DEĞİL ŞEKLE BAK. İlk hâli DÖRT SABİT AD tarıyordu; denetimde beşinci
  // bir eylem (`handleCancelTrip`, try/catch yok) eklendi ve kapı 39/0 YEŞİL
  // kaldı. Yorumu "yapısal olarak engelliyor" diyordu ama engellemiyordu —
  // yalnız bugün var olan dördünü tanıyordu.
  //
  // Doğrusu: `api.` çağıran HER `async function`, ya `runAction(` ya `try {`
  // içermeli. Meşru istisnalar `// action-ok` ile muaf tutulur.
  const kacak = [];
  for (const m of res.matchAll(/async function (\w+)\([^)]*\)\s*\{/g)) {
    const ad = m[1];
    if (ad === 'runAction') continue;
    // Gövdeyi kabaca al: bir sonraki üst düzey `\n  }` kapanışına kadar.
    const rest = res.slice(m.index);
    const body = rest.slice(0, rest.indexOf('\n  }') + 4);
    if (!/\bapi\.\w+\(/.test(body)) continue;              // veri ucu çağırmıyor
    if (/runAction\(|try\s*\{/.test(body)) continue;        // hata yolu var
    if (res.slice(Math.max(0, m.index - 80), m.index).includes('action-ok')) continue;
    kacak.push(ad);
  }
  check('api.* çağıran her eylemin hata yolu var', kacak.length === 0,
    kacak.length ? `hata yolu yok: ${kacak.join(', ')}` : '');
  // `alert()` de sessiz sayılır: kapatılınca iz kalmaz (projenin kendi kuralı).
  check('eylemlerde tarayıcı alert() kullanılmıyor', !/(^|[^.\w])alert\(/.test(
    res.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')),
    'alert kapatılınca iz kalmaz — şeride bas');
}

console.log('[4] Bütün sayfalarda kayıp `.catch` yok');
// Ratchet DEĞİL, tam tarama: webde bugün hiç boş `catch` yok ve öyle kalmalı.
//
// DÖRT desen — mobil ikiziyle BİREBİR aynı (2026-09-10, B11). Önceden yalnız
// `catch {}` DEYİMİNİ arıyordu; promise zincirinde yutmanın deyimsel yolları
// (`.catch(() => {})`, parantezsiz `.catch(e => {})`, ve `null` dönen biçim)
// hiç sayılmıyordu. İki kapı aynı soruyu aynı sertlikte sormalı, yoksa aynı
// hata bir depoda yakalanıp diğerinde geçer.
//
// `null` dönen biçim en sinsisi: "hatayı ele aldım" gibi durur ama çağırana
// `null` verir ve o `null` çoğu yerde "kayıt yok" diye okunur — hata, VERİ
// YOKLUĞU kılığına girer.
const SILENT = [
  /catch\s*(\([^)]*\))?\s*\{\s*\}/,                        // catch {} · catch (e) {}
  /\.catch\(\s*\(\s*[\w_$]*\s*\)\s*=>\s*\{\s*\}\s*\)/,     // .catch(() => {})
  /\.catch\(\s*[\w_$]+\s*=>\s*\{\s*\}\s*\)/,               // .catch(e => {})  ← parantezsiz
  /\.catch\(\s*(\([^)]*\)|[\w_$]+)\s*=>\s*(null|undefined)\s*\)/, // .catch(() => null)
];
// YORUMLAR SOYULUR: yoksa kapı KENDİ AÇIKLAMASINI ölçer — yukarıdaki
// açıklamada geçen kod örnekleri yeni bir sessiz yol gibi görünürdü.
const stripComments = (s) =>
  s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(n) ? [p] : []);
});
const offenders = walk(join(root, 'src'))
  .filter((f) => {
    const src = stripComments(readFileSync(f, 'utf8'));
    return SILENT.some((re) => re.test(src));
  })
  .map((f) => f.replace(root, '').replace(/\\/g, '/'));
check('hiçbir dosyada sessizce yutulan hata yok', offenders.length === 0, offenders.join(', '));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
