// Tasarım token'ları kapısı — `tailwind.config.js` ile mobil `theme.js`
// AYNI değerleri taşımak ZORUNDA.
//
// NEDEN SABİT LİSTE: mobil ve web AYRI git depoları; ne biri diğerini
// checkout edebiliyor ne de CI'da yan yana duruyorlar. `test-transfer.mjs`
// ile aynı çözüm: kanonik palet burada SABİT yazılı, her depo kendi
// kopyasını ona karşı ölçüyor. Biri değişirse KENDİ kapısı kırılır.
//
// İnsan kaynağı: design/yon-secimi/KARAR.md (dokümanlar deposu).
// Bir token'ı değiştirirken ÜÇÜNÜ birden güncelle: bu liste, mobil
// scripts/test-tokens.mjs ve KARAR.md.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
function check(name, ok, detail = '') {
  if (ok) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name}${detail ? ' ' + detail : ''}`); }
}

// KANONİK PALET — "Yön 5 — Sentez" (2026-08-28 onaylandı).
const CANON = {
  bg: '#FAF8F5', surface: '#FFFFFF', surfaceAlt: '#F3EFE9',
  border: '#E9E4DC', borderStrong: '#D8D1C6',
  ink: '#211E1B', inkSoft: '#5B554E', inkMuted: '#6E675E',
  primary: '#0F5D6B', primaryDark: '#0A424D', primarySoft: '#E3EFF1',
  accent: '#AC5B34', accentSoft: '#F7EBE1', accentText: '#8F4E24',
  success: '#2E6F52', successSoft: '#E5F0EA', successText: '#1E523C',
  warning: '#96580F', warningSoft: '#FAEEDB', warningText: '#7A460A',
  danger: '#A93B29', dangerSoft: '#F8E7E3', dangerText: '#8A2E20',
  // ŞERİT TONLARI (2026-08-30, "dolu şerit" kararı). `neutralSoft` #EFF1EF idi
  // ve `surfaceAlt` ile arası ΔE 3.0'dı; eski `scheduled` tonu ise surfaceAlt
  // ile BİREBİR aynıydı (ΔE 0.0) — "uçuş yok" ile "uçuş planlandı" aynı renkti.
  neutralSoft: '#F6F7F6', stripQuiet: '#EDE7DC', dangerBorder: '#F1D9D3',
  // Bildirim kanalları — marka işaretleri, durum rengi değil.
  // `whatsappInk` markanın kendi yeşili DEĞİL: #25D366 açık zeminde 1.77.
  sms: '#1B5FB8', smsSoft: '#E4EEFB',
  whatsappInk: '#0F7A42', whatsappSoft: '#E6F6EC',
};

// Tailwind adı → kanonik ad.
const MAP = {
  'surface.bg': 'bg', 'surface.DEFAULT': 'surface', 'surface.alt': 'surfaceAlt',
  'surface.border': 'border', 'surface.borderstrong': 'borderStrong',
  'surface.neutral': 'neutralSoft', 'surface.quiet': 'stripQuiet', 'surface.dangerborder': 'dangerBorder',
  'wa.50': 'whatsappSoft', 'wa.700': 'whatsappInk', 'sms.50': 'smsSoft', 'sms.700': 'sms',
  'ink.DEFAULT': 'ink', 'ink.soft': 'inkSoft', 'ink.muted': 'inkMuted',
  'brand.600': 'primary', 'brand.700': 'primaryDark', 'brand.50': 'primarySoft',
  'accent.600': 'accent', 'accent.50': 'accentSoft', 'accent.800': 'accentText',
  'ok.600': 'success', 'ok.50': 'successSoft', 'ok.800': 'successText',
  'warn.600': 'warning', 'warn.50': 'warningSoft', 'warn.800': 'warningText',
  'bad.600': 'danger', 'bad.50': 'dangerSoft', 'bad.800': 'dangerText',
};

const cfg = readFileSync(join(root, 'tailwind.config.js'), 'utf8');

console.log('[1] Palet kanonik değerlerle aynı');
for (const [twPath, canonKey] of Object.entries(MAP)) {
  const [group, key] = twPath.split('.');
  // Grubu bul, içinde anahtarı ara. Değerler tek satırda birden fazla olabilir.
  const gm = cfg.match(new RegExp(`${group}:\\s*\\{[\\s\\S]*?\\}`));
  const found = gm && gm[0].match(new RegExp(`${key}:\\s*'(#[0-9A-Fa-f]{6})'`));
  check(`${twPath} = ${CANON[canonKey]}`,
    !!found && found[1].toUpperCase() === CANON[canonKey].toUpperCase(),
    found ? `bulunan ${found[1]}` : 'tanımlı değil');
}

console.log('\n[2] Font ve şekil');
check('Manrope kullanılıyor', /fontFamily:\s*\{\s*sans:\s*\['Manrope'/.test(cfg));
check('index.html Manrope yüklüyor',
  /fonts\.googleapis\.com\/css2\?family=Manrope/.test(readFileSync(join(root, 'index.html'), 'utf8')),
  'font tanımlı ama hiç indirilmiyorsa sistem fontuna düşer');
check('kart radius 16', /card:\s*'16px'/.test(cfg));
check('kontrol radius 12', /control:\s*'12px'/.test(cfg));

// KONTRAST — sayı olarak ölçülür, gözle değil. Bu projede `inkMuted` iki kez
// AA altında kaldı: önce #A8A29E (beyazda 2.7), sonra #7C756C — o da yalnız
// SAF BEYAZ kartta geçiyordu, uygulamanın kendi zemininde (#FAF8F5) 4.29'du.
console.log('\n[3] Kontrast AA (küçük metin 4.5:1)');
function lum(hex) {
  const c = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
function ratio(a, b) {
  const [l1, l2] = [lum(a), lum(b)];
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
const SURFACES = [['surface', CANON.surface], ['bg', CANON.bg], ['surfaceAlt', CANON.surfaceAlt]];
for (const [name, bgHex] of SURFACES) {
  for (const inkKey of ['ink', 'inkSoft', 'inkMuted']) {
    const r = ratio(CANON[inkKey], bgHex);
    check(`${inkKey} / ${name} = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
  }
}
// Dolu zemin + beyaz metin (buton, şerit).
for (const key of ['primary', 'accent', 'success', 'warning', 'danger']) {
  const r = ratio(CANON[key], '#FFFFFF');
  check(`${key} + beyaz metin = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
}
// Rozet: soft zemin + koyu metin.
for (const [t, b] of [['primaryDark', 'primarySoft'], ['successText', 'successSoft'],
                      ['warningText', 'warningSoft'], ['dangerText', 'dangerSoft'],
                      ['accentText', 'accentSoft']]) {
  const r = ratio(CANON[t], CANON[b]);
  check(`${t} / ${b} = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
}

// Kanal renkleri okunur mu (ikon + kanal adı aynı tonda basılıyor → METİN
// eşiği geçerli). WhatsApp markasının kendi yeşili burada KULLANILAMAZ;
// kapı bunu sayıyla tutuyor ki biri "marka rengi olsun" diye geri koymasın.
for (const [t, b] of [['sms', 'smsSoft'], ['whatsappInk', 'whatsappSoft'],
                      ['inkSoft', 'stripQuiet'], ['inkSoft', 'neutralSoft']]) {
  const r = ratio(CANON[t], CANON[b]);
  check(`${t} / ${b} = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
}

// CIE76 ΔE — "bu iki ton birbirinden ayırt edilebiliyor mu". Kontrast oranı
// bunu ÖLÇMEZ: iki ton beyaza karşı aynı kontrastı verip birbirinin aynısı
// olabilir, ki eski palette tam olarak bu oldu (ΔE 0.0).
function deltaE(a, b) {
  const toLab = (hex) => {
    const [r, g, bl] = [1, 3, 5].map((i) => parseInt(hex.substr(i, 2), 16) / 255)
      .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    const x = (r * 0.4124 + g * 0.3576 + bl * 0.1805) / 0.95047;
    const y = r * 0.2126 + g * 0.7152 + bl * 0.0722;
    const z = (r * 0.0193 + g * 0.1192 + bl * 0.9505) / 1.08883;
    const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
    return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
  };
  const [A, B] = [toLab(a), toLab(b)];
  return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]);
}

// AYIRT EDİLEBİLİRLİK — kontrast YETMEZ. Eski palette her ton AA geçiyordu ama
// kullanıcı "hangisinin ne olduğu belli olmuyor" diye bildirdi. Mobil kapıda
// birebir aynı kontrol var.
const SERIT = { active: CANON.primary, landed: CANON.success, cancelled: CANON.danger,
                diverted: CANON.warning, scheduled: CANON.stripQuiet, tur: CANON.neutralSoft };
const adlar = Object.keys(SERIT);
for (let i = 0; i < adlar.length; i++) {
  for (let j = i + 1; j < adlar.length; j++) {
    const d = deltaE(SERIT[adlar[i]], SERIT[adlar[j]]);
    check(`şerit ${adlar[i]} ↔ ${adlar[j]} = ΔE ${d.toFixed(1)}`, d >= 6,
      'iki şerit tonu gözle ayrılmıyor (ΔE 6 altı)');
  }
}

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
