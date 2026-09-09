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
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

console.log('[2] Hata varken BOŞ DURUM basılmıyor');
// "Henüz bildirim gönderilmedi" ile "okuyamadım" aynı ekranı üretirse ayrım
// kaybolur ve kullanıcı kayıtlarının silindiğini sanar.
check('NotificationsPage: boş durum bastırılıyor',
  /loadError[^?\n]*\?\s*null/.test(page('NotificationsPage.jsx')));

console.log('[3] Raporlar tek bir uç düşünce HEPSİNİ atmıyor');
// `Promise.all` biri reddedilince diğerinin verisini de çöpe atar: tek bir uç
// 429 alsa sayfa tamamen boşalır. `allSettled` geleni gösterir, gelmeyeni söyler.
const reports = page('ReportsPage.jsx');
check('Promise.allSettled kullanılıyor', /Promise\.allSettled\(/.test(reports),
  'Promise.all tek hatada tüm veriyi düşürür');
check('Promise.all ARTIK kullanılmıyor', !/Promise\.all\(/.test(reports));

console.log('[4] Bütün sayfalarda kayıp `.catch` yok');
// Ratchet DEĞİL, tam tarama: webde bugün hiç boş `catch` yok ve öyle kalmalı.
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(n) ? [p] : []);
});
const offenders = walk(join(root, 'src'))
  .filter((f) => /catch\s*(\([^)]*\))?\s*\{\s*\}/.test(readFileSync(f, 'utf8')))
  .map((f) => f.replace(root, '').replace(/\\/g, '/'));
check('hiçbir dosyada boş catch yok', offenders.length === 0, offenders.join(', '));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
