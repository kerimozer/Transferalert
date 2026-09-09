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
  // ŞERİT TONLARI (2026-09-09, "ağırlık" kararı — bkz. design/renk-ayrimi/
  // KARAR-AGIRLIK.md). Bir tur önce DOLUYDU (bg-ok-600 + beyaz metin) ve geri
  // alındı: dolu bant tek kartta harika, alt alta on kartta dayanılmaz. Eski
  // `*-50` tonlarına da DÖNÜLMEDİ — ölçüldü ve elendi (Havada ↔ İndi ΔE 4.1).
  neutralSoft: '#F5F6F4', stripQuiet: '#E9DFCB', dangerBorder: '#F1D9D3',
  stripAir: '#D8E8EA', stripLanded: '#DCE9CE',
  stripCancelled: '#F3D9CF', stripDiverted: '#F7E3B8',
  // Zeytin ve koyu kehribar mürekkebi — `ok.800`/`warn.800` ödünç ALINMADI:
  // onlar bu zeminlerde hiç ölçülmedi.
  stripLandedInk: '#3B5A21', stripDivertedInk: '#6B3E08',
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
  'strip.air': 'stripAir', 'strip.landed': 'stripLanded',
  'strip.cancelled': 'stripCancelled', 'strip.diverted': 'stripDiverted',
  'strip.oliveink': 'stripLandedInk', 'strip.amberink': 'stripDivertedInk',
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
// ŞERİT metin/zemin çiftleri: şerit artık DOLU DEĞİL, yani beyaz metin yok —
// her zeminin kendi koyu mürekkebi var ve her biri AYRI ölçülür. "Beyaz metin
// hepsinde geçiyordu" güvencesi bu palette ARTIK GEÇERSİZ.
for (const [t, b] of [['sms', 'smsSoft'], ['whatsappInk', 'whatsappSoft'],
                      ['inkSoft', 'stripQuiet'], ['inkSoft', 'neutralSoft'],
                      ['primaryDark', 'stripAir'], ['stripLandedInk', 'stripLanded'],
                      ['dangerText', 'stripCancelled'], ['stripDivertedInk', 'stripDiverted']]) {
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
const SERIT = { active: CANON.stripAir, landed: CANON.stripLanded, cancelled: CANON.stripCancelled,
                diverted: CANON.stripDiverted, scheduled: CANON.stripQuiet, tur: CANON.neutralSoft };
const adlar = Object.keys(SERIT);
for (let i = 0; i < adlar.length; i++) {
  for (let j = i + 1; j < adlar.length; j++) {
    const d = deltaE(SERIT[adlar[i]], SERIT[adlar[j]]);
    check(`şerit ${adlar[i]} ↔ ${adlar[j]} = ΔE ${d.toFixed(1)}`, d >= 6,
      'iki şerit tonu gözle ayrılmıyor (ΔE 6 altı)');
  }
}

// AĞIRLIK — AYRIMDAN AYRI BİR ÖLÇÜ, ve bu kapının ASIL varlık sebebi.
// 2026-09-09'da şikâyet "tonlar birbirine yakın"dı; ölçüm tonların ΔE 27 ile
// zaten UZAK olduğunu, asıl sorunun AĞIRLIK olduğunu gösterdi (şeritler
// L* 36–43, sayfa zemini L* 97.7 → göz satırları değil BANTLARI okuyor).
// Yukarıdaki ΔE kapısı doygun bir paleti sorunsuz geçirir; dolu banda dönüşü
// YAKALAYAMAZ. Bu kontrol tam olarak onun için var. Mobil ikizinde de aynısı.
console.log('\n[4] Şerit AĞIRLIĞI — sayfa zemini üstünde sakin');
for (const [ad, hex] of Object.entries(SERIT)) {
  const r = ratio(hex, CANON.bg);
  check(`şerit ${ad} / sayfa = ${r.toFixed(2)}`, r <= 1.6,
    'şerit sayfadan çok ağır — alt alta on kartta bant gibi okunur');
}

// TANIM VAR ≠ DOĞRU YERDE KULLANILIYOR. [1] yalnız token'ın tailwind.config'de
// TANIMLI olduğunu görür; FLIGHT_STRIP eski `bg-ok-600`u kullanmaya devam etse
// [1] yine yeşil kalırdı. Kapı, tanımı değil KULLANIMI de görmeli.
console.log('\n[5] FLIGHT_STRIP gerçekten şerit sınıflarını kullanıyor');
const statusSrc = readFileSync(join(root, 'src', 'lib', 'status.js'), 'utf8');
const stripBlock = statusSrc.match(/export const FLIGHT_STRIP = \{[\s\S]*?\n\};/);
check('FLIGHT_STRIP bulundu', !!stripBlock);
if (stripBlock) {
  for (const cls of ['bg-surface-quiet', 'bg-strip-air', 'bg-strip-landed',
                     'bg-strip-cancelled', 'bg-strip-diverted',
                     'text-strip-oliveink', 'text-strip-amberink']) {
    check(`FLIGHT_STRIP ${cls} kullanıyor`, stripBlock[0].includes(cls));
  }
  // Dolu banda dönüş token silinmeden de olabilir: `bg-ok-600` yazmak yeter.
  check('şeritte DOLU marka/durum zemini yok',
    !/bg-(brand|ok|bad|warn|accent)-600\b/.test(stripBlock[0]),
    'dolu şerit 2026-09-09\'da ölçülerek geri alındı (ağırlık 5.35–7.08)');
  check('şeritte beyaz metin yok', !/text-white\b/.test(stripBlock[0]),
    'açık zeminde beyaz metin okunmaz');
}

// A0'ın 2. maddesi ("biten kayıtta şerit susar") DAVRANIŞTIR, bir hex değil —
// ve önceki turda hiçbir kapısı YOKTU. Kural iki depoda kopyalanmış olduğu için
// (mobil ikizi `src/theme.js` → `stripTone`) kapısız bırakmak, aynı transferin
// iki platformda farklı görünmesi demekti.
console.log('\n[6] stripTone davranışı — biten iş susar');
{
  const { stripTone, FLIGHT_STRIP, TYPE_TONE } =
    await import(new URL('../src/lib/status.js', import.meta.url));
  const res = (status, flight_status) => ({
    status, latest_status: flight_status ? { flight_status } : null,
  });

  check('canlı veri yok → tür tonu', stripTone(res('active', null)) === TYPE_TONE);
  check('aktif + indi → İNDİ tonu (bağırır)',
    stripTone(res('active', 'landed')) === FLIGHT_STRIP.landed);
  check('BİTEN + indi → tür tonu (susar)',
    stripTone(res('completed', 'landed')) === TYPE_TONE,
    'A0 madde 2: biten işte uçuşun inmiş olması eski haber');
  check('BİTEN + havada → tür tonu (susar)',
    stripTone(res('completed', 'active')) === TYPE_TONE);
  // İPTAL bilinçli olarak KAPSAM DIŞI: hâlâ dikkat isteyen bir durum.
  check('iptal + iptal → İPTAL tonu (susmaz)',
    stripTone(res('cancelled', 'cancelled')) === FLIGHT_STRIP.cancelled);
  check('bilinmeyen uçuş durumu → planlandı tonuna düşer',
    stripTone(res('active', 'kayip_deger')) === FLIGHT_STRIP.scheduled);
  check('kayıt yoksa çökmez', stripTone(null) === TYPE_TONE);

  // ŞERİT METİNLERİ TONU MİRAS ALMALI, kendi rengini SABİTLEMEMELİ. Bozuk
  // tarihteki "—" işareti `text-ink-muted` ile sabitlenmişti ve yeni açık
  // zeminlerin BEŞİNDE AA altına düşüyordu (4.15–4.42); mobil ikizi aynı metni
  // tonun mürekkebiyle basıyordu, yani iki platform ayrışmıştı.
  // YORUMLAR SOYULUR: bu kuralın GEREKÇESİ yorumda `text-ink-muted` sınıfını
  // adıyla anıyor. Ham metinde arayan ilk hâl tam da o gerekçe yüzünden
  // kırmızı yanıyordu — kapı kodu değil kendi açıklamasını ölçüyordu.
  const strip = readFileSync(join(root, 'src', 'components', 'ui', 'StatusStrip.jsx'), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  check('şeritte sabitlenmiş mürekkep rengi yok',
    !/text-ink-(muted|soft)\b/.test(strip),
    'şerit metinleri tonun rengini miras almalı — sabit renk açık zeminde AA altına düşer');
}

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
