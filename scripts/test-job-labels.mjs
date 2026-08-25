// Webdeki iş aşaması etiketleri backend'in JOB_STATUSES'ıyla örtüşüyor mu?
//
// NEDEN VAR: etiketler DÖRT dosyada kopyalanmıştı ve kopyaların tümü aynı
// anda güncellenmiyordu. Uçuşsuz transfer varyantı eklendiğinde ikisi
// güncellendi, biri (`PartnerPortalPage` → `JOB_VIEW`) gözden kaçtı: şoför
// panosunda "Alış Noktasındayım" yazarken otel portalı "Şoför havalimanında"
// gösterdi. Hepsi `src/lib/status.js` → `JOB_LABELS` altında birleştirildi.
//
// Bu kapı İKİ ŞEYİ birden koruyor:
//   [2] aşama kümesi backend JOB_STATUSES ile örtüşüyor mu,
//   [3] `src/` altında kimse yeni bir yerel kopya doğurmuş mu.
//
// Backend'e 5. bir aşama eklendiğinde tek kaynak sessizce eksik kalırdı:
// sayfalar ham anahtara düşer ve şoför butonda "waiting_passenger" gibi bir
// sistem terimi görür. Çökme olmadığı için kimse fark etmez.
//
// Bağımlılık yok, düz metin okuma — mobil taraftaki muadiliyle aynı desen.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
};

// Backend AYRI bir depodur. Yerelde (monorepo klasöründe) gerçek kaynak okunur
// ve sözleşme kayması yakalanır; CI'da yalnız frontend checkout edildiği için
// o dosya YOKTUR — orada beklenen listeye düşülür. Yani bu test CI'da iç
// tutarlılığı, yerelde gerçek sözleşmeyi doğrular.
const EXPECTED = ['en_route', 'at_airport', 'picked_up', 'completed'];
let backendStatuses = EXPECTED;
let source = 'beklenen liste (backend deposu bu ortamda yok)';
try {
  const constantsSrc = readFileSync(join(root, '..', 'backend', 'src', 'config', 'constants.js'), 'utf8');
  const parsed = (constantsSrc.match(/const JOB_STATUSES = \[([^\]]+)\]/) || [])[1]
    ?.split(',').map((x) => x.trim().replace(/['"]/g, '')).filter(Boolean);
  if (parsed?.length) { backendStatuses = parsed; source = 'backend/src/config/constants.js'; }
} catch {
  // yut: CI'da beklenen durum
}

// `const NAME = { ... };` bloğundaki üst düzey anahtarlar.
function keysIn(src, name) {
  const block = (src.match(new RegExp(`const ${name} = \\{([\\s\\S]*?)\\n\\};`)) || [])[1] || '';
  return [...block.matchAll(/^\s{2}(\w+):/gm)].map((m) => m[1]);
}

console.log('\n[1] Backend aşamaları okundu');
console.log('  kaynak:', source);
check('JOB_STATUSES okundu', backendStatuses.length > 0, JSON.stringify(backendStatuses));
check('beklenen listeyle örtüşüyor',
  EXPECTED.every((s) => backendStatuses.includes(s)) && backendStatuses.length === EXPECTED.length,
  JSON.stringify(backendStatuses));

// Etiketler ARTIK TEK DOSYADA. Önceden üç dosyada üç kopya vardı ve bu kapı
// onları birbirine karşı doğruluyordu; kopyalar `lib/status.js` → JOB_LABELS
// altında birleştirildi (JobPage ve DriverPortalPage jobAction/jobState
// import ediyor). Kapının işi değişmedi: aşama kümesi backend'le örtüşmeli.
const TARGETS = [
  { file: join(root, 'src', 'lib', 'status.js'), maps: ['JOB_LABELS'] },
];

console.log('\n[2] Web etiket haritaları örtüşüyor');
for (const target of TARGETS) {
  const src = readFileSync(target.file, 'utf8');
  const short = target.file.split(/[\\/]/).slice(-2).join('/');
  for (const map of target.maps) {
    const keys = keysIn(src, map);
    check(`${short} → ${map} bulundu`, keys.length > 0);
    check(`${short} → ${map} tüm aşamaları kapsıyor`,
      backendStatuses.every((s) => keys.includes(s)),
      `eksik: ${backendStatuses.filter((s) => !keys.includes(s)).join(', ')}`);
    check(`${short} → ${map} fazladan aşama içermiyor`,
      keys.every((k) => backendStatuses.includes(k)),
      `fazla: ${keys.filter((k) => !backendStatuses.includes(k)).join(', ')} — aşama BİLEREK eklendiyse bu script'teki EXPECTED listesini de güncelleyin`);
  }
}

// Sayfalar kendi kopyalarına GERİ DÖNMESİN: birleştirmenin tek koruması bu.
// Biri "hızlıca burada tanımlayayım" derse kopya sessizce geri gelir ve türe
// göre varyant (uçuşsuzda "Alış Noktasındayım") o sayfada eksik kalır.
// AŞAMA ADI BASAN HER SAYFA ORTAK DOSYADAN ÇEKMELİ.
//
// İlk sürümde bu kontrol yalnız `ACTION_LABEL`/`STATE_LABEL` adlarını arıyordu
// ve `PartnerPortalPage`'deki DÖRDÜNCÜ kopyayı (`JOB_VIEW`) göremedi: otel
// portalında uçuşsuz varyant hiç devreye girmedi, şoför "Alış Noktasındayım"
// derken otel "Şoför havalimanında" görüyordu. Artık ADA değil ŞEKLE bakıyor:
// aşama anahtarlarıyla indekslenen HERHANGİ bir yerel obje literali.
console.log('\n[3] Sayfalar tek kaynağı kullanıyor');
// SIRADAN VE İÇ İÇE DEĞERLERDEN BAĞIMSIZ: aşama anahtarlarının çoğunluğu aynı
// obje literalinde geçiyorsa bu bir aşama haritasıdır.
//
// İlk sürüm `/\{[\s\S]{0,400}?\}/` kullanıyordu ve TEMBEL olduğu için dış
// `{`'ten sonra İLK `}`'de duruyordu — yani değeri nesne olan bir kopyayı
// (`{ en_route: { label, icon }, ... }`) hiç göremiyordu. Tek kaynağın KENDİSİ
// o şekilde (`JOB_LABELS`), dolayısıyla "hızlıca buraya kopyalayayım" diyen
// kişi tam da kapının kör olduğu şekli üretirdi. Şimdi süslü parantez derinliği
// sayılıyor: blok dengeli biçimde kapanana kadar okunuyor.
//
// KAÇIŞ KAPISI: aşama anahtarlarıyla indekslenen ama etiket TAŞIMAYAN meşru
// haritalar var (ikon, renk, sıra). Onlara `// stage-map-ok` yorumu düşülür;
// kapıyla boğuşmak yerine niyet açıkça yazılır.
function objectBlocks(code) {
  const out = [];
  for (let i = 0; i < code.length; i++) {
    if (code[i] !== '{') continue;
    let depth = 0;
    for (let j = i; j < code.length && j - i < 4000; j++) {
      if (code[j] === '{') depth++;
      else if (code[j] === '}') {
        depth--;
        if (depth === 0) { out.push(code.slice(i, j + 1)); break; }
      }
    }
  }
  return out;
}
function definesStageMap(src) {
  if (src.includes('stage-map-ok')) return false;
  // Yorumları ve dizeleri ayıkla — açıklama metinlerindeki aşama adları
  // "harita" sanılmasın.
  const code = src
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ')
    .replace(/'(?:\\.|[^'\\])*'/g, "''")
    .replace(/"(?:\\.|[^"\\])*"/g, '""');
  return objectBlocks(code).some(
    (block) => EXPECTED.filter((s) => new RegExp(`\\b${s}\\s*:`).test(block)).length >= 3
  );
}

// SAYFALAR İSİMLE LİSTELENMEZ: `src/` altındaki HER dosya taranır. Önceki
// sürüm üç sayfayı adıyla kontrol ediyordu ve `PartnerPortalPage`'deki
// dördüncü kopyayı hiç görmedi; `src/components/` altında doğacak bir
// beşincisini de göremezdi.
const CONSUMERS = {
  'JobPage.jsx': ['jobAction', 'jobState'],
  'DriverPortalPage.jsx': ['jobAction', 'jobState'],
  'PartnerPortalPage.jsx': ['jobView'],
};
function walkSrc(dir) {
  const out = [];
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) out.push(...walkSrc(p));
    else if (/\.(jsx?|tsx?)$/.test(e)) out.push(p);
  }
  return out;
}
// YEREL SAYAÇ. Önce global `failed` kullanılıyordu; [1] veya [2] kaldığında da
// "src/ altında yerel aşama haritası kalmadı ✗" basılıyor ve sonraki
// geliştiriciyi yanlış dosyaya yolluyordu. Bu projenin kendi dersi: yanlış
// sebepten kalan/geçen test, hiç test olmamasından beter.
let localCopies = 0;
for (const file of walkSrc(join(root, 'src'))) {
  const name = file.split(/[\\/]/).pop();
  if (name === 'status.js') continue; // tek kaynağın kendisi
  const src = readFileSync(file, 'utf8');
  if (definesStageMap(src)) {
    localCopies++;
    check(`${name} yerel aşama haritası tanımlıyor`, false,
      'lib/status.js → jobAction / jobState / jobView kullanın (etiket taşımayan harita ise `// stage-map-ok` yorumu düşün)');
  }
  const fns = CONSUMERS[name];
  if (fns) {
    check(`${name} ${fns.join('/')} import ediyor`,
      /from '\.\.\/lib\/status'/.test(src) && fns.every((f) => new RegExp(`\\b${f}\\b`).test(src)));
  }
}
check('src/ altında yerel aşama haritası kalmadı', localCopies === 0, `${localCopies} kopya`);

// Uçuşsuz transferde "havalimanı" diye bir yer yok; varyant kaybolursa şoför
// otel transferinde "Havalimanına Geldim" butonu görür.
console.log('\n[4] Uçuşsuz varyant duruyor');
const statusSrc = readFileSync(join(root, 'src', 'lib', 'status.js'), 'utf8');
check('at_airport için p2pAction tanımlı', /p2pAction:/.test(statusSrc));
check('at_airport için p2pState tanımlı', /p2pState:/.test(statusSrc));
check('at_airport için p2pView tanımlı', /p2pView:/.test(statusSrc));
check('jobAction / jobState / jobView / jobBadge dışa veriliyor',
  ['jobAction', 'jobState', 'jobView', 'jobBadge'].every((f) => new RegExp(`export function ${f}\\b`).test(statusSrc)));
// "Uçuşsuz mu?" sorusunun İKİNCİ bir cevabı olmamalı: lib/transfer.js tek
// kaynak. Yerel bir kopya daha gevşek davranıp aynı kaydı kartta uçuşsuz,
// rozette uçuşlu gösterebilir.
check('uçuşsuz kararı lib/transfer.js\'ten geliyor',
  /import \{[^}]*isFlightTransfer[^}]*\} from '\.\/transfer'/.test(statusSrc),
  'status.js kendi tür kontrolünü yazmamalı');

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
