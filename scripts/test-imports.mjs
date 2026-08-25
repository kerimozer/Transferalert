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

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
