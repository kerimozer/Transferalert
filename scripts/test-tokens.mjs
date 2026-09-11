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
};

// Tailwind adı → kanonik ad.
const MAP = {
  'surface.bg': 'bg', 'surface.DEFAULT': 'surface', 'surface.alt': 'surfaceAlt',
  'surface.border': 'border', 'surface.borderstrong': 'borderStrong',
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
  const hexOf = (cls) => {
    const m = /bg-([a-z]+)-([a-z]+)/.exec(cls);
    if (!m) return cls;
    const grup = cfg.match(new RegExp(`${m[1]}:\\s*\\{[\\s\\S]*?\\}`));
    const bul = grup && grup[0].match(new RegExp(`${m[2]}:\\s*'(#[0-9A-Fa-f]{6})'`));
    return bul ? bul[1].toUpperCase() : cls;
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

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
