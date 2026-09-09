// Web stil kapısı — kullanılan Tailwind renk sınıfları GERÇEKTEN var mı?
//
// NEDEN VAR: Tailwind'de yanlış yazılmış bir sınıf **hata vermez, sessizce
// hiçbir şey yapmaz**. `bg-wa-500` yazarsan sayfa açılır, düzen bozulmaz,
// build temiz geçer — yalnız renk gelmez. Mobilde bunun karşılığı
// `test-styles.mjs`'in tanımsız `styles.X` kontrolü; webde hiçbir karşılığı
// yoktu ve renk turları elle doğrulanıyordu.
//
// RİSK BU PROJEDE ÖZELLİKLE YÜKSEK, çünkü palet SEYREK: `brand` yalnız
// 50/600/700, `wa` ve `sms` yalnız 50/700 taşıyor. Tailwind'in alışılmış
// 100–900 merdivenine göre yazan biri (ya da benim gibi başka bir oturum)
// `bg-brand-500` yazar ve hiçbir şey fark etmez.
//
// NE YAPMAZ: bu kapı renk DEĞERLERİNİ ve kontrastı ölçmez — o `test-tokens.mjs`'in
// işi. Burası yalnız "bu sınıf palette karşılığı olan bir şeye çözülüyor mu"
// sorusunu sorar. İkisi birbirini tamamlar.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SRC = join(ROOT, 'src');

let passed = 0, failed = 0;
const check = (name, ok, detail = '') => {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ' — ' + detail : ''}`); }
};

const cfg = (await import(new URL('../tailwind.config.js', import.meta.url))).default;
const COLORS = cfg.theme.extend.colors;

// YALNIZ BİZİM renk ailelerimiz denetlenir. Tailwind'in kendi varsayılan
// paleti (gray, red, white, transparent…) hâlâ açık ve meşru; onları da
// kapsamaya çalışmak, varsayılan paletin tamamını buraya kopyalamak olurdu —
// yani kapının kendisi ikinci bir palet kopyası hâline gelirdi.
const FAMILIES = Object.keys(COLORS);

// Bir aile içinde geçerli olan son ekler. `DEFAULT` → eksiz kullanım
// (`bg-surface`). Anahtarlar küçük harfe indirilir: Tailwind sınıf adında
// `borderstrong` yazar, config'de de öyle duruyor.
const VALID = new Map(
  FAMILIES.map((f) => [f, new Set(Object.keys(COLORS[f]).map((k) => k.toLowerCase()))]),
);

// Renk alan yardımcı önekleri. `border` ve `divide` gibi olanlar renksiz de
// kullanılır (`border`, `border-t`) — o hâller aile adı taşımadığı için zaten
// bu taramaya düşmez.
const UTILS = [
  'bg', 'text', 'border', 'ring', 'divide', 'placeholder', 'caret', 'accent',
  'decoration', 'outline', 'shadow', 'fill', 'stroke', 'from', 'via', 'to',
];

const walk = (dir) => readdirSync(dir).flatMap((n) => {
  const p = join(dir, n);
  return statSync(p).isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(n) ? [p] : []);
});

// Kaynaktan sınıf ADAYLARINI çıkarır.
//
// `className` dizesini ayrıştırmaya çalışmak yerine DOSYANIN TAMAMINDA sınıf
// şeklindeki belirteçleri arıyoruz: sınıflar `cls` haritalarında
// (`lib/status.js`), koşullu ifadelerde ve şablon dizelerinde de yaşıyor.
// Tailwind'in kendi tarayıcısı da tam olarak böyle çalışır (içerik taraması),
// yani kapı ile Tailwind aynı şeyi görür.
const TOKEN = /[a-zA-Z][\w:./[\]-]*/g;

const files = walk(SRC);
const offenders = [];
const dynamic = [];

for (const file of files) {
  const rel = relative(ROOT, file).replace(/\\/g, '/');
  const text = readFileSync(file, 'utf8');

  // DİNAMİK KURULAN SINIF: Tailwind kaynağı statik tarar, `bg-${tone}-600`
  // gibi bir dize ONUN İÇİN DE görünmezdir — üretilmez ve sessizce hiçbir şey
  // yapmaz. Bu, yanlış yazımla aynı sınıf hatadır ve ayrıca yakalanmalı.
  for (const fam of FAMILIES) {
    const re = new RegExp(`\\b(?:${UTILS.join('|')})-\\$\\{|\\b${fam}-\\$\\{`, 'g');
    if (re.test(text)) { dynamic.push(`${rel} (${fam})`); break; }
  }

  for (const raw of text.match(TOKEN) || []) {
    // Varyantları at: `hover:bg-bad-50` → `bg-bad-50`
    const bare = raw.includes(':') ? raw.slice(raw.lastIndexOf(':') + 1) : raw;
    // Opaklık son eki Tailwind'de meşru: `bg-bad-600/20`
    const [cls] = bare.split('/');

    const dash = cls.indexOf('-');
    if (dash < 0) continue;
    const util = cls.slice(0, dash);
    if (!UTILS.includes(util)) continue;

    const rest = cls.slice(dash + 1);
    const fam = FAMILIES.find((f) => rest === f || rest.startsWith(`${f}-`));
    if (!fam) continue;

    // Keyfi değer (`bg-brand-[#123456]`) bilinçli bir kaçış — palete sorulmaz.
    if (rest.includes('[')) continue;

    const shade = rest === fam ? 'default' : rest.slice(fam.length + 1).toLowerCase();
    if (!VALID.get(fam).has(shade)) {
      const has = [...VALID.get(fam)].sort().join(', ');
      offenders.push(`${rel}: ${cls} — "${fam}" ailesinde ${shade === 'default' ? 'DEFAULT' : shade} yok (var olanlar: ${has})`);
    }
  }
}

console.log(`[1] Tailwind renk sınıfları palete çözülüyor (${files.length} dosya)`);
check('kullanılan her renk sınıfının karşılığı var', offenders.length === 0,
  offenders.length ? `\n      ${offenders.join('\n      ')}` : '');

console.log('[2] Renk sınıfı DİNAMİK kurulmuyor');
// Tailwind statik tarar: `bg-${x}-600` üretilmez. Haritadan TAM sınıf dizesi
// döndür (`lib/status.js`'teki `cls` deseni) — parça birleştirme.
check('şablon dizesiyle sınıf üretilmiyor', dynamic.length === 0,
  dynamic.length ? dynamic.join(', ') : '');

console.log('[3] Palet ailesi boş bırakılmamış');
// Boş bir aile, kapıyı o aile için sessizce işlevsiz yapardı.
const empty = FAMILIES.filter((f) => VALID.get(f).size === 0);
check('her ailenin en az bir tonu var', empty.length === 0, empty.join(', '));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
