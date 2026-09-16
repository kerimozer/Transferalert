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
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Ağaç gezici ve yorum soyucu MODÜL SEVİYESİNDE: aynı iki yardımcının blok
// içine gömülü kopyaları vardı ve üçüncü bir kullanıcı doğduğunda biri
// unutulurdu.
const walkSrc = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walkSrc(p) : (/\.jsx?$/.test(n) ? [p] : []);
});
// YORUMLAR SOYULUR — metin tarayan her kapı önce bunu yapmalı, yoksa kapı
// KENDİ AÇIKLAMASINI ölçer (bu projede beş kez yaşandı).
const stripComments = (s) => s
  .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
  .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(Math.max(0, m.length - p.length)));

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
  // Girdi sınırı — WCAG 1.4.11 (≥3:1). AYRI token: ikincil butonlar
  // `borderStrong`de kalır, yoksa "sert border yok" ilkesi bozulur.
  inputBorder: '#918676',
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
  neutralSoft: '#F1EEE9', stripQuiet: '#F7E6BC', stripQuietInk: '#6B4A08',
  dangerBorder: '#F1D9D3',
  stripAir: '#C2DFE6', stripLanded: '#C9E2B2',
  stripCancelled: '#F7CCBB', stripDiverted: '#F5C88F',
  // Zeytin ve koyu kehribar mürekkebi — `ok.800`/`warn.800` ödünç ALINMADI:
  // onlar bu zeminlerde hiç ölçülmedi.
  stripLandedInk: '#31521A', stripDivertedInk: '#6B3E08',
  // BİTEN işin şeridi — kendi renginin sakin hâli (2026-09-11).
  doneScheduled: '#EAE0C6',
  doneAir: '#DCEAEF', doneAirInk: '#33525C',
  doneLanded: '#D4E5C1', doneLandedInk: '#3F5530',
  doneCancelled: '#F3D6CA', doneCancelledInk: '#7E4A40',
  doneDiverted: '#F5DAAB', doneDivertedInk: '#6B5026',
  // Bildirim kanalları — marka işaretleri, durum rengi değil.
  // `whatsappInk` markanın kendi yeşili DEĞİL: #25D366 açık zeminde 1.77.
  sms: '#1B5FB8', smsSoft: '#E4EEFB',
  whatsappInk: '#0F7A42', whatsappSoft: '#E6F6EC',
  onFill: '#FFFFFF', segmentActive: '#FFFFFF',
};

// Tailwind adı → kanonik ad.
const MAP = {
  'surface.bg': 'bg', 'surface.DEFAULT': 'surface', 'surface.alt': 'surfaceAlt',
  'surface.border': 'border', 'surface.borderstrong': 'borderStrong',
  'surface.inputborder': 'inputBorder',
  'surface.neutral': 'neutralSoft', 'surface.quiet': 'stripQuiet', 'surface.dangerborder': 'dangerBorder',
  'strip.air': 'stripAir', 'strip.landed': 'stripLanded',
  'strip.cancelled': 'stripCancelled', 'strip.diverted': 'stripDiverted',
  'strip.oliveink': 'stripLandedInk', 'strip.amberink': 'stripDivertedInk',
  'strip.sandink': 'stripQuietInk',
  'done.scheduled': 'doneScheduled',
  'done.air': 'doneAir', 'done.airink': 'doneAirInk',
  'done.landed': 'doneLanded', 'done.landedink': 'doneLandedInk',
  'done.cancelled': 'doneCancelled', 'done.cancelledink': 'doneCancelledInk',
  'done.diverted': 'doneDiverted', 'done.divertedink': 'doneDivertedInk',
  'wa.50': 'whatsappSoft', 'wa.700': 'whatsappInk', 'sms.50': 'smsSoft', 'sms.700': 'sms',
  'ink.DEFAULT': 'ink', 'ink.soft': 'inkSoft', 'ink.muted': 'inkMuted',
  'brand.600': 'primary', 'brand.700': 'primaryDark', 'brand.50': 'primarySoft',
  'accent.600': 'accent', 'accent.50': 'accentSoft', 'accent.800': 'accentText',
  'ok.600': 'success', 'ok.50': 'successSoft', 'ok.800': 'successText',
  'warn.600': 'warning', 'warn.50': 'warningSoft', 'warn.800': 'warningText',
  'bad.600': 'danger', 'bad.50': 'dangerSoft', 'bad.800': 'dangerText',
  // YENİ İKİLİ (2026-09-12, A1). Gündüz değerleri de ölçülür: ilk hâlde
  // yalnız gece bölümü ölçüyordu ve denetimde `--c-onfill: 0 0 0` yapıldığında
  // her birincil butonun yazısı 2.14 kontrasta düştüğü hâlde kapı 313/313
  // yeşil kaldı.
  'onfill.DEFAULT': 'onFill', 'segmentactive.DEFAULT': 'segmentActive',
};

const cfg = readFileSync(join(root, 'tailwind.config.js'), 'utf8');

// DEĞERLER ARTIK `src/index.css`TE (2026-09-12, A1 gece modu): tailwind.config
// yalnız adı `rgb(var(--c-x) / <alpha-value>)`e bağlıyor. Kapı da kaynağı
// oradan okur — config'i okumaya devam etseydi hex bulamayıp "tanımlı değil"
// derdi ve paletin GERÇEK değerleri hiç ölçülmemiş olurdu.
//
// İKİ PALET BİRDEN: `:root` gündüz, `prefers-color-scheme: dark` bloğu gece.
// Yalnız biri ölçülseydi diğeri kapıya görünmeden canlıya çıkardı.
const css = readFileSync(join(root, 'src', 'index.css'), 'utf8');
function paletOku(blok) {
  const p = {};
  for (const m of blok.matchAll(/--c-([\w-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    p[m[1]] = '#' + [m[2], m[3], m[4]]
      .map((v) => Number(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  }
  return p;
}
// BLOKLAR AYRI AYRI OKUNUR, "şu noktaya kadar olan her şey" DEĞİL. İlk hâli
// gündüzü "dark media query'sinden öncesi" diye tanımlıyordu; araya YAZDIRMA
// bloğu girince (`--c-surface-bg: 255 255 255`) gündüz paleti sessizce onun
// değerlerini aldı ve kapı sayfa zeminini beyaz sandı. Bir bloğu konumuyla
// tanımlamak, araya üçüncü bir blok girdiği gün bozulur.
const blokAl = (bas) => {
  const i = css.indexOf(bas);
  if (i < 0) return '';
  const a = css.indexOf('{', i);
  let derinlik = 0;
  for (let j = a; j < css.length; j++) {
    if (css[j] === '{') derinlik++;
    else if (css[j] === '}' && --derinlik === 0) return css.slice(a, j);
  }
  return '';
};
// GECE BLOĞU ARTIK `@media (prefers-color-scheme: dark)` DEĞİL (A6):
// elle seçim eklenince palet `<html data-theme>` damgasına bağlandı. Tek
// blok, tek tanım — üç durumlu CSS gece paletini İKİ KEZ yazmayı
// gerektirirdi ve bu projede kopyalanan her tanım er geç ayrıştı.
const geceBlok = blokAl(':root[data-theme="dark"]');
// HIZLI DURUŞ: blok bulunamazsa aşağıdaki 50 kontrol `undefined` üzerinde
// koşup anlamsız bir TypeError'la çöküyor. Kapının kırılma SEBEBİ okunabilir
// olmalı — "neden kırıldı" sorusuna cevap vermeyen bir kapı, kırıldığında da
// yardımcı olmaz.
if (!geceBlok) {
  console.log('  ✗ gece paleti bloğu yok (:root[data-theme="dark"]) — A6 damgası kaldırılmış');
  process.exit(1);
}
const yazdirBlok = blokAl('@media print');
const GUNDUZ_CSS = paletOku(blokAl(':root'));
const GECE_CSS = paletOku(geceBlok);

// Tailwind ADI → CSS değişken adı. `surface.DEFAULT` → `--c-surface`.
const cssAdi = (twPath) => {
  const [g, k] = twPath.split('.');
  return k === 'DEFAULT' ? g : `${g}-${k.toLowerCase()}`;
};

console.log('[1] Palet kanonik değerlerle aynı (gündüz, src/index.css)');
for (const [twPath, canonKey] of Object.entries(MAP)) {
  const ad = cssAdi(twPath);
  const found = GUNDUZ_CSS[ad];
  check(`${twPath} = ${CANON[canonKey]}`,
    !!found && found.toUpperCase() === CANON[canonKey].toUpperCase(),
    found ? `bulunan ${found}` : `--c-${ad} tanımlı değil`);
  // VE TAILWIND O DEĞİŞKENE GERÇEKTEN BAĞLI OLMALI. Değişken doğru, config
  // başka bir yere bakıyor olabilirdi — o zaman palet "doğru ama bağlantısız"
  // olurdu ve hiçbir sayfa onu kullanmazdı.
  check(`${twPath} → --c-${ad} bağlı`, cfg.includes(`t('${ad}')`),
    'tailwind.config bu değişkene bağlamıyor');
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
                      ['dangerText', 'stripCancelled'], ['stripDivertedInk', 'stripDiverted'],
                      ['stripQuietInk', 'stripQuiet'],
                      // BİTEN şeritleri de metin taşıyor — ayrı ölçülür.
                      ['inkSoft', 'doneScheduled'], ['doneAirInk', 'doneAir'],
                      ['doneLandedInk', 'doneLanded'], ['doneCancelledInk', 'doneCancelled'],
                      ['doneDivertedInk', 'doneDiverted']]) {
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
    // EŞİK 6 DEĞİL 12 (2026-09-11). 6 "zar zor ayırt edilir" demek ve MUTLAK
    // bir taban olduğu için GERİLEMEYİ göremedi: palet 27.2'den 7.8'e düştü
    // (%71 kayıp), kapı yeşil kaldı ve kullanıcı üçüncü kez "renkler birbirine
    // yakın" dedi. Bir kapı "yeterince iyi mi" diye soruyorsa "dünden kötü mü"
    // sorusunu sormaz. 12 = "bakışta ayırt edilir"; ölçülen en yakın çift 14.4.
    check(`şerit ${adlar[i]} ↔ ${adlar[j]} = ΔE ${d.toFixed(1)}`, d >= 12,
      'iki şerit tonu gözle ayrılmıyor');
  }
}

// AĞIRLIK — AYRIMDAN AYRI BİR ÖLÇÜ, ve bu kapının ASIL varlık sebebi.
// 2026-09-09'da şikâyet "tonlar birbirine yakın"dı; ölçüm tonların ΔE 27 ile
// zaten UZAK olduğunu, asıl sorunun AĞIRLIK olduğunu gösterdi (şeritler
// L* 36–43, sayfa zemini L* 97.7 → göz satırları değil BANTLARI okuyor).
// Yukarıdaki ΔE kapısı doygun bir paleti sorunsuz geçirir; dolu banda dönüşü
// YAKALAYAMAZ. Bu kontrol tam olarak onun için var. Mobil ikizinde de aynısı.
// GİRDİ SINIRI — WCAG 1.4.11, metin DEĞİL bileşen sınırı kuralı: bir girdiyi
// TANIMLAYAN kenarlık komşu renkten ≥3:1 ayrılmalı. `borderstrong` beyaz kartta
// 1.52 veriyordu ve girdinin zemini de beyaz olduğu için alanı gösteren başka
// hiçbir işaret yoktu — form alanı fiilen görünmüyordu (denetçi B11).
// HER zeminde ölçülür: "beyazda geçiyor mu" yetmez.
console.log('\n[3b] Girdi sınırı görünür (WCAG 1.4.11, ≥3:1)');
for (const [ad, zemin] of [['kart', CANON.surface], ['sayfa', CANON.bg], ['surfaceAlt', CANON.surfaceAlt]]) {
  const r = ratio(CANON.inputBorder, zemin);
  check(`girdi sınırı / ${ad} = ${r.toFixed(2)}`, r >= 3, 'WCAG 1.4.11 eşiği 3.0');
}
// Ve girdiler bu tokenı GERÇEKTEN kullanmalı — tanım var ≠ kullanılıyor.
{
  const walkSrc = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walkSrc(p) : (/\.jsx?$/.test(n) ? [p] : []);
  });
  // YORUMLAR SOYULUR — bu turda BEŞİNCİ kez: ilk hâli ham metinde arıyordu ve
  // bir girdinin içine "eskiden borderstrong idi" diye AÇIKLAMA yazmak CI'ı
  // kırıyordu. Metin tarayan her kapı önce yorumları atmalı (CLAUDE.md).
  const kodu = (s) => s
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '))
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + ' '.repeat(Math.max(0, m.length - p.length)));

  const kacak = [];
  for (const f of walkSrc(join(root, 'src'))) {
    const ad = f.split(/[\\/]/).pop();
    const s = kodu(readFileSync(f, 'utf8'));

    // (a) Doğrudan etiket üzerinde yazılmış sınıf.
    for (const m of s.matchAll(/border-surface-borderstrong/g)) {
      const tagBas = s.lastIndexOf('<', m.index);
      const tag = tagBas === -1 ? '' : (s.slice(tagBas, tagBas + 12).match(/^<\s*([A-Za-z]+)/)?.[1] || '');
      if (['input', 'textarea', 'select'].includes(tag.toLowerCase())) {
        kacak.push(`${ad}:${s.slice(0, m.index).split('\n').length}`);
      }
    }

    // (b) PAYLAŞILAN SINIF SABİTİ — kapının en büyük kör noktası buydu.
    // Denetimde `Field.jsx` + `RequestPage` + `PartnerPortalPage` içindeki
    // `inputCls` sabitleri eski tokena döndürüldü ve kapı 161/161 YEŞİL
    // kaldı; oysa o üç sabit 33 girdiyi besliyor (ortak `<Field>`in 19 çağrı
    // yeri dahil). Sabitin önündeki `<` ilgisiz bir etiket olduğu için
    // etiket komşuluğuna bakan kontrol onu göremiyordu.
    //
    // Sabiti ADIYLA değil ŞEKLİYLE yakala: değeri girdi reçetesi gibi duran
    // (`w-full` + `border`) her sınıf sabiti bir girdi sınıfı sayılır.
    for (const m of s.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*(['"`])([\s\S]*?)\2/g)) {
      const [, isim, , deger] = m;
      if (!deger.includes('border-surface-borderstrong')) continue;
      const girdiReceti = /\bw-full\b/.test(deger) || /input/i.test(isim);
      if (girdiReceti) {
        kacak.push(`${ad}:${s.slice(0, m.index).split('\n').length} (${isim} sabiti)`);
      }
    }
  }
  check('hiçbir girdi eski (görünmez) sınırı kullanmıyor', kacak.length === 0, kacak.join(', '));
}

// ── [3c] ODAK HALKASI — WCAG 2.4.11 / 1.4.11 (A7, 2026-09-12) ─────────────
//
// NEDEN VAR: `src/` altında 47 yerde elle kopyalanmış reçete marka tonunun
// %30 saydam hâlini kullanıyordu ve kart zeminine karşı GÜNDÜZ 1.64, GECE
// 1.81 veriyordu (eşik 3.0). Yanındaki `outline-none` tarayıcının kendi
// göstergesini de kaldırdığı için klavyeyle gezen kullanıcıya HİÇBİR işaret
// kalmıyordu. B11 turunda girdi kenarlığı ölçülüp düzeltilirken bu çifte
// hiç bakılmadı — çünkü odak halkasını ölçen bir kapı YOKTU.
//
// KAPININ BELKEMİĞİ: reçete metninden rengi çözerken OPAKLIK SON EKİ de
// okunur ve varsa zeminle KARIŞTIRILIR. Yalnız token adına bakan bir kontrol,
// biri `/30`i geri yazdığı gün opak değeri ölçüp yeşil kalırdı — bu projenin
// `placeholderTextColor` turunda düştüğü hatanın birebir aynısı ("prop var mı"
// diye sorup DEĞERİNE bakmamak).
console.log('\n[3c] Odak halkası görünür (WCAG 2.4.11 / 1.4.11, ≥3:1)');
{
  const { FOCUS, FOCUS_INSET } = await import(new URL('../src/lib/focus.js', import.meta.url));

  // ZEMİN OLABİLEN HER TOKEN. Üç yüzeyle yetinmek, "beyazda geçiyor mu"
  // sorusunun ikizi olurdu: kontroller yumuşak rozet zeminlerinin, segment
  // rayının ve şeritlerin üstünde de duruyor. `*border*` token'ları zemin
  // DEĞİL (çizgi) — onlar ayrıca aşağıda boşluk kuralıyla ele alınıyor.
  const zeminMi = (k) => !/border/.test(k) && (
    /^(surface|segmentactive)/.test(k) || /-50$/.test(k) ||
    (/^(strip|done)-/.test(k) && !/ink$/.test(k)));

  const karistir = (on, arka, a) => {
    const oku = (h) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16));
    const [f, b] = [oku(on), oku(arka)];
    return '#' + f.map((v, i) => Math.round(a * v + (1 - a) * b[i])
      .toString(16).padStart(2, '0')).join('').toUpperCase();
  };

  // Reçeteyi ÇÖZÜMLE: genişlik, renk (+opaklık), boşluk, içe-çizim.
  const coz = (recete) => {
    const t = recete.trim().split(/\s+/);
    const bul = (re) => t.map((x) => re.exec(x)).find(Boolean);
    const en = bul(/^focus(?:-visible)?:ring-(\d+)$/);
    const renk = bul(/^focus(?:-visible)?:ring-((?!inset$|offset-)[a-z]+(?:-\d+)?)(?:\/(\d+))?$/);
    const bosEn = bul(/^focus(?:-visible)?:ring-offset-(\d+)$/);
    const bosRenk = bul(/^focus(?:-visible)?:ring-offset-((?![0-9])[a-z]+(?:-\d+)?)$/);
    return {
      tokens: t,
      outlineNone: t.includes('focus:outline-none'),
      en: en ? Number(en[1]) : 0,
      renk: renk ? renk[1] : null,
      opaklik: renk && renk[2] ? Number(renk[2]) / 100 : 1,
      bosEn: bosEn ? Number(bosEn[1]) : 0,
      bosRenk: bosRenk ? bosRenk[1] : null,
      inset: t.some((x) => /^focus(?:-visible)?:ring-inset$/.test(x)),
      // Fare tıklamasında patlamaması için halka `focus-visible` olmalı.
      gorunurVaryant: t.filter((x) => /:ring/.test(x)).every((x) => x.startsWith('focus-visible:')),
    };
  };

  const R = { FOCUS: coz(FOCUS), FOCUS_INSET: coz(FOCUS_INSET) };

  for (const [ad, r] of Object.entries(R)) {
    // YERİNE KOYULANIN VARLIĞINI DA ÖLÇ: `outline-none` yasağı tek başına
    // ölçülürse, halkası silinmiş bir reçete "yasak yok" diye yeşil geçer ve
    // sonuç eskisinden DAHA sessiz bir ekran olur.
    check(`${ad}: yerel göstergeyi kaldırıyor (outline-none)`, r.outlineNone);
    check(`${ad}: halka genişliği ≥2px (${r.en})`, r.en >= 2,
      'genişlik sınıfı yoksa Tailwind hiç gölge üretmez — gösterge YOK');
    check(`${ad}: halka rengi tanımlı (${r.renk})`, !!r.renk,
      'renk sınıfı yok — halka Tailwind varsayılanına düşer');
    check(`${ad}: halka focus-visible varyantında`, r.gorunurVaryant,
      'opak halka her FARE tıklamasında patlar');
  }
  check('FOCUS dışa çizilir ve BOŞLUK taşır',
    !R.FOCUS.inset && R.FOCUS.bosEn >= 2 && !!R.FOCUS.bosRenk,
    'boşluk yoksa dolu marka butonunda halka dolguyla AYNI renk olur (1.00)');
  check('FOCUS_INSET içe çizilir ve boşluk taşımaz',
    R.FOCUS_INSET.inset && R.FOCUS_INSET.bosEn === 0,
    'içe çizilen halkada boşluk anlamsız');

  for (const [paletAd, P] of [['gündüz', GUNDUZ_CSS], ['gece', GECE_CSS]]) {
    const zeminler = Object.keys(P).filter(zeminMi);
    check(`${paletAd}: ölçülecek zemin bulundu (${zeminler.length})`, zeminler.length >= 20,
      'zemin listesi boşaldı — aşağıdaki ölçümlerin hepsi anlamsız olur');

    for (const [ad, r] of Object.entries(R)) {
      if (!r.renk || !P[r.renk]) { check(`${paletAd} ${ad}: renk palete çözülüyor`, false, r.renk); continue; }
      // EN KÖTÜ ZEMİN raporlanır; hepsini tek tek basmak 100 satır ekler.
      let enKotu = null;
      for (const z of zeminler) {
        // OPAKLIK VARSA KARIŞTIR. Kapı tam olarak bu yüzden `/30`i yakalar.
        const halka = r.opaklik < 1 ? karistir(P[r.renk], P[z], r.opaklik) : P[r.renk];
        const o = ratio(halka, P[z]);
        if (!enKotu || o < enKotu[1]) enKotu = [z, o];
      }
      check(`${paletAd} ${ad}: en kötü zemin ${enKotu[0]} = ${enKotu[1].toFixed(2)}`,
        enKotu[1] >= 3, 'WCAG 2.4.11 eşiği 3.0 — klavye kullanıcısı nerede olduğunu görmüyor');
    }

    // BOŞLUK YIĞINI: dolu marka butonunda halka dolguyla aynı renktir
    // (kontrast 1.00). Görünürlüğü boşluk sağlıyor — ölçülmezse biri boşluğu
    // "gereksiz" diye kaldırır ve birincil butonun odağı yok olur.
    const bos = P[R.FOCUS.bosRenk];
    check(`${paletAd}: boşluk / dolu marka butonu = ${ratio(bos, P['brand-600']).toFixed(2)}`,
      ratio(bos, P['brand-600']) >= 3, 'dolu butonda halka görünmez');
    check(`${paletAd}: halka / boşluk = ${ratio(P[R.FOCUS.renk], bos).toFixed(2)}`,
      ratio(P[R.FOCUS.renk], bos) >= 3, 'halka boşluktan ayrılmıyor');
    // Boşluğun KENDİ ZEMİNİNDEN sapması aşağıda, ÇAĞRI YERLERİNDEN türetilerek
    // ölçülüyor. Burada elle yazılmış iki zeminle yetinmek ("dosya adına
    // çivileme" hatasının renk ikizi) yarın `warn-50` üstüne konan bir
    // kontrolü göremezdi.
  }

  // ── KULLANIM SÖZLEŞMESİ ────────────────────────────────────────────────
  // Değeri ölçmek YETMEZ: reçete doğru olup 47 çağrı yeri eski dizeyi
  // taşımaya devam edebilir. Kural ŞEKLE bakıyor, dosya adına DEĞİL —
  // "yarın eklenecek sayfa bunu geçer mi?" sorusunun cevabı EVET olmalı.
  //
  // Değişmez: YEREL ODAK GÖSTERGESİNİ BASTIRAN HİÇBİR KONTROL, ÖLÇÜLMÜŞ
  // REÇETEYİ ALMADAN BUNU YAPAMAZ.
  {
    const ihlal = [];
    for (const f of walkSrc(join(root, 'src'))) {
      const rel = relative(root, f).split(/[\\/]/).join('/');
      if (rel.endsWith('src/lib/focus.js')) continue;   // tanımın kendisi
      const s = stripComments(readFileSync(f, 'utf8'));

      // (a) Odak sınıfı ELLE yazılmış. Tek kaynak dışında hiçbir yerde
      //     `focus:ring-*` / `focus:outline-*` olamaz.
      for (const m of s.matchAll(/focus(?:-visible)?:(?:ring|outline)-[\w./[\]-]+/g)) {
        ihlal.push(`${rel}:${s.slice(0, m.index).split('\n').length} elle yazılmış "${m[0]}"`);
      }

      // (b) `outline-none` ÖNEKSİZ de yazılabilir ve kuralı atlar. Muafiyet
      //     EN DAR birimde ve GEREKÇEYE bağlı: yalnız klavyeyle gezilemeyen,
      //     programla odaklanan kapsayıcı (`tabIndex={-1}` — modal paneli).
      //     Dosya adıyla muafiyet vermek kalıcı serbest bölge açardı.
      for (const m of s.matchAll(/(?<![\w:-])outline-none\b/g)) {
        const bas = s.lastIndexOf('<', m.index);
        const etiket = bas < 0 ? '' : s.slice(bas, m.index + 200);
        if (/tabIndex=\{-1\}/.test(etiket)) continue;
        ihlal.push(`${rel}:${s.slice(0, m.index).split('\n').length} çıplak "outline-none"`);
      }

      // (c) `outline: none` / `outline-0` YASAK: Tailwind'in `outline-none`u
      //     saydam bir 2px kenar bırakıyor ve `forced-colors` modunda sistem
      //     rengine boyanıyor. Bu ikisi o emniyeti yok eder ve Yüksek
      //     Kontrast kullanıcısını göstergesiz bırakır.
      for (const m of s.matchAll(/outline:\s*none|(?<![\w:-])outline-0\b/g)) {
        ihlal.push(`${rel}:${s.slice(0, m.index).split('\n').length} "${m[0]}" (forced-colors emniyetini siler)`);
      }
    }
    check('odak göstergesini bastıran her kontrol ölçülmüş reçeteyi kullanıyor',
      ihlal.length === 0, '\n      ' + ihlal.join('\n      '));
  }

  // TÜKETİCİ DE OKUNUR. Paylaşılan girdi sınıfı sabitleri (ortak `<Field>`in
  // 19 çağrı yeri dahil 33 girdiyi besliyorlar) reçeteyi GERÇEKTEN
  // enterpolasyon ediyor mu? `[3b]`nin acı dersi: sabitin içine bakmayan bir
  // kapı, 33 girdi korumasız kalırken 161/161 yeşil kaldı.
  {
    const kacak = [];
    for (const f of walkSrc(join(root, 'src'))) {
      const rel = relative(root, f).split(/[\\/]/).join('/');
      if (rel.endsWith('src/lib/focus.js')) continue;
      const s = stripComments(readFileSync(f, 'utf8'));
      // ATAMANIN TAMAMI OKUNUR, İLK DİZE PARÇASI DEĞİL. İlk hâli tek bir dize
      // sabiti yakalıyordu ve `Field.jsx`in ÜÇ PARÇALI birleştirmesinde
      // yalnız birinci parçayı görüp reçeteyi kaçırdı — yani kapı yanlış
      // sebepten KIRMIZI yandı. Bir sınıf sabitinin değeri birden fazla
      // parçadan oluşabilir.
      //
      // `<` ya da `=>` taşıyan atamalar elenir: onlar JSX/fonksiyon, sınıf
      // sabiti değil — yoksa `[^;]*` bir bileşeni yutup yanlış alarm verirdi.
      for (const m of s.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*([^;]*);/g)) {
        const [, isim, deger] = m;
        if (/<|=>/.test(deger)) continue;
        // Girdi reçetesi şekli — `[3b]` ile aynı ölçüt.
        if (!/\bw-full\b/.test(deger) || !/\bborder\b/.test(deger)) continue;
        if (/\$\{FOCUS(?:_INSET)?\}/.test(deger)) continue;
        kacak.push(`${rel}:${s.slice(0, m.index).split('\n').length} (${isim})`);
      }
    }
    check('paylaşılan girdi sınıfı sabitleri reçeteyi taşıyor', kacak.length === 0,
      kacak.join(', ') + ' — sabit 33 girdiyi besliyor, odak halkası olmadan');
  }

  // ── ORTAK TARAYICILAR ──────────────────────────────────────────────────
  //
  // AÇILIŞ ETİKETİNİN SONU TIRNAK-FARKINDA BULUNUR. İlk hâl yalnız süslü
  // parantez derinliği sayıyordu; `title="İleri > geri"` gibi düz dizeli bir
  // nitelikteki `>` etiketi erken bitiriyordu ve o elemanın className'i
  // taramanın DIŞINDA kalıyordu. Denetimde tek karakterlik bu fark, reçetesiz
  // yeni bir dolu marka butonunu kapıdan geçirdi.
  const acilisSonu = (s, bas) => {
    let derinlik = 0, tirnak = null;
    for (let j = bas; j < s.length; j++) {
      const c = s[j];
      if (tirnak) { if (c === tirnak) tirnak = null; continue; }
      if (c === '"' || c === "'") { tirnak = c; continue; }
      if (c === '{') derinlik++;
      else if (c === '}') derinlik--;
      else if (c === '>' && derinlik === 0) return j;
    }
    return s.length;
  };

  // ODAKLANABİLİR ETİKETLER. `NavLink` listede YOKTU ve uygulamanın ANA
  // GEZİNMESİ tam olarak o etiket (`components/Layout.jsx`) — yani panelin en
  // çok Tab'lanan kontrol kümesi kapının dışındaydı.
  const ODAK_ETIKET = ['button', 'a', 'Link', 'NavLink', 'input', 'select', 'textarea'];

  // DOLU ZEMİN — yalnız `brand-600` değil. Kural ilk hâlinde markaya çiviliydi
  // ve turun kendi ölçütünü ıskalıyordu: "İçe Aktar" (toplu içe aktarmanın tek
  // asıl eylemi) ve "Onayla" `bg-ok-600` taşıdığı için kapsam dışında kalmış,
  // tarayıcının turuncu halkasında bırakılmıştı. Ölçüt "dolu bir yüzey",
  // "marka rengi" değil.
  const DOLU = /(^|[\s"'`{(])bg-(brand|ok|bad|warn|accent)-(600|700)(?![\w-])/;

  // SINIF SABİTLERİ ÇÖZÜLÜR, KOMŞULUĞA BAKILMAZ. `inputCls` dersinin (B11)
  // birebir tekrarı denetimde yine yaşandı: sınıf bir `const` sabitindeyse
  // etiket taraması onu göremiyordu. Tek düzey yeter — bu kod tabanında sabit
  // sabite referans vermiyor.
  const sabitHarita = (s) => {
    const h = new Map();
    for (const m of s.matchAll(/(?:const|let|var)\s+(\w+)\s*=\s*((?:'[^']*'|"[^"]*"|`[^`]*`)(?:\s*\+\s*(?:'[^']*'|"[^"]*"|`[^`]*`))*)\s*;/g)) {
      h.set(m[1], m[2]);
    }
    return h;
  };
  const sinifCoz = (metin, h) => metin.replace(/\b([A-Za-z_$][\w$]*)\b/g,
    (ad) => (h.has(ad) ? ` ${h.get(ad)} ` : ad));

  // Reçetenin SAYILABİLECEĞİ bölgeler: odaklanabilir bir etiketin açılışı ya
  // da bir sınıf sabitinin değeri.
  const gecerliBolgeler = (s) => {
    const bolge = [];
    for (const etiket of ODAK_ETIKET) {
      for (const m of s.matchAll(new RegExp(`<${etiket}(?=[\\s>])`, 'g'))) {
        bolge.push([m.index, acilisSonu(s, m.index)]);
      }
    }
    for (const m of s.matchAll(/(?:const|let|var)\s+\w+\s*=\s*(?:'[^']*'|"[^"]*"|`[^`]*`)(?:\s*\+\s*(?:'[^']*'|"[^"]*"|`[^`]*`))*\s*;/g)) {
      bolge.push([m.index, m.index + m[0].length]);
    }
    return bolge;
  };

  // ── ÇAĞRI YERLERİ: SAYIM + KENDİ ZEMİNİNE KARŞI ÖLÇÜM ──────────────────
  //
  // ÜÇ KÖR NOKTA BURADA KAPANIYOR (üçü de denetimde MUTASYONLA kanıtlandı —
  // kapı her birinde 386/0 YEŞİL kalmıştı):
  //
  // (1) ÖZELLİĞİN TAMAMI SİLİNEBİLİYORDU. Yukarıdaki kontrollerin hepsi bir
  //     YASAK ölçüyor ("elle reçete yazma", "göstergeyi bastırma"). Biri her
  //     çağrı yerinden `${FOCUS}`u ve importunu silse ortada ihlal KALMAZDI:
  //     reçete tanımlı, ölçülü ve hiçbir kontrolde kullanılmıyor olurdu.
  //     (A1'in `C = GUNDUZ` dersinin birebir ikizi.)
  // (2) HANGİ REÇETEYİ ALDIĞI HİÇ SORULMUYORDU. `${FOCUS}` → `${FOCUS_INSET}`
  //     takası yapıldığında şoför panosundaki ve iş kartındaki DOLU marka
  //     butonlarında içe çizilen halka dolguyla aynı renge düşüyor —
  //     kontrast 1.00, gösterge fiilen YOK. Dolu butonu kurtaran tek şey
  //     `ring-offset`ti ve inset'e geçildiği an o da yok oluyordu.
  // (3) TERS YÖN — KIRPILMA. `overflow-hidden` bir kabın kenarına dayalı
  //     kontrolde dışa çizilen halka üç kenardan kırpılır. Kural
  //     `focus.js`in yorumunda YAZILIYDI, ölçülmüyordu.
  //
  // Çözüm tek çözümleme: her çağrı yerinin className ŞABLONUNDAN kendi
  // `bg-*` tokenını çıkar ve REÇETEYE GÖRE ölç —
  //   FOCUS_INSET → halka, kontrolün KENDİ dolgusundan ≥3 ayrılmalı.
  //   FOCUS       → boşluk ya dolgudan NET ayrılmalı (≥3: dolu kontrol,
  //                 yığın dolgu→boşluk→halka) ya da GÖZLE FARK EDİLMEMELİ
  //                 (≤1.35: kontrol zaten yüzey renginde duruyor). Aradaki
  //                 bant yasak: orada boşluk ayırıcı olarak okunmaz, yanlış
  //                 renkte bir çerçeve gibi durur.
  // Sayım da aynı taramadan çıkıyor, yani taban ile ölçüm AYNI kümeyi görür.
  {
    // DOSYA BAZLI TABAN, tek bir toplam DEĞİL: toplam taban, bir dosyadan
    // silinen çağrının başka bir dosyaya eklenenle kapanmasına izin verir.
    // (Denetimde tam bu oldu: `ProfilePage`ten bir tanesi silindi, toplam
    // 48 → 47'ye düştü ve taban 47 olduğu için kapı yeşil kaldı.)
    // BÜYÜME serbest, KÜÇÜLME kapıyı kırar — yeni kontrol eklemek CI'ı
    // kırmamalı ama bir kontrolün göstergesini bırakması bir KARARDIR.
    // A7-2'den sonra (2026-09-12): dolu marka zeminli 32 kontrol daha reçeteyi
    // aldı — 48 → 81. Nöbet checkbox'ı BİLİNÇLİ olarak dışarıda
    // (`OrganizationPage` 20, 21 değil): `box-shadow` halkası Safari'de native
    // kutuya çizilmiyor, reçete yerel göstergeyi kaldırıp yerine hiçbir şey
    // koymuyordu.
    const TABAN = {
      'src/components/AssignDriverModal.jsx': 2,
      'src/components/BulkImportModal.jsx': 2,
      'src/components/PaymentLinkModal.jsx': 3,
      'src/components/TransferTypeToggle.jsx': 1,
      'src/components/WelcomeSignModal.jsx': 1,
      'src/components/ui/Button.jsx': 2, 'src/components/ui/Field.jsx': 1,
      'src/components/ui/StatRow.jsx': 1, 'src/pages/DashboardPage.jsx': 4,
      'src/pages/DriverPortalPage.jsx': 4, 'src/pages/InvitePage.jsx': 5,
      'src/pages/JobPage.jsx': 2, 'src/pages/LandingPage.jsx': 4,
      'src/pages/LoginPage.jsx': 6, 'src/pages/NightWatchPage.jsx': 1,
      'src/pages/OrganizationPage.jsx': 20,
      'src/pages/PartnerPortalPage.jsx': 2,
      'src/pages/PlatformAdminPage.jsx': 3, 'src/pages/ProfilePage.jsx': 5,
      'src/pages/RequestPage.jsx': 2, 'src/pages/ReservationsPage.jsx': 13,
    };
    const sayim = {};
    const cagriYerleri = [];

    for (const f of walkSrc(join(root, 'src'))) {
      const rel = relative(root, f).split(/[\\/]/).join('/');
      if (rel.endsWith('src/lib/focus.js')) continue;
      const s = stripComments(readFileSync(f, 'utf8'));
      // İMPORT SATIRI SAYILMAZ — "tanımlı ama kullanılmıyor" tam olarak
      // yakalamak istediğimiz hâl.
      const govde = s.replace(/import\s*\{[^}]*\}\s*from\s*['"][^'"]*focus['"];?/g,
        (m) => ' '.repeat(m.length));

      // SAYIM, REÇETENİN ODAKLANABİLİR BİR ŞEYE İNDİĞİNİ DOĞRULAR.
      // Denetimde `<div className={`h-0 ${FOCUS}`} />` eklenerek bir girdiden
      // silinen reçete telafi edildi ve kapı 388/0 yeşil kaldı — yani sayım
      // "reçete bu dosyada geçiyor mu" diye soruyordu, "bir kontrole iniyor
      // mu" diye değil. Geçerli yer: odaklanabilir bir etiketin AÇILIŞ
      // bölgesi, ya da bir kontrole beslenen sınıf SABİTİ.
      const gecerli = gecerliBolgeler(govde);
      for (const m of govde.matchAll(/\bFOCUS(_INSET)?\b/g)) {
        if (!gecerli.some(([a, b]) => m.index >= a && m.index < b)) continue;
        sayim[rel] = (sayim[rel] || 0) + 1;
        // KENDİ ŞABLONUNU BUL. Çağrı yeri bir şablon dizesinin içindeyse
        // (kod tabanının yerleşik deseni) zeminini oradan okuruz; değilse
        // (`Button.jsx`in dizisi) zemin ayrı bir haritada durur ve bu tarama
        // onu GÖREMEZ — pencere açıp tahmin etmektense ölçmemek yeğdir:
        // yanlış zeminle yeşil yanan bir kontrol, ölçülmemişten daha kötüdür.
        const bas = govde.lastIndexOf('`', m.index);
        const son = bas < 0 ? -1 : govde.indexOf('`', m.index);
        if (bas < 0 || son < 0) continue;
        const sablon = govde.slice(bas, son);
        const zeminler = [...new Set(
          [...sablon.matchAll(/(^|[\s'"`{(])bg-([a-z]+(?:-[a-z0-9]+)?)(?:\/\d+)?(?![\w-])/g)]
            .map((z) => z[2]))];
        cagriYerleri.push({
          rel, satir: govde.slice(0, m.index).split('\n').length,
          inset: !!m[1], zeminler,
          // KENARA DAYALI MI? Tam genişlikte, köşesi yuvarlatılmamış bir
          // kontrol kabının kenarına oturur. Yuvarlatılmış kontrol dayanmaz.
          kenarda: /\b(?:w-full|flex-1)\b/.test(sablon) && !/\brounded-/.test(sablon)
            && /overflow-hidden/.test(govde),
        });
      }
    }

    const eksilen = Object.entries(TABAN)
      .filter(([f, n]) => (sayim[f] || 0) < n)
      .map(([f, n]) => `${f}: ${sayim[f] || 0} < ${n}`);
    check(`reçete ${Object.keys(sayim).length} dosyada, ` +
      `${Object.values(sayim).reduce((a, b) => a + b, 0)} kontrolde kullanılıyor`,
      eksilen.length === 0, eksilen.join(' · ') + ' — kontrol reçeteyi bırakmış');

    // DOLU MARKA ZEMİNLİ HER ODAKLANABİLİR KONTROL REÇETEYİ ALMALI (A7-2).
    //
    // NEDEN AYRI BİR KURAL: yukarıdaki kontroller yalnız "göstergeyi BASTIRAN"
    // kontrolü yakalıyor. Hiç odak sınıfı yazmayan bir buton tarayıcının kendi
    // halkasına düşer ve bu WCAG'ı GEÇER — ama canlıda ölçüldü: giriş formunun
    // üç girdisi bizim teal halkamızı gösterirken bir Tab aşağısındaki
    // "Giriş Yap" düğmesi `outline: rgb(229,151,0) auto 0.8px` (tarayıcının
    // turuncu halkası) gösteriyordu. Aynı formda iki ayrı odak dili.
    //
    // Kapsam ŞEKİLDEN türetiliyor — dosya adı listesi DEĞİL: "dinlenme
    // zemininde dolu bir yüzey taşıyan odaklanabilir eleman". Yarın eklenecek
    // buton da kendiliğinden kapsama girer. `hover:bg-brand-600/25` gibi
    // varyant önekli olan SAYILMAZ; o dinlenme zemini değil.
    //
    // MUAFİYET YOK. İlk hâlde `type="checkbox"|"radio"` muafiyeti vardı ve
    // denetim ikisini birden gösterdi: (1) muafiyet ÖLÜYDÜ — `src/` altında
    // dolu zemin taşıyan tek bir checkbox yok, nöbet kutusu kuraldan zaten
    // `bg-*` taşımadığı için düşüyor, yani muafiyet "kapı neyi koruyor"
    // sorusuna YANLIŞ cevap veriyordu; (2) canlandığı senaryoda YANLIŞ olurdu —
    // Tailwind'de checkbox özelleştirmenin standart yolu `appearance-none` +
    // `bg-*` ve orada `box-shadow` halkası pekâlâ çizilir.
    {
      const eksik = [];
      for (const f of walkSrc(join(root, 'src'))) {
        const rel = relative(root, f).split(/[\\/]/).join('/');
        const s = stripComments(readFileSync(f, 'utf8'));
        const h = sabitHarita(s);
        for (const etiket of ODAK_ETIKET) {
          for (const m of s.matchAll(new RegExp(`<${etiket}(?=[\\s>])`, 'g'))) {
            // SINIF ÇÖZÜLÜR: sabit üzerinden gelen reçete de, sabit üzerinden
            // gelen dolu zemin de görünür olmalı.
            const acilis = sinifCoz(s.slice(m.index, acilisSonu(s, m.index)), h);
            if (!DOLU.test(acilis)) continue;
            if (/FOCUS/.test(acilis)) continue;
            eksik.push(`${rel}:${s.slice(0, m.index).split('\n').length} <${etiket}>`);
          }
        }
      }
      check('dolu zeminli her kontrol reçeteyi taşıyor', eksik.length === 0,
        '\n      ' + eksik.join('\n      ') +
        '\n      (tarayıcı halkasına düşüyor — aynı formda iki ayrı odak dili)');
    }

    // DOLU BİR KABIN İÇİNDEKİ KONTROL DIŞA ÇİZİLEN HALKAYI KULLANAMAZ.
    //
    // Denetimde bulunan GERİLEME: landing'in vurgulu plan kartı
    // `bg-brand-600`, içindeki CTA `bg-surface`. Dışa çizilen yığın
    // dolgu(surface) → boşluk(surface) → halka(brand-600) → kart(brand-600)
    // olunca halka KARTIN İÇİNDE ERİYOR (kontrast 1.00) ve odakta görülen tek
    // şey butonun kendi renginde 2px büyümesi oluyor. Üstelik bu bir gerileme:
    // reçeteden ÖNCE o buton tarayıcının kendi halkasını gösteriyordu.
    //
    // Kapı bunu göremiyordu çünkü ölçüm yalnız kontrolün KENDİ şablonundaki
    // zeminleri okuyor, KABI hiç okumuyor — ve o şablonda iki dal birden
    // olduğu için var olmayan bir çifti (boşluk/brand-600 = 7.50) ölçüp güven
    // verici bir sayı basıyordu.
    {
      const ihlal = [];
      for (const f of walkSrc(join(root, 'src'))) {
        const rel = relative(root, f).split(/[\\/]/).join('/');
        const s = stripComments(readFileSync(f, 'utf8'));
        for (const m of s.matchAll(/<([A-Za-z][\w.]*)(?=[\s>])/g)) {
          const etiketAdi = m[1];
          const sonu = acilisSonu(s, m.index);
          if (!DOLU.test(s.slice(m.index, sonu))) continue;
          if (s[sonu - 1] === '/') continue;              // kendi kendine kapanan
          // Alt ağacın sonunu bul: iç içe aynı etiketleri say.
          let derinlik = 1, i = sonu + 1, kapanis = -1;
          const re = new RegExp(`<${etiketAdi}(?=[\\s>])|</${etiketAdi}\\s*>`, 'g');
          re.lastIndex = i;
          let t;
          while ((t = re.exec(s))) {
            if (t[0][1] === '/') { if (--derinlik === 0) { kapanis = t.index; break; } }
            else if (s[acilisSonu(s, t.index) - 1] !== '/') derinlik++;
          }
          if (kapanis < 0) continue;
          const govde = s.slice(sonu, kapanis);
          // MUAFİYET DAR: elemanın kendisi inset varyantı DA taşıyorsa dalları
          // ayırmış demektir (landing'in koşullu kartı böyle). Hiç taşımıyorsa
          // dolu kabın içinde dışa çizilen halka kalmış demektir.
          for (const g of govde.matchAll(/\bFOCUS\b(?!_INSET)/g)) {
            // MUAFİYET BİRİMİ ELEMANIN AÇILIŞ ETİKETİ — iç şablon DEĞİL.
            // Koşullu sınıfta iki dal iki AYRI şablonda durur; iç şablona
            // bakmak, dalları doğru ayırmış bir elemanı ihlal sayardı.
            const mutlak = sonu + g.index;
            const etiketBas = s.lastIndexOf('<', mutlak);
            const acilis = etiketBas < 0 ? '' : s.slice(etiketBas, acilisSonu(s, etiketBas));
            if (/FOCUS_INSET/.test(acilis)) continue;
            ihlal.push(`${rel}:${s.slice(0, mutlak).split('\n').length} ` +
              `(<${etiketAdi}> dolu kabının içinde dışa çizilen halka)`);
          }
        }
      }
      check('dolu kabın içindeki kontrol halkayı kabında eritmiyor', ihlal.length === 0,
        '\n      ' + ihlal.join('\n      '));
    }

    {
      const kirpilan = cagriYerleri.filter((c) => c.kenarda && !c.inset)
        .map((c) => `${c.rel}:${c.satir}`);
      check(`kenara dayalı kontroller içe çizilen halkayı kullanıyor ` +
        `(${cagriYerleri.filter((c) => c.kenarda).length})`,
        kirpilan.length === 0,
        kirpilan.join(' · ') + ' — `overflow-hidden` kapta dışa çizilen halka kırpılır');
    }

    // ÖLÇÜLECEK ÇAĞRI YERİ BULUNAMAZSA BU BÖLÜM SESSİZCE HİÇBİR ŞEY ÖLÇMEZ.
    const olculen = cagriYerleri.filter((c) => c.zeminler.length);
    check(`kendi zemini okunabilen çağrı yeri (${olculen.length})`, olculen.length >= 10,
      'şablon taraması boşaldı — aşağıdaki ölçümlerin hepsi anlamsız');

    for (const [paletAd, P] of [['gündüz', GUNDUZ_CSS], ['gece', GECE_CSS]]) {
      const bos = P[R.FOCUS.bosRenk];
      const kotu = [];
      for (const c of olculen) {
        for (const z of c.zeminler) {
          if (!P[z]) continue;      // palet dışı (`bg-white`, `bg-black/60`…)
          if (c.inset) {
            const halka = R.FOCUS_INSET.opaklik < 1
              ? karistir(P[R.FOCUS_INSET.renk], P[z], R.FOCUS_INSET.opaklik)
              : P[R.FOCUS_INSET.renk];
            const o = ratio(halka, P[z]);
            if (o < 3) kotu.push(`${c.rel}:${c.satir} içe halka / bg-${z} = ${o.toFixed(2)}`);
          } else {
            const o = ratio(bos, P[z]);
            if (o > 1.35 && o < 3) {
              kotu.push(`${c.rel}:${c.satir} boşluk / bg-${z} = ${o.toFixed(2)} (yasak bant)`);
            }
          }
        }
      }
      check(`${paletAd}: her çağrı yeri kendi zemininde ölçüldü (${olculen.length})`,
        kotu.length === 0, '\n      ' + kotu.join('\n      '));
    }
  }

  // STİL SAYFASI DA TARANIR. Yukarıdaki yasaklar yalnız `.jsx` içinde
  // aranıyordu; `index.css`e tek bir
  // `*:focus-visible { outline: none !important }` eklemek uygulamadaki HER
  // odak göstergesini siliyor ve kapı 386/0 yeşil kalıyordu (denetçi D3).
  // Palet zaten bu dosyadan okunuyor — ihlali okumaması tutarsızdı.
  {
    const ihlal = [];
    const cssler = readdirSync(join(root, 'src'), { recursive: true })
      .filter((n) => typeof n === 'string' && n.endsWith('.css'));
    for (const n of cssler) {
      const metin = readFileSync(join(root, 'src', n), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' '));
      for (const m of metin.matchAll(/:focus(?:-visible)?[^{}]*\{[^}]*\}/g)) {
        if (/(?:outline|box-shadow)\s*:\s*(?:none|0)\b/.test(m[0])) {
          ihlal.push(`src/${n}: ${m[0].replace(/\s+/g, ' ').slice(0, 80)}`);
        }
      }
    }
    check(`stil sayfası odak göstergesini söndürmüyor (${cssler.length} dosya)`,
      ihlal.length === 0 && cssler.length >= 1, ihlal.join(' · '));
  }
}

console.log('\n[4] Şerit AĞIRLIĞI — sayfa zemini üstünde sakin');
for (const [ad, hex] of Object.entries(SERIT)) {
  const r = ratio(hex, CANON.bg);
  check(`şerit ${ad} / sayfa = ${r.toFixed(2)}`, r <= 1.6,
    'şerit sayfadan çok ağır — alt alta on kartta bant gibi okunur');
}
// BİTEN şeritleri DAHA DA sakin olmalı (tavan 1.3): biten iş eylem beklemiyor.
// Ama TÜR tonundan ayrılmalı, yoksa "geçmişte ne olmuştu" yine okunamaz.
const BITEN = { scheduled: CANON.doneScheduled, active: CANON.doneAir, landed: CANON.doneLanded,
                cancelled: CANON.doneCancelled, diverted: CANON.doneDiverted };
for (const [ad, hex] of Object.entries(BITEN)) {
  check(`biten ${ad} / sayfa = ${ratio(hex, CANON.bg).toFixed(2)}`,
    ratio(hex, CANON.bg) <= 1.3, 'biten iş eylem beklemiyor, susmalı');
  // Canlı hâliyle KARIŞMAMALI: yoksa biten iş hâlâ dikkat çeker.
  if (SERIT[ad]) {
    const d = deltaE(hex, SERIT[ad]);
    check(`biten ${ad} canlıdan ayrı = ΔE ${d.toFixed(1)}`, d >= 6,
      'biten iş canlı işle aynı görünüyor');
  }
  // TÜR tonundan da ayrılmalı — tek griye çökmenin sebebi buydu.
  const dt = deltaE(hex, CANON.neutralSoft);
  check(`biten ${ad} tür tonundan ayrı = ΔE ${dt.toFixed(1)}`, dt >= 3,
    'biten iş nötr griye çöküyor — geçmişte durum okunamaz');
}
// BİTEN TONLARI BİRBİRİNDEN DE AYRIK OLMALI — bu kontrol İLK SÜRÜMDE YOKTU
// ve denetim yakaladı: `doneScheduled` ile `doneDiverted` ΔE 2.3'tü, yani
// "hiçbir şey olmamış" iş ile "yönlendirilmiş" iş aynı görünüyordu.
// Özelliğin tek varlık sebebi ("geçmişte hangi iş sorunluydu") o çiftte
// karşılanmıyordu ve HİÇBİR kapı bunu görmüyordu.
//
// Eşik canlı şeritten (12) DÜŞÜK ama anlamlı: biten işler tarih, bağırmaları
// gerekmiyor — ama ayırt edilemezlerse bu özelliğin hiç yazılmaması gerekirdi.
const bitenAdlar = Object.keys(BITEN);
for (let i = 0; i < bitenAdlar.length; i++) {
  for (let j = i + 1; j < bitenAdlar.length; j++) {
    const d = deltaE(BITEN[bitenAdlar[i]], BITEN[bitenAdlar[j]]);
    check(`biten ${bitenAdlar[i]} ↔ ${bitenAdlar[j]} = ΔE ${d.toFixed(1)}`, d >= 6,
      'iki biten tonu gözle ayrılmıyor — geçmişte durum okunamaz');
  }
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
  const { stripTone, FLIGHT_STRIP, FLIGHT_STRIP_DONE, TYPE_TONE } =
    await import(new URL('../src/lib/status.js', import.meta.url));
  const res = (status, flight_status) => ({
    status, latest_status: flight_status ? { flight_status } : null,
  });

  check('canlı veri yok → tür tonu', stripTone(res('active', null)) === TYPE_TONE);
  check('aktif + indi → İNDİ tonu (bağırır)',
    stripTone(res('active', 'landed')) === FLIGHT_STRIP.landed);
  // BİTEN iş SUSAR ama KİMLİĞİNİ KORUR (2026-09-11). Önceden tek nötr tona
  // düşüyordu; listesi tamamen tamamlanmış bir firmada bu, HER şeridi aynı
  // yapıp "hangi iş iptal olmuştu" sorusunu cevapsız bırakıyordu.
  check('BİTEN + indi → İNDİ\'nin sakin tonu',
    stripTone(res('completed', 'landed')) === FLIGHT_STRIP_DONE.landed,
    'biten iş kendi renginin sakin hâline düşmeli');
  check('BİTEN + iptal → İPTAL\'in sakin tonu',
    stripTone(res('completed', 'cancelled')) === FLIGHT_STRIP_DONE.cancelled);
  check('BİTEN + havada → HAVADA\'nın sakin tonu',
    stripTone(res('completed', 'active')) === FLIGHT_STRIP_DONE.active);
  // SINIF ADI DEĞİL, ÇÖZÜLEN RENK karşılaştırılır.
  //
  // İlk hâli iki sınıf DİZESİNİ kıyaslıyordu (`'bg-done-landed …'` vs
  // `'bg-done-cancelled …'`) — bunlar yapıları gereği zaten farklı, yani
  // kontrol bir TOTOLOJİYDİ. Denetim kanıtladı: beş `done` tonunu tek bir
  // hex'e çöktürdüm (bu özelliğin önlemek için yazıldığı regresyonun ta
  // kendisi) ve kapı 145/145 YEŞİL kaldı. Mobil ikizi `.bg` hex'ini
  // karşılaştırdığı için aynı mutasyonu yakalamıştı.
  //
  // Artık sınıf adı palete çözülüyor: kapı ADA değil DEĞERE bakıyor.
  //
  // ÇÖZÜM ARTIK CSS DEĞİŞKENİNDEN: değerler tailwind.config'den `index.css`e
  // taşındığı gün bu çözücü sessizce sınıf adına düşerdi — yani totoloji
  // GERİ GELİRDİ. Çözücünün kendisinin çalıştığını doğrulayan alttaki
  // kontrol tam bu yüzden var ve o gün kırıldı.
  const hexOf = (cls) => {
    const m = /bg-([a-z]+)-([a-z]+)/.exec(cls);
    if (!m) return cls;
    return GUNDUZ_CSS[`${m[1]}-${m[2]}`] || cls;
  };
  check('sınıf → renk çözücüsü çalışıyor',
    /^#[0-9A-F]{6}$/.test(hexOf(FLIGHT_STRIP_DONE.landed)),
    `çözülemedi: ${hexOf(FLIGHT_STRIP_DONE.landed)} — kontroller sınıf adına düşer`);
  check('biten indi ≠ canlı indi',
    hexOf(stripTone(res('completed', 'landed'))) !== hexOf(stripTone(res('active', 'landed'))));
  check('biten indi ≠ biten iptal',
    hexOf(stripTone(res('completed', 'landed'))) !== hexOf(stripTone(res('completed', 'cancelled'))),
    'biten işler tek griye çöküyor — geçmişte durum okunamaz');
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

// MAVİ-GRİ YASAĞI (B13, 2026-09-10). `test-styles.mjs` yalnız BİZİM renk
// ailelerimizi denetliyor ve Tailwind'in varsayılan paletini BİLİNÇLİ olarak
// atlıyor — o kapı "sınıf palete çözülüyor mu" diye sorar, `text-gray-400`
// ise gayet geçerli bir sınıftır. Sonuç: `WelcomeSignModal`da uçuş numarası
// #9CA3AF ile basılıyordu, beyazda **2.54:1** — büyük metin eşiği 3.0'ı bile
// geçmiyor, üstelik o ekran havalimanında UZAKTAN okunan karşılama tabelası.
//
// İki ayrı sebeple yasak: (1) kontrast, varsayılan gri tonları bizim
// zeminlerimizde ölçülmedi; (2) `gray`/`slate`/`zinc` MAVİ-gri ailedir ve bu
// projenin sıcak nötr dilinin tam zıddı ("göz yoran soğukluğun kaynağı odur").
console.log('\n[7] Varsayılan MAVİ-GRİ palet kullanılmıyor');
const walk = (d) => readdirSync(d).flatMap((n) => {
  const p = join(d, n);
  return statSync(p).isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(n) ? [p] : []);
});
const COLD = /\b(text|bg|border|ring|divide|placeholder|from|via|to)-(gray|slate|zinc|cool|blue-?gray)-\d{2,3}\b/;
const soguk = [];
for (const f of walk(join(root, 'src'))) {
  // Yorumlar soyulur: bu kuralın GEREKÇESİ yasak sınıfı adıyla anıyor.
  const src = readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  const m = src.match(new RegExp(COLD, 'g'));
  if (m) soguk.push(`${f.replace(root, '').replace(/\\/g, '/')}: ${[...new Set(m)].join(', ')}`);
}
check('sıcak nötr dili korunuyor', soguk.length === 0,
  soguk.length ? `\n      ${soguk.join('\n      ')}` : '');

// Karşılama tabelasının KENDİ metinleri de ölçülür: bu ekranın tek işi
// uzaktan okunmak ve "yumuşatma uygulanmaz" kuralı dosyanın kendi yorumunda
// yazılıydı — kod o yorumla ÇELİŞİYORDU.
// ADA DEĞİL ŞEKLE BAK. İlk hâli `text-ink\b` arıyordu ve `\b`, `k` ile `-`
// arasında sınır saydığı için `text-ink-muted`ı DA eşliyordu: denetimde
// tabelanın 6xl yolcu adı `text-ink` → `text-ink-muted` yapıldı (16.59 → 5.26)
// ve kapı 111/0 YEŞİL kaldı. Yani kontrol hiçbir şey ölçmüyordu.
//
// Doğrusu: metnin PUNTOSUNDAN renk sınıfını bul, tokenı ondan çöz, kontrastı
// ÖLÇ. Böylece biri rengi değiştirdiğinde kapı sayıyla cevap verir — sınıf
// adını ezberlemiş olmakla değil.
const sign = readFileSync(join(root, 'src', 'components', 'WelcomeSignModal.jsx'), 'utf8');
const TW_INK = { 'text-ink': 'ink', 'text-ink-soft': 'inkSoft', 'text-ink-muted': 'inkMuted' };
for (const [punto, rol, esik] of [['text-6xl', 'yolcu adı', 7], ['text-3xl', 'uçuş no', 4.5]]) {
  // O punto sınıfını taşıyan className dizesini bul, içindeki ink sınıfını çöz.
  const line = sign.split('\n').find((l) => l.includes(punto));
  const cls = line && Object.keys(TW_INK).find((c) => new RegExp(`${c}(?![-\\w])`).test(line));
  check(`tabela ${rol} (${punto}) token renk kullanıyor`, !!cls,
    line ? `bulunan sınıf yok: ${line.trim().slice(0, 60)}` : `${punto} satırı bulunamadı`);
  if (!cls) continue;
  const r = ratio(CANON[TW_INK[cls]], CANON.surface);
  // Tabela UZAKTAN okunuyor: eşik gövde metninden yüksek tutulur.
  check(`tabela ${rol} = ${cls} → ${r.toFixed(2)}`, r >= esik, `bu ekranda eşik ${esik}`);
}

// ── GECE PALETİ (2026-09-12, A1) — MOBİLLE İKİZ ────────────────────────────
//
// Gece paleti mobil `theme.js`in GECE bloğuyla BİREBİR aynı olmak zorunda:
// aynı transfer iki platformda farklı görünmemeli. Kurallar da gündüzle aynı;
// ayrı bir standart uydurmak gece modunu ikinci sınıf tema yapardı.
//
// ÖLÇÜM ZEMİNİ KART (`surface`), SAYFA DEĞİL: şerit her zaman bir kartın
// içinde basılıyor. Gündüzde kart ile sayfa arası 1.06 olduğu için hangisine
// baktığın ısırmıyordu; gecede 1.40 ve ısırıyor — mobil denetiminde üç ton
// kartta 1.00–1.02 (fiilen görünmez) çıkmışken kapı sayfaya baktığı için
// yeşil kalmıştı.
console.log('\n[9] Gece paleti — mobille ikiz, gündüzle aynı kural seti');
const GECE_CANON = {
  'surface': '#1E262B', 'surface-bg': '#14191C', 'surface-alt': '#252E33',
  'surface-border': '#2B343A', 'surface-borderstrong': '#3A454C',
  'surface-inputborder': '#6E7C85', 'surface-neutral': '#2F3133',
  'surface-quiet': '#494029', 'surface-dangerborder': '#6E3B31',
  'ink': '#E9EDEF', 'ink-soft': '#B7C2C8', 'ink-muted': '#8B99A2',
  'brand-50': '#1B3A40', 'brand-600': '#56B8CC', 'brand-700': '#7FCEDD',
  'accent-50': '#40322B', 'accent-600': '#E08A5E', 'accent-800': '#F0A87F',
  'strip-air': '#0C4658', 'strip-landed': '#2A431B',
  'strip-cancelled': '#4C251D', 'strip-diverted': '#553B09',
  'strip-oliveink': '#A9CE8A', 'strip-amberink': '#E8BE74', 'strip-sandink': '#EBD292',
  'done-scheduled': '#2A2927',
  'done-air': '#08313D', 'done-airink': '#9DBCC6',
  'done-landed': '#1F3312', 'done-landedink': '#9CBC82',
  'done-cancelled': '#3E211B', 'done-cancelledink': '#DFA294',
  'done-diverted': '#3B2A09', 'done-divertedink': '#D9B87A',
  'wa-50': '#282F2B', 'wa-700': '#5DC98D',
  'sms-50': '#212F40', 'sms-700': '#78ADEE',
  'ok-50': '#203B2E', 'ok-600': '#5FB98C', 'ok-800': '#8FD3AE',
  'warn-50': '#422F15', 'warn-600': '#D79A46', 'warn-800': '#EDBB72',
  'bad-50': '#522921', 'bad-600': '#E0705C', 'bad-800': '#F0A192',
  'onfill': '#0B1417', 'segmentactive': '#2F3940',
};
{
  const G = GECE_CSS;
  const sapan = Object.entries(GECE_CANON).filter(([k, v]) => G[k] !== v);
  check(`gece paleti kanonik (${Object.keys(GECE_CANON).length} token)`, sapan.length === 0,
    sapan.map(([k, v]) => `${k}: ${G[k]} ≠ ${v}`).join(', '));
  // GÜNDÜZDE TANIMLI HER DEĞİŞKEN GECEDE DE TANIMLI OLMALI. Eksik olan,
  // gündüz değerini MİRAS ALIR ve o yüzey gece temasında yanlış renkte
  // kalır — hiçbir hata vermeden.
  const eksik = Object.keys(GUNDUZ_CSS).filter((k) => !(k in G));
  check('gecede eksik değişken yok', eksik.length === 0, eksik.join(', '));

  for (const m of ['ink', 'ink-soft', 'ink-muted']) {
    for (const z of ['surface', 'surface-bg', 'surface-alt']) {
      const r = ratio(G[m], G[z]);
      check(`gece ${m} / ${z} = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
    }
  }
  for (const z of ['surface', 'surface-bg', 'surface-alt']) {
    const r = ratio(G['surface-inputborder'], G[z]);
    check(`gece girdi sınırı / ${z} = ${r.toFixed(2)}`, r >= 3, 'WCAG 1.4.11 eşiği 3.0');
  }
  // DOLU KONTROLÜN MÜREKKEBİ — gündüzde bu soru yoktu (beyaz her koyu dolguda
  // geçiyordu); gecede dolgu açık bir yama olduğu için ayrı ölçülür.
  for (const d of ['brand-600', 'brand-700', 'accent-600', 'ok-600', 'warn-600', 'bad-600']) {
    const r = ratio(G.onfill, G[d]);
    check(`gece onfill / ${d} = ${r.toFixed(2)}`, r >= 4.5, 'dolu kontrolün yazısı okunmuyor');
  }
  for (const [t, b] of [['sms-700', 'sms-50'], ['wa-700', 'wa-50'],
                        ['ok-800', 'ok-50'], ['warn-800', 'warn-50'],
                        ['bad-800', 'bad-50'], ['accent-800', 'accent-50'],
                        ['brand-700', 'brand-50'],
                        ['ink-soft', 'surface-quiet'], ['ink-soft', 'surface-neutral'],
                        ['strip-sandink', 'surface-quiet'], ['brand-700', 'strip-air'],
                        ['strip-oliveink', 'strip-landed'], ['bad-800', 'strip-cancelled'],
                        ['strip-amberink', 'strip-diverted'],
                        ['ink-soft', 'done-scheduled'], ['done-airink', 'done-air'],
                        ['done-landedink', 'done-landed'], ['done-cancelledink', 'done-cancelled'],
                        ['done-divertedink', 'done-diverted']]) {
    const r = ratio(G[t], G[b]);
    check(`gece ${t} / ${b} = ${r.toFixed(2)}`, r >= 4.5, 'AA eşiği 4.5');
  }
  const gS = { active: G['strip-air'], landed: G['strip-landed'],
               cancelled: G['strip-cancelled'], diverted: G['strip-diverted'],
               scheduled: G['surface-quiet'], tur: G['surface-neutral'] };
  const ad = Object.keys(gS);
  for (let i = 0; i < ad.length; i++) for (let j = i + 1; j < ad.length; j++) {
    const d = deltaE(gS[ad[i]], gS[ad[j]]);
    check(`gece şerit ${ad[i]} ↔ ${ad[j]} = ΔE ${d.toFixed(1)}`, d >= 12);
  }
  for (const [a, h] of Object.entries(gS)) {
    check(`gece şerit ${a} / kart = ${ratio(h, G.surface).toFixed(2)}`,
      ratio(h, G.surface) <= 1.6 && ratio(h, G.surface) >= 1.12,
      'bant ya kartla birleşiyor ya fazla bağırıyor');
    // KARTTAN AÇIK OLMALI: kontrast oranı mutlak fark ölçtüğü için karttan
    // KOYU bir ton da eşiği geçer, ama o bant değil DELİKtir.
    check(`gece şerit ${a} karttan AÇIK`, lum(h) > lum(G.surface));
  }
  const gB = { scheduled: G['done-scheduled'], active: G['done-air'],
               landed: G['done-landed'], cancelled: G['done-cancelled'],
               diverted: G['done-diverted'] };
  for (const [a, h] of Object.entries(gB)) {
    check(`gece biten ${a} / kart = ${ratio(h, G.surface).toFixed(2)}`,
      ratio(h, G.surface) <= 1.3 && ratio(h, G.surface) >= 1.04, 'susmalı ama YOK OLMAMALI');
    check(`gece biten ${a} karttan AÇIK`, lum(h) > lum(G.surface));
    if (gS[a]) {
      check(`gece biten ${a} canlıdan ayrı = ΔE ${deltaE(h, gS[a]).toFixed(1)}`,
        deltaE(h, gS[a]) >= 6);
      check(`gece biten ${a} canlıdan SAKİN`, ratio(h, G.surface) < ratio(gS[a], G.surface));
    }
  }
  const gb = Object.keys(gB);
  for (let i = 0; i < gb.length; i++) for (let j = i + 1; j < gb.length; j++) {
    check(`gece biten ${gb[i]} ↔ ${gb[j]} = ΔE ${deltaE(gB[gb[i]], gB[gb[j]]).toFixed(1)}`,
      deltaE(gB[gb[i]], gB[gb[j]]) >= 6);
  }
  // ROZET ZEMİNLERİ DE KARTIN ÜSTÜNDE: metni okunur olsa bile çip kartla
  // birleşiyorsa rozet yok demektir.
  for (const t of ['brand-50', 'accent-50', 'ok-50', 'warn-50', 'bad-50',
                   'sms-50', 'wa-50', 'surface-alt']) {
    const r = ratio(G[t], G.surface);
    check(`gece ${t} / kart = ${r.toFixed(2)}`, r >= 1.10 && r <= 1.32,
      'çip kartla birleşiyor ya da fazla bağırıyor');
  }
}

// ── [9b] `bg-white` / `text-white` YÜZEY VE MÜREKKEP OLARAK KULLANILAMAZ ────
//
// `white` temadan BAĞIMSIZDIR: kart zemini olarak kullanıldığı her yer gece
// modunda koyu sayfanın üstünde bembeyaz kalır, dolu kontrolün üstünde ise
// gece dolgusu açıldığı için okunmaz olur. 70 `bg-white` → `bg-surface`,
// 55 `text-white` → `text-onfill`.
console.log('\n[9b] Temadan bağımsız `white` sınıfı kullanılmıyor');
{
  const kacak = [];
  for (const f of walkSrc(join(root, 'src'))) {
    const s = stripComments(readFileSync(f, 'utf8'));
    for (const m of s.matchAll(/\b(bg|text)-white\b/g)) {
      kacak.push(`${relative(root, f).replace(/\\/g, '/')}:${s.slice(0, m.index).split('\n').length} (${m[0]})`);
    }
  }
  check('bg-white / text-white yok', kacak.length === 0,
    kacak.join(', ') + ' — zemin için bg-surface, dolgu üstü için text-onfill');
}

// ── [9c] TEMA ALTYAPISI — üç sessiz kırılma noktası ────────────────────────
//
// Üçü de denetimde MUTASYONLA kanıtlandı: her biri bozulduğunda kapılar
// 313/313 yeşil kalıyor ve kusur ancak koyu temalı bir cihazda görülüyor.
console.log('\n[9c] Tema altyapısı');
// 1) `t()` ALPHA SARMALAYICISI. `var(--c-x)` düz yazılırsa Tailwind'in `/30`
//    sözdizimi sessizce çalışmaz: denetimde 23 opaklık kuralının 16'sı yok
//    oldu — uygulamadaki HER klavye odak halkası ve yumuşak uyarı kenarlığı.
//    Build temiz geçti, kapılar yeşil kaldı.
check('t() alpha sarmalayıcısını koruyor',
  /rgb\(var\(--c-\$\{ad\}\) \/ <alpha-value>\)/.test(cfg),
  'opaklık son ekleri (ring-brand-600/30 …) sessizce çalışmaz olur');
// 2) `color-scheme` — kaydırma çubuğunu, `<select>` açılırını, onay kutusunu
//    ve `datetime-local` TAKVİM İKONUNU çeviren tek satır. Dispatcher o
//    alanda sürekli çalışıyor; silinirse koyu formun üstünde bembeyaz takvim
//    açılır ve hiçbir yerde hata olmaz.
check('gündüz bloğu color-scheme: light bildiriyor', /color-scheme:\s*light/.test(blokAl(':root')));
check('gece bloğu color-scheme: dark bildiriyor', /color-scheme:\s*dark/.test(geceBlok));
// 3) YAZDIRMA GÜNDÜZE DÖNMELİ. Karşılama tabelası kağıda basılıyor ve kağıt
//    her zaman beyaz: gece paletiyle yolcu adı kağıda karşı 1.18 kontrast
//    verir, yani dispatcher BOŞ SAYFA alır ve ekranda hiçbir uyarı olmaz.
check('@media print bloğu var', yazdirBlok.length > 0,
  'gece paletiyle yazdırılan tabela boş kağıt basar');
{
  const Y = { ...GUNDUZ_CSS, ...paletOku(yazdirBlok) };
  // Kağıt HER ZAMAN beyazdır — ölçüm zemini `surface` değil, kağıdın kendisi.
  for (const [ad, esik] of [['ink', 7], ['ink-soft', 4.5], ['brand-600', 3]]) {
    const r = ratio(Y[ad], '#FFFFFF');
    check(`yazdırmada ${ad} / kağıt = ${r.toFixed(2)}`, r >= esik, `bu yüzeyde eşik ${esik}`);
  }
}
// 4) TANIMLI HER RENK AİLESİ KULLANILMALI. `segmentactive` tanımlandı,
//    ölçüldü, kanona girdi ve HİÇ KULLANILMADI — önlemek için yazıldığı hata
//    (gecede seçili sekmenin çukura dönmesi) yerinde duruyordu. "Tanım var ≠
//    kullanılıyor" bu projenin tekrarlayan hatası.
{
  const kaynak = walkSrc(join(root, 'src')).map((f) => stripComments(readFileSync(f, 'utf8'))).join('\n');
  const aileler = [...cfg.matchAll(/^\s{8}(\w+):\s*(?:t\('|\{)/gm)].map((m) => m[1]);
  const kullanilmayan = aileler.filter((a) => !new RegExp(`-${a}\\b`).test(kaynak));
  check(`tanımlı ${aileler.length} renk ailesinin hepsi kullanılıyor`,
    kullanilmayan.length === 0,
    kullanilmayan.join(', ') + ' — tanımlı ama hiçbir ekranda yok');
}


// ── [A6] TEMA SEÇİCİ — KULLANICI GECE MODUNA ULAŞABİLİYOR MU ─────────────
//
// NEDEN AYRI: yukarısı paletin DEĞERLERİNİ ölçüyor. Bu bölüm kullanıcının
// ona ULAŞABİLDİĞİNİ ölçer ve bunlar farklı sorular — 2026-09-12'de gece
// modu canlıya çıktı, iki depoda kapılar yeşildi ve kullanıcı özelliği İKİ
// TUR boyunca bulamadı. Ölçüsü yeşil ama bulunma yolu olmayan bir özellik
// yapılmamış sayılır. Mobil ikizi: mobile/scripts/test-tokens.mjs [9].
console.log('\n[A6] Tema seçici — kullanıcı gece moduna ulaşabiliyor mu');
{
  const { temaSemasi, temaOku, temaYaz, temaUygula, temaIzle, saatGece, TEMA_DEGERLERI,
          GECE_BASI, GECE_SONU } =
    await import(new URL('../src/lib/theme.js', import.meta.url));

  // Saf çözücü — MOBİLLE BİREBİR AYNI davranmak zorunda: aynı kullanıcı
  // telefonunda ve tarayıcısında aynı ayarı görüyor.
  check('temaSemasi("dark", "light") = dark', temaSemasi('dark', 'light') === 'dark',
    'elle seçim sistem ayarını ezmiyor: seçici görünür ama işlevsiz');
  check('temaSemasi("light", "dark") = light', temaSemasi('light', 'dark') === 'light');
  check('temaSemasi("system", "dark") = dark', temaSemasi('system', 'dark') === 'dark');
  check('dört değer tanımlı', Array.isArray(TEMA_DEGERLERI) && TEMA_DEGERLERI.length === 4 &&
    ['auto', 'system', 'light', 'dark'].every((v) => TEMA_DEGERLERI.includes(v)),
    JSON.stringify(TEMA_DEGERLERI));

  // ── A8: SAATE GÖRE OTOMATİK — MOBİL İKİZİYLE AYNI SAYILAR ────────────
  // İki depo CI'da yan yana duramaz, o yüzden kanonik sınırlar İKİ kapıda
  // da SABİT yazılı (`test-transfer.mjs` deseni). Sınırı değiştiren tur
  // üçünü birden güncellemek zorunda: iki kapı + `index.html`.
  check('gece penceresi mobille aynı (21→07)', GECE_BASI === 21 && GECE_SONU === 7,
    `${GECE_BASI}→${GECE_SONU} — telefonda ve tarayıcıda farklı saatte dönen bir ayar`);
  const saat = (h) => new Date(2026, 0, 15, h, 30, 0);
  check('20:00 gündüz', saatGece(saat(20)) === false);
  check('21:00 gece (sınır DAHİL)', saatGece(new Date(2026, 0, 15, GECE_BASI, 0, 0)) === true);
  check('00:30 gece (gün döndü)', saatGece(saat(0)) === true,
    'gece yarısını aşan pencere kurulmamış — 00:00\'da tema gündüze dönüyor');
  check('06:00 gece', saatGece(saat(6)) === true);
  check('07:00 gündüz (sınır HARİÇ)', saatGece(new Date(2026, 0, 15, GECE_SONU, 0, 0)) === false);
  // ÇÖZÜCÜ SAATİ GERÇEKTEN KULLANIYOR MU: `saatGece` doğru olup `temaSemasi`
  // onu hiç çağırmazsa özellik tanımlı ve ERİŞİLEMEZ kalır.
  check('temaSemasi("auto", -, gece) = dark', temaSemasi('auto', 'light', saat(22)) === 'dark',
    'otomatik seçeneği saate bakmıyor — seçilebilir ama işlevsiz');
  check('temaSemasi("auto", -, gündüz) = light', temaSemasi('auto', 'dark', saat(12)) === 'light',
    'otomatik CİHAZA bakıyor — "Sistem"in kopyası olmuş');
  check('bilinmeyen tercih saate düşüyor (varsayılanla aynı)',
    temaSemasi('mor', 'light', saat(22)) === 'dark' &&
    temaSemasi('mor', 'dark', saat(12)) === 'light');

  // KALICILIK — saf çözücüyü ölçmek yetmez, o bozulamaz; bozulabilen
  // tercihin yazılıp geri okunabilmesi.
  {
    const kutu = {};
    const depo = { oku: () => kutu.v ?? null, yaz: (v) => { kutu.v = v; } };
    check('yaz → oku gidiş-dönüşü', temaYaz('dark', depo) === true && temaOku(depo) === 'dark');
    check('geçersiz değer reddediliyor', temaYaz('mor', depo) === false && kutu.v === 'dark');
    // VARSAYILAN 'auto' (A8) — mobille aynı. Hiç seçim yapmamış tarayıcının
    // deposu BOŞ, yani göç gerekmeden saate geçiyor; yazılı 'system' ise
    // kullanıcının AÇIK tercihi ve korunuyor.
    check('boş depo auto döner', temaOku({ oku: () => null, yaz: () => {} }) === 'auto',
      'varsayılan değişmemiş — kimse otomatik moda geçmez');
    check('bozuk kayıt auto döner', temaOku({ oku: () => 'mor', yaz: () => {} }) === 'auto');
    check('yazılı "system" KORUNUYOR', temaOku({ oku: () => 'system', yaz: () => {} }) === 'system',
      'kullanıcının açık seçimi sessizce üzerine yazılıyor');
    // `localStorage.setItem` bazı gömülü tarayıcılarda atmadan SESSİZCE
    // hiçbir şey yapmaz; geri okunmasaydı ekran "seçildi" der, kullanıcı
    // sayfayı yenilediğinde eski paleti bulurdu.
    check('yutulan yazma false döner',
      temaYaz('light', { oku: () => null, yaz: () => {} }) === false);
    check('atan depo false döner',
      temaYaz('light', { oku: () => { throw new Error('kota'); }, yaz: () => {} }) === false);
  }

  // DAMGA ZİNCİRİ. Üç halkanın biri kopsa gece modu erişilemez olur ve
  // palet ölçümlerinin hepsi yeşil kalır.
  const html = readFileSync(join(root, 'index.html'), 'utf8');
  // 1) İLK BOYADAN ÖNCE: React mount'una bırakılsaydı koyu temadaki
  //    kullanıcı her yüklemede bir kare BEYAZ görürdü.
  check('damga index.html\'de ilk boyadan önce basılıyor',
    /data-theme/.test(html) && /prefers-color-scheme: dark/.test(html) && /localStorage/.test(html),
    'tema ancak React mount olduktan sonra uygulanır — beyaz çakma');
  // 2) CSS o damgayı tüketiyor mu.
  check('gece paleti damgaya bağlı', css.includes(':root[data-theme="dark"]'),
    'damga basılıyor ama hiçbir kural onu okumuyor');
  // 3) YAZDIRMA ÖZGÜLLÜK YARIŞINI KAYBETMESİN. `:root` (0,1,0) tek başına
  //    `:root[data-theme="dark"]`ı (0,2,0) EZEMEZ: damgaya geçince yazdırma
  //    düzeltmesi sessizce geçersizleşir ve karşılama tabelası yine BOŞ
  //    KAĞIT basar — ekranda hiçbir uyarı olmadan.
  check('yazdırma bloğu damgalı seçiciyi de kapsıyor',
    /@media print \{\s*:root,\s*:root\[data-theme\]/.test(css),
    'gece damgası yazdırmayı eziyor — tabela boş kağıt basar');
  check('yazdırma bloğu gece paletinden SONRA duruyor',
    css.indexOf('@media print') > css.indexOf(':root[data-theme="dark"]'),
    'eşit özgüllükte kaynak sırası kazanır — önce gelen ezilir');

  // ── UÇTAN UCA: DAMGA BASILIYOR MU, DEĞERİ TUTUYOR MU ─────────────────
  // Denetim mutasyonları: (a) `temaUygula`daki `setAttribute` satırının
  // silinmesi, (b) damga değerinin 'dark' → 'night' yapılması, (c)
  // `index.html`teki depo anahtarının değiştirilmesi, (d) `temaIzle`nin
  // aboneliğinin kaldırılması — DÖRDÜ DE 348/348 yeşil geçiyordu. Kapı üç
  // ayrı şeyi ayrı ayrı soruyordu (html'de `data-theme` geçiyor mu, CSS'te
  // seçici var mı, `temaUygula(` çağrılıyor mu) ama ARALARINDAKİ BAĞI hiç
  // sormuyordu: üçü de doğru olup değerler tutmayabilir ve gece modunun 50
  // token'ı tanımlı, ölçülü ve ERİŞİLEMEZ kalır (A1'deki `C = GUNDUZ`
  // mutasyonunun web ikizi).
  {
    const cssDeger = (css.match(/:root\[data-theme="(\w+)"\]/) || [])[1];
    check('CSS gece damgasının değeri okunabiliyor', !!cssDeger);

    // 1) SATIR İÇİ BETİĞİ GERÇEKTEN KOŞTUR. Sahte depo YALNIZ `app_theme`e
    //    cevap verir ve sahte sistem AÇIK moddadır: anahtar ayrışırsa betik
    //    `null` okur, sisteme düşer ve 'light' basar — yani depo anahtarının
    //    iki dosyada aynı olduğu bu testin İÇİNDE ölçülüyor.
    const betik = (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1] || '';
    // SAAT DE ENJEKTE EDİLİYOR (A8). `Date` bir parametre olarak veriliyor,
    // yani betiğin içindeki `new Date()` bizim sahte saatimizi okuyor.
    // Bu olmadan betiğin saat dalı ölçülemezdi ve `index.html` ile
    // `lib/theme.js` sessizce ayrışabilirdi — bu projede kopyalanan her
    // kural er geç ayrıştı ve ayrıştığını kimse görmedi.
    const kosBetik = (tercih, sistemKoyu, h) => {
      let cikti = null;
      const SahteDate = function () { return { getHours: () => h }; };
      new Function('localStorage', 'window', 'document', 'Date', betik)(
        { getItem: (k) => (k === 'app_theme' ? tercih : null) },
        { matchMedia: () => ({ matches: sistemKoyu }) },
        { documentElement: { setAttribute: (k, v) => { cikti = [k, v]; } } },
        SahteDate,
      );
      return cikti;
    };
    const basilan = kosBetik('dark', false, 12);
    check('satır içi betik damgayı basıyor', basilan && basilan[0] === 'data-theme',
      JSON.stringify(basilan));
    check('betiğin bastığı değer CSS seçicisiyle aynı', basilan && basilan[1] === cssDeger,
      `${basilan && basilan[1]} ≠ ${cssDeger} — damga değeri ya da depo anahtarı ayrışmış`);

    // ── SATIR İÇİ BETİK = `temaSemasi()` (A8) ──────────────────────────
    // KOPYA OLDUĞU İÇİN DAVRANIŞI KARŞILAŞTIRILIYOR, metni değil. Betikte
    // sınır 20'ye kaysa ya da `'auto'` dalı sisteme düşse, modül doğru
    // kalır ve İLK BOYA yanlış temayı basar: kullanıcı her yüklemede bir
    // kare (çoğu zaman kalıcı olarak) yanlış palet görür ve hiçbir kontrol
    // bunu söylemez.
    const senaryolar = [
      // [depodaki tercih, sistem koyu mu, saat]
      [null, false, 22], [null, false, 3],  [null, false, 12], [null, true, 12],
      ['auto', false, 21], ['auto', false, 7], ['auto', false, 6],
      ['auto', true, 20], ['system', true, 22], ['system', false, 22],
      ['light', false, 23], ['dark', true, 12], ['mor', false, 22],
    ];
    const ayrisan = senaryolar.filter(([tercih, sis, h]) => {
      const b = kosBetik(tercih, sis, h);
      const beklenen = temaSemasi(tercih, sis ? 'dark' : 'light',
        new Date(2026, 0, 15, h, 30, 0)) === 'dark' ? 'dark' : 'light';
      return !b || b[1] !== beklenen;
    });
    check(`satır içi betik modülle AYNI kararı veriyor (${senaryolar.length} senaryo)`,
      ayrisan.length === 0,
      ayrisan.map((s) => JSON.stringify(s)).join(' '));
    // SIFIR KAPSAM DA ARIZADIR: senaryo listesi boşalırsa yukarısı hiçbir
    // şey ölçmez ve yeşil kalır.
    check('senaryo listesi dolu', senaryolar.length >= 10);

    // 2) `temaUygula` DAVRANIŞI: aynı damgayı basıyor mu, tarayıcı çubuğunu
    //    paletten mi okuyor. Çağrı yerini metinle görmek YETMEZ — gövde
    //    boşaltıldığında kullanıcı seçeneğe basar, düğme işaretlenir ve
    //    sayfa dönmez: bu turun var olma sebebi olan şikâyetin kendisi.
    const yedek = { d: globalThis.document, w: globalThis.window, g: globalThis.getComputedStyle };
    let uygulanan = null, meta = null, abone = 0;
    globalThis.document = {
      documentElement: { setAttribute: (k, v) => { uygulanan = [k, v]; } },
      querySelector: () => ({ setAttribute: (k, v) => { meta = v; } }),
    };
    globalThis.window = {
      matchMedia: () => ({ matches: false, addEventListener: () => { abone++; }, removeEventListener: () => {} }),
    };
    globalThis.getComputedStyle = () => ({ getPropertyValue: () => ' 20 25 28 ' });
    // SAAT ABONELİĞİ (A8) sahte zamanlayıcıyla ölçülüyor: sayfa açıkken
    // 21:00 geçildiğinde tema kendiliğinden dönmeli. `setInterval` gerçek
    // kalsaydı kapı ya bekler ya da hiçbir şey ölçmezdi.
    const yedekZaman = { s: globalThis.setInterval, c: globalThis.clearInterval };
    let tikAbone = 0, tikIptal = 0, tikEl = null;
    globalThis.setInterval = (fn, ms) => { tikAbone++; tikEl = { fn, ms }; return 42; };
    globalThis.clearInterval = () => { tikIptal++; };
    let donen, izleDondu, otoGece, tikBasti = false, ilk = null;
    try {
      donen = temaUygula('dark');
      // ANLIK GÖRÜNTÜ: aşağıdaki çağrılar `uygulanan`ı yeniden yazıyor.
      ilk = uygulanan;
      // `'auto'` + GECE saati → koyu. `temaUygula` saati geçirmezse burası
      // gündüz basar ve otomatik mod webde hiç çalışmaz.
      temaUygula('auto', new Date(2026, 0, 15, 22, 0, 0));
      otoGece = uygulanan && uygulanan[1];
      izleDondu = temaIzle();
      // TİK GÖVDESİ SAHTE DOM HÂLÂ AYAKTAYKEN koşturulur; dışarıda
      // çağrılsaydı gerçek `document`e uzanıp patlardı.
      uygulanan = null;
      if (tikEl) tikEl.fn();
      tikBasti = uygulanan !== null;
      if (typeof izleDondu === 'function') izleDondu();
    } finally {
      globalThis.document = yedek.d; globalThis.window = yedek.w; globalThis.getComputedStyle = yedek.g;
      globalThis.setInterval = yedekZaman.s; globalThis.clearInterval = yedekZaman.c;
    }
    check('temaUygula SAATİ hesaba katıyor ("auto" + 22:00 → dark)', otoGece === cssDeger,
      `${otoGece} — webde otomatik mod saate bakmıyor`);
    check('temaIzle saat tikine de abone oluyor', tikAbone === 1, `tik ${tikAbone}`);
    check('tik periyodu dakikayı aşmıyor', tikEl && tikEl.ms > 0 && tikEl.ms <= 60000,
      `${tikEl && tikEl.ms}ms — sınırdan çok sonra dönen bir tema, dönmeyen temadır`);
    check('tik fonksiyonu temayı yeniden uyguluyor', tikBasti,
      'zamanlayıcı kuruluyor ama içi boş — sınır geçilince sayfa dönmez');
    check('abonelik iptali tiki de kapatıyor', tikIptal === 1,
      'sayfa kapanınca zamanlayıcı sızıyor');
    check('temaUygula damgayı GERÇEKTEN basıyor', ilk && ilk[0] === 'data-theme',
      'seçime basılıyor, tercih kaydediliyor ve sayfa dönmüyor');
    check('temaUygula ile CSS aynı değerde buluşuyor', ilk && ilk[1] === cssDeger,
      `${ilk && ilk[1]} ≠ ${cssDeger}`);
    check('temaUygula geçerli şemayı döndürüyor', donen === cssDeger);
    check('tarayıcı çubuğu paletten güncelleniyor', meta === 'rgb(20 25 28)', String(meta));
    // 3) SİSTEM DEĞİŞİMİNE ABONELİK — yalnız `temaIzle()` çağrısının metinde
    //    bulunması, aboneliğin KURULDUĞU anlamına gelmez.
    check('temaIzle gerçekten abone oluyor', abone === 1, `abone sayısı ${abone}`);
    check('temaIzle abonelik iptalini döndürüyor', typeof izleDondu === 'function');
  }

  // TEK `theme-color` META: `prefers-color-scheme`e çivili bir çift,
  // sistem açık modda + kullanıcı "Koyu" seçmişken sayfayı koyu, tarayıcı
  // çubuğunu marka teal'inde bırakırdı.
  check('theme-color tek meta ve media koşulsuz',
    (html.match(/name="theme-color"/g) || []).length === 1 &&
    !/name="theme-color"[^>]*media=/.test(html),
    'çubuk rengi seçimi değil sistemi izliyor');
  // SEÇİCİ GERÇEKTEN BİR SAYFADA BASILIYOR MU — kapı DOSYA ADINA
  // ÇİVİLENMEZ (bu proje aynı hatayı beş kez yaptı) ve kaynak YORUMLARDAN
  // SOYULUR (yorumdaki bir örnek kod kapıyı yanlış sebepten yeşil geçirir).
  const secici = walkSrc(join(root, 'src'))
    .map((f) => [f, stripComments(readFileSync(f, 'utf8'))])
    // Tanımın kendisi muaf: `lib/theme.js` adı taşır, ÇAĞIRMAZ.
    .filter(([, k]) => /temaYaz\s*\(/.test(k) && !/export function temaYaz/.test(k));
  check('tema seçici bir sayfada basılıyor', secici.length === 1,
    `bulunan ${secici.length} dosya — 0 ise özellik yine görünmez`);
  const [yol, kod] = secici[0] || ['-', ''];
  const ad = String(yol).split(/[\\/]/).pop();
  check(`seçenekler TEMA_DEGERLERI'nden üretiliyor (${ad})`, /TEMA_DEGERLERI\.map\(/.test(kod),
    'elle yazılan liste tek kaynaktan sessizce ayrışır');
  check('seçeneğe tıklamak tercihi değiştiriyor', /onClick=\{\(\) => secTema\(/.test(kod),
    'düğmeler ölü — görünen seçici, işlemeyen seçim');
  check('seçim ANINDA uygulanıyor', /temaUygula\(/.test(kod),
    'tercih kaydediliyor ama sayfa dönmüyor — dokunup hiçbir şey olmuyor');
  check('ölü JSX kapısı yok', !/\{\s*false\s*(&&|\?)/.test(kod),
    'bölüm sabit-yanlış bir koşulun altında — dosyada var, ekranda yok');
  check('yazma hatası ekrana basılıyor', /setTemaHata\('[^']+'\)/.test(kod) && /\{temaHata &&/.test(kod),
    'hata state\'e yazılıyor ama hiçbir yere basılmıyor');
  check('seçili değer her mount\'ta depodan okunuyor', /useState\(temaOku\)/.test(kod),
    'bayat değer yanlış seçeneği işaretler');
  // "OTOMATİK" NEYE GÖRE OTOMATİK (A8) — aralık EKRANDA yazmalı ve sayıları
  // tek kaynaktan almalı. Yoksa kullanıcı öğlen seçer, hiçbir şey değişmez
  // ve özelliğin çalışmadığını sanar; elle yazılmış bir saat de sınır
  // değiştiğinde ekranı yalancı yapar.
  check('otomatik aralığı ekranda yazıyor',
    /GECE_BASI/.test(kod) && /GECE_SONU/.test(kod) && /Otomatik:/.test(kod),
    '"Otomatik" neye göre olduğunu söylemiyor ya da saat elle yazılmış');
  // FORMUN İÇİNE KONMASIN: `<button>` varsayılanı `submit`tir ve profil
  // kaydını tetiklerdi.
  check('seçenekler type="button"', /type="button"/.test(kod));

  // SİSTEM TEMASI DEĞİŞİMİNE ABONELİK. Olmasaydı "Sistem" seçiliyken
  // kullanıcı işletim sistemi temasını değiştirir, sekmeye döner ve hiçbir
  // şey olmazdı.
  const giris = readFileSync(join(root, 'src', 'main.jsx'), 'utf8');
  check('sistem teması değişimine abone olunuyor', /temaIzle\(\)/.test(stripComments(giris)),
    '"Sistem" seçiliyken tema değişimi sayfaya yansımaz');
  // AÇILIŞTA DA UYGULANMALI: satır içi betik birincil yol, bu satır emniyet
  // kemeri (CSP, önbellekteki eski HTML). Ölçülmezse sessizce silinir ve
  // kemerin yokluğu ancak gerçek arıza gününde fark edilir.
  check('açılışta tema uygulanıyor', /temaUygula\(temaOku\(\)\)/.test(stripComments(giris)));
}
console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
