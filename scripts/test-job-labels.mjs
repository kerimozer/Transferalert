// Webdeki iş aşaması etiketleri backend'in JOB_STATUSES'ıyla örtüşüyor mu?
//
// NEDEN VAR: mobilde bu kapı vardı (mobile/scripts/test-job-labels.mjs), webde
// YOKTU. Web'de aşama etiketleri ÜÇ yerde tekrarlanıyor:
//   src/lib/status.js      → JOB_BADGE   (dispatcher panosu)
//   src/pages/JobPage.jsx  → ACTION_LABEL / STATE_LABEL (taşeron iş kartı)
//   src/pages/DriverPortalPage.jsx → ACTION_LABEL / STATE_LABEL (şoför panosu)
//
// Backend'e 5. bir aşama eklendiğinde (ya da bir aşama yeniden adlandırıldığında)
// bu üç yer sessizce eksik kalır: sayfalar `ACTION_LABEL[s] || s` ile ham anahtara
// düşer, yani şoför butonda "waiting_passenger" gibi bir sistem terimi görür.
// Çökme olmadığı için kimse fark etmez. Bu test o kaymayı CI'da yakalar.
//
// Bağımlılık yok, düz metin okuma — mobil taraftaki muadiliyle aynı desen.
import { readFileSync } from 'node:fs';
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

// Dosya → içindeki etiket haritaları. Yeni bir aşama gösteren sayfa eklenirse
// BURAYA da eklenmeli; aksi halde kapı o sayfayı korumaz.
const TARGETS = [
  { file: join(root, 'src', 'lib', 'status.js'), maps: ['JOB_BADGE'] },
  { file: join(root, 'src', 'pages', 'JobPage.jsx'), maps: ['ACTION_LABEL', 'STATE_LABEL'] },
  { file: join(root, 'src', 'pages', 'DriverPortalPage.jsx'), maps: ['ACTION_LABEL', 'STATE_LABEL'] },
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

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
