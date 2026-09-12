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
const geceBlok = blokAl('@media (prefers-color-scheme: dark)');
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

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
