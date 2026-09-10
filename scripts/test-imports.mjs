// PAYLAŞILAN YARDIMCILARIN İMPORT TUTARLILIĞI.
//
// NEDEN VAR — bu proje bu hataya İKİ KEZ düştü ve ikisinde de HİÇBİR kapı
// yakalamadı: `cardTitle` çağrıları `transferLabel`'a çevrildi ama beş dosyada
// import satırı güncellenmedi. `npm run build` TEMİZ geçti (esbuild tanımsız
// adı global sanar), 342 test yeşil kaldı — ve şoför panosu, taşeron iş linki,
// yolcunun takip sayfası, mobil iş listesi ve gece nöbeti tahtası açılışta
// `ReferenceError` ile komple çöküyordu. Yani ürünün girişsiz yüzlerinin
// TAMAMI kırıktı ve tek bir uyarı yoktu.
//
// Testler bu sınıfı yakalamaz: bileşenleri render etmiyorlar. Babel/esbuild de
// yakalamaz: ikisi de sözdizimine bakar, kapsam çözümlemesi yapmaz.
//
// BURADAKİ KURAL DAR VE KASITLI: `src/lib/*.js` içindeki paylaşılan saf
// yardımcılar. Bir dosya o modüllerden birinin dışa verdiği bir adı ÇAĞIRIYOR
// ama import listesinde tutmuyorsa hata. Dar olması bilinçli — genel bir
// kapsam çözümleyicisi yazmak yerine, gerçekten yandığımız yeri çiviliyoruz.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const LIB = join(SRC, 'lib');

let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
};

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (/\.(jsx?|tsx?)$/.test(entry)) out.push(p);
  }
  return out;
}

// src/lib/*.js dosyalarının dışa verdiği adlar.
const libExports = new Map();
for (const file of readdirSync(LIB)) {
  if (!/\.jsx?$/.test(file)) continue;
  const src = readFileSync(join(LIB, file), 'utf8');
  const names = new Set();
  for (const m of src.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    names.add(m[1]);
  }
  if (names.size) libExports.set(file.replace(/\.jsx?$/, ''), names);
}

console.log('\n[1] Paylaşılan yardımcılar bulundu');
check('src/lib altında dışa verilen ad var', libExports.size > 0, `modül sayısı=${libExports.size}`);

console.log('\n[2] Çağrılan her ad import edilmiş mi');
let checkedFiles = 0;
// Kök App.js mobilde var, webde yok — tek script iki depoda BİREBİR aynı
// kalsın diye varlığına bakılıp eklenir (arama ve tür kopyalarıyla aynı kural).
const rootEntry = join(ROOT, 'App.js');
const files = walk(SRC);
try { statSync(rootEntry); files.push(rootEntry); } catch {}
for (const path of files) {
  const src = readFileSync(path, 'utf8');
  const rel = relative(ROOT, path).replace(/\\/g, '/');

  for (const [mod, exports] of libExports) {
    // Bu dosya o modülden import ediyor mu, ediyorsa hangi adları?
    const importRe = new RegExp(`import\\s*\\{([^}]*)\\}\\s*from\\s*['"][^'"]*lib/${mod}['"]`);
    const im = src.match(importRe);
    if (!im) continue;
    checkedFiles++;

    // `X as Y` → dosya içinde kullanılan ad Y'dir; dışa verilen ad X.
    // İkisini ayrı tutmazsak takma adlı her import "kullanılmıyor" görünür.
    const importedLocal = new Map(); // dışaVerilenAd → yerelAd
    for (const part of im[1].split(',')) {
      const [orig, alias] = part.split(/\s+as\s+/).map((s) => s.trim());
      if (orig) importedLocal.set(orig, alias || orig);
    }
    const imported = new Set(importedLocal.keys());

    // Gövde: import satırı ÇIKARILIR, ayrıca YORUMLAR ve DÜZ METİNLER
    // temizlenir. Temizlenmezse bu dosyanın kendi açıklama yorumundaki
    // "cardTitle kullanılsaydı..." cümlesi gerçek bir kullanım sanılır —
    // ilk sürümde tam olarak bu oldu ve üç yanlış alarm üretti.
    const body = src
      .replace(im[0], '')
      .replace(/\/\*[\s\S]*?\*\//g, ' ')      // blok yorum (JSX {/* */} dahil)
      .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')  // satır yorumu (URL'deki // hariç)
      .replace(/'(?:\\.|[^'\\])*'/g, "''")    // düz metinler
      .replace(/"(?:\\.|[^"\\])*"/g, '""')
      // YAYMA OPERATÖRÜ nokta ile biter (`...RES_STATUS_BADGE`). Aşağıdaki
      // kullanım deseni alan erişimini (`res.cardTitle`) elemek için önündeki
      // noktayı dışlıyor; `...` da o elemeye takılıp gerçek bir kullanımı
      // "kullanılmıyor" gösteriyordu. Yayma, alan erişimi DEĞİLDİR.
      .replace(/\.\.\./g, ' ');

    // Kullanım tespiti: adın kelime sınırıyla geçmesi yeter. `name(` aramak
    // YETMEZ — `FLIGHT` gibi sabitler karşılaştırmada, `api` gibi nesneler
    // `api.foo()` biçiminde, rozet tabloları `X[key]` biçiminde kullanılır;
    // yalnız çağrıya bakmak bunların hepsini "kullanılmıyor" sayardı.
    // Nokta öncesi dışlanır ki `res.cardTitle` gibi alan erişimi sayılmasın.
    const usesName = (name) => new RegExp(`(?<![\\w$.])${name}(?![\\w$])`).test(body);
    // Yerel tanım adı gölgeleyebilir; o zaman import gerekmez.
    const declaresName = (name) =>
      new RegExp(`(?:const|let|var|function|class)\\s+${name}(?![\\w$])`).test(body);

    for (const name of exports) {
      if (imported.has(name) || !usesName(name) || declaresName(name)) continue;
      check(`${rel}: "${name}" kullanılıyor ama import edilmemiş`, false,
        `→ import listesine ekleyin (lib/${mod}); build ve testler bunu YAKALAMAZ, sayfa açılışta çöker`);
    }

    // Ters yön: import edilmiş ama hiç kullanılmayan ad. Çökme yapmaz ama
    // "bu ekran onu kullanıyor" izlenimi bırakır ve bir sonraki düzenleyen
    // yanlış yardımcıya döner — kart başlığı hatası tam olarak böyle yayıldı.
    // Kullanım YEREL adla aranır (takma ad varsa o).
    for (const [orig, local] of importedLocal) {
      if (!exports.has(orig) || usesName(local)) continue;
      check(`${rel}: "${orig}" import edilmiş ama kullanılmıyor`, false, '→ import listesinden çıkarın');
    }
  }
}
check(`paylaşılan yardımcı kullanan ${checkedFiles} dosyanın importları tutarlı`, failed === 0);

// ── [3] YEREL MODÜLDEN İSTENEN AD GERÇEKTEN DIŞA VERİLİYOR MU ──────────────
//
// NEDEN EKLENDİ (2026-09-10): `NightWatchPage` yazılırken ölçüldü —
// `../components/ui` gibi bir BARREL dosyadan var olmayan bir ad import etmek
// `npm run build`i KIRMIYOR. Kullanılmıyorsa Rollup sessizce ağaç budar;
// KULLANILIYORSA değer `undefined` olur ve React açılışta
// "Element type is invalid" ile çöker. Yani yukarıdaki [1] bölümünün anlattığı
// felaketin (girişsiz yüzlerin tamamı `ReferenceError`) bileşen tarafındaki
// ikizi ve ona karşı hiçbir kapı yoktu.
//
// [1] DAR ve kasıtlıydı (`src/lib/*`). Bu bölüm tamamlayıcı: kaynağı değil
// HEDEFİ doğrular — "istediğin ad o dosyada var mı".
console.log('\n[3] Yerel modüllerden istenen adlar gerçekten dışa veriliyor');
// Uzantı AÇIK yazılmış olabilir (`./transfer.js` — bkz. lib/status.js): önce
// yolun kendisini dene, yoksa uzantı/`index` adaylarına bak. İlk hâl yalnız
// ekleme yapıyordu ve `transfer.js.js` arayıp "modül bulunamadı" diyordu.
const cozumle = (fromDir, spec) => {
  const base = join(fromDir, spec);
  for (const aday of [base, `${base}.jsx`, `${base}.js`, join(base, 'index.js'), join(base, 'index.jsx')]) {
    try { if (statSync(aday).isFile()) return aday; } catch { /* aday yok, sıradakine bak */ }
  }
  return null;
};
// YORUMLAR SOYULUR. `components/ui/index.js` kendi başlığında örnek bir
// import satırı taşıyor ve kapı onu gerçek bir import sanıp kırılıyordu —
// bu turda ÜÇÜNCÜ kez: metin tarayan her kapı önce yorumları atmalı.
const kodu = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
// Bir modülün dışa verdiği ADLAR. `export default` bilinçli DIŞARIDA:
// varsayılan dışa aktarım süslü parantezle import edilmez.
const disaVerilenler = (kod) => {
  const set = new Set();
  for (const m of kod.matchAll(/export\s+(?:async\s+)?(?:const|let|var|function\*?|class)\s+(\w+)/g)) set.add(m[1]);
  // `export { a, b as c }` ve `export { default as X } from '...'`
  for (const m of kod.matchAll(/export\s*\{([^}]*)\}/g)) {
    for (const parca of m[1].split(',')) {
      const t = parca.trim();
      if (!t) continue;
      const as = t.match(/\bas\s+(\w+)$/);
      set.add(as ? as[1] : t);
    }
  }
  return set;
};
let kontrolEdilen = 0;
const eksikler = [];
// `files` KULLANILIR, `walk(SRC)` DEĞİL: mobilde kök App.js `src/` dışında
// duruyor ve tam da orada bozuk bir ad TÜM uygulamayı açılışta düşürür —
// kapının en çok koruması gereken dosya taranmıyordu.
for (const dosya of files) {
  const rel = relative(ROOT, dosya).replace(/\\/g, '/');
  const kod = kodu(readFileSync(dosya, 'utf8'));
  // ÜÇ BİÇİM DE TARANIR: adlı import, VARSAYILAN + adlı (`import D, { a }` —
  // ilk hâl bunu hiç görmüyordu) ve çift tırnaklı yol. Bugün ikisi de
  // kullanılmıyor ama kapı bugünü değil YARIN YAZILACAĞI korumalı.
  for (const m of kod.matchAll(/import\s+(?:\w+\s*,\s*)?\{([^}]+)\}\s*from\s*['"](\.[^'"]+)['"]/g)) {
    const hedef = cozumle(join(dosya, '..'), m[2]);
    if (!hedef) { eksikler.push(`${rel}: '${m[2]}' modülü bulunamadı`); continue; }
    const verilen = disaVerilenler(readFileSync(hedef, 'utf8'));
    kontrolEdilen++;
    for (const parca of m[1].split(',')) {
      const ad = parca.trim().split(/\s+as\s+/)[0].trim();
      if (!ad) continue;
      if (!verilen.has(ad)) eksikler.push(`${rel}: '${m[2]}' → "${ad}" dışa verilmiyor`);
    }
  }
}
check(`${kontrolEdilen} yerel import'un tamamı çözülüyor`, eksikler.length === 0,
  eksikler.length ? `\n      ${eksikler.join('\n      ')}` : '');

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
