// Transfer türü sözleşmesi + kart başlığı kuralları.
//
// NEDEN VAR — İKİ AYRI RİSK:
//
// (1) SÖZLEŞME: `transfer_type` değerleri backend'in `TRANSFER_TYPES`
//     sabitiyle ve migration 029'un CHECK kısıtıyla birebir eşleşmek
//     ZORUNDA. Bir taraf 'point_to_point' derken diğeri 'p2p' derse kayıt
//     sessizce 'flight' sayılır: poller uçuşsuz işi sağlayıcıya sorar,
//     kart uçuş satırı basar ve hata hiçbir yerde görünmez. CI backend
//     deposunu göremediği için burada SABİT liste tutulur; ters yönlü kapı
//     backend testindeki [19b]'dir.
//
// (2) KART KURALI: aynı transferin Ana Sayfa'da ve Transferlerim'de farklı
//     görünmesi güveni bozar. Başlık/uçuş satırı kararı lib/transfer.js'te
//     tek yerde; burası o kararın beklenen davranışını çiviler.
import { FLIGHT, POINT_TO_POINT, isFlightTransfer, transferLabel, cardTitle, showFlightLine, looksLikeFlightNumber, needsDriver, hasDriver, initials } from '../src/lib/transfer.js';

let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
};

// Backend'in bildiği liste. Değişirse ÖNCE backend [19b] kırılır.
const BACKEND_KNOWN = ['flight', 'point_to_point'];

console.log('\n[1] Tür sözleşmesi');
check('FLIGHT sabiti backend ile aynı', FLIGHT === BACKEND_KNOWN[0], FLIGHT);
check('POINT_TO_POINT sabiti backend ile aynı', POINT_TO_POINT === BACKEND_KNOWN[1], POINT_TO_POINT);

console.log('\n[2] Uçuş takibi kapısı');
check('uçuşsuz kayıt takip edilmez', !isFlightTransfer({ transfer_type: POINT_TO_POINT, flight_number: null }));
check('numarası olan uçuşlu kayıt takip edilir', isFlightTransfer({ transfer_type: FLIGHT, flight_number: 'TK123' }));
// Savunma: numarasız bir 'flight' satırı (eski veri, elle düzenleme) kartta
// "uçuş: (boş)" gibi bir yer tutucu üretmemeli.
check('numarasız uçuşlu kayıt takip edilmez', !isFlightTransfer({ transfer_type: FLIGHT, flight_number: null }));
// Migration 029 öncesi satırlar ve kolonu göndermeyen eski uçlar.
check('tür yoksa flight varsayılır', isFlightTransfer({ flight_number: 'PC1' }));

console.log('\n[3] Etiket ve kart başlığı');
check('uçuşluda etiket uçuş numarası', transferLabel({ flight_number: 'TK900', passenger_name: 'Ali' }) === 'TK900');
check('uçuşsuzda etiket yolcu adı', transferLabel({ transfer_type: POINT_TO_POINT, passenger_name: 'Ali Veli' }) === 'Ali Veli');
check('ikisi de yoksa sabit yedek', transferLabel({}) === 'Transfer');
check('başlık yolcu adını tercih eder', cardTitle({ flight_number: 'TK900', passenger_name: 'Anna Schmidt' }) === 'Anna Schmidt');
// Backend yolcu adı boşsa onu uçuş numarasıyla dolduruyor; o durumda başlık
// zaten uçuş numarasıdır.
check('yolcu adı = uçuş no ise başlık uçuş no', cardTitle({ flight_number: 'TK900', passenger_name: 'TK900' }) === 'TK900');
check('uçuşsuzda başlık yolcu adı', cardTitle({ transfer_type: POINT_TO_POINT, flight_number: null, passenger_name: 'Ali Veli' }) === 'Ali Veli');

console.log('\n[4] Uçuş satırı basılmalı mı');
check('uçuşlu + yolcu adı var → basılır', showFlightLine({ flight_number: 'TK900', passenger_name: 'Anna' }));
// Aynı bilgiyi iki kez göstermemek için.
check('başlık zaten uçuş no ise basılmaz', !showFlightLine({ flight_number: 'TK900', passenger_name: 'TK900' }));
check('uçuşsuzda basılmaz', !showFlightLine({ transfer_type: POINT_TO_POINT, flight_number: null, passenger_name: 'Ali' }));
check('kayıt yoksa çökmüyor', !showFlightLine(null) && cardTitle(null) === 'Transfer');

console.log('\n[5] Uçuş numarası sezgisi (boş aramada canlı sorgu önerisi)');
// Ana Sayfa araması YALNIZ kayıtlı transferleri tarar. Sonuç boşken canlı
// sorguyu ÖNERMEK için kullanılır. Yanlış negatif kullanıcıyı yine çıkmazda
// bırakır; yanlış pozitif ise yolcu adının altına "uçuş ara" butonu basar.
for (const q of ['TK1234', 'tk1234', 'PC4567', 'TK1', 'W61', 'TK 1234', 'TK123A']) {
  check(`"${q}" uçuş numarası sayılıyor`, looksLikeFlightNumber(q));
}
for (const q of ['Anna Schmidt', 'Ibrahim', '1234', 'Hilton Bomonti', '', null, undefined]) {
  check(`"${q}" uçuş numarası SAYILMIYOR`, !looksLikeFlightNumber(q));
}

console.log('\n[6] Şoför bekleyen transfer');
// Bu koşul DÖRT yerde kopyalanmıştı: Ana Sayfa uyarı şeridi, kartın kırmızı
// kenarlığı, "Şoför ata" düğmesi, Transferlerim listesi. Ayrıştıklarında şerit
// "1 transferde şoför yok" derken listede uyarılı tek kart olmuyor ve
// dispatcher hangisine inanacağını bilemiyor. Tek kaynak lib/transfer.js.
check('aktif + atanmamış + adsız → şoför bekliyor', needsDriver({ status: 'active' }));
// ATANMA = ÜYELİK SATIRI (migration 025).
check('üye atanmışsa beklemiyor', !needsDriver({ status: 'active', assigned_member_id: 'uuid' }));
// Taşeron/elle yazılan şoför de bir atamadır — adı varsa iş sahipsiz değildir.
check('şoför adı yazılmışsa beklemiyor', !needsDriver({ status: 'active', driver_name: 'Kerim' }));
// Bitmiş ya da iptal edilmiş işe şoför aranmaz; şerit onları saymamalı.
for (const s of ['completed', 'cancelled', 'pending']) {
  check(`${s} durumunda beklemiyor`, !needsDriver({ status: s }));
}
check('kayıt yoksa çökmüyor', !needsDriver(null) && !needsDriver(undefined));

// `hasDriver` = "ATANMIŞ MI", `needsDriver` = "ALARM MI". İkisi ayrı durmak
// ZORUNDA: gece tahtası `pending` işleri de gösterir ve orada `!needsDriver()`
// yazmak şoförsüz bir `pending` işi "atanmış" gösterirdi — gecenin ortasında
// tam olarak görülmesi gereken şeyi gizlerdi.
check('durumdan BAĞIMSIZ: pending + şoförsüz → atanmamış', !hasDriver({ status: 'pending' }));
check('pending + üye atanmış → atanmış', hasDriver({ status: 'pending', assigned_member_id: 'uuid' }));
check('ama pending ALARM üretmez', !needsDriver({ status: 'pending' }));
// `assigned_driver_id` üyeden TÜRETİLİR ve hesapsız şoförde meşru olarak
// NULL'dur; TEK BAŞINA atama sayılmaz. Nöbet tahtası bunu kabul ediyordu,
// Ana Sayfa etmiyordu — aynı kayıt için iki ekran zıt şey söylüyordu.
check('yalnız assigned_driver_id atama SAYILMAZ', !hasDriver({ status: 'active', assigned_driver_id: 'uuid' }));
check('hasDriver kayıt yoksa çökmüyor', !hasDriver(null) && !hasDriver(undefined));
// İkisi `active` işte AYNI cevabı vermeli, yoksa şerit ile kart ayrışır.
for (const r of [{ status: 'active' }, { status: 'active', driver_name: 'Kerim' }, { status: 'active', assigned_member_id: 'u' }]) {
  check(`active işte iki tanım örtüşüyor (${JSON.stringify(r)})`, needsDriver(r) === !hasDriver(r));
}

console.log('\n[6b] Şoför tanımının SATIR-İÇİ kopyası kalmamış');
// KAPI ADA DEĞİL ŞEKLE BAKAR — aşama etiketlerinde öğrenilen ders.
//
// `hasDriver()` eklendiği turda kartı çevirdik ama AYNI EKRANIN başlık sayacı
// (`NightWatchScreen`) satır-içi kopyayı taşımaya devam ediyordu: kart "Şoför
// atanmadı" derken üstteki özet "0" gösteriyordu. Denetçi yakaladı. Aynı tarama
// webde ÜÇÜNCÜ bir kopyayı da buldu (`ReservationsPage`).
//
// Ada bakan bir kapı (değişken adı `hasDriver` mı?) bunların hiçbirini görmezdi
// — ikisinin de adı farklıydı. Şekil aranır: `driver_name` ile
// `assigned_member_id`/`assigned_driver_id`i `||` ile birleştiren her ifade.
{
  const { readdirSync, readFileSync, statSync } = await import('node:fs');
  const { join, relative } = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const SRC = join(fileURLToPath(new URL('../src', import.meta.url)));

  const walk = (dir) => readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : (/\.(js|jsx)$/.test(n) ? [p] : []);
  });

  // TEK MEŞRU YER: tanımın kendisi.
  const ALLOWED = ['lib/transfer.js'];
  const SHAPE = /(driver_name|assigned_member_id|assigned_driver_id)\s*\|\|\s*r?\.?\s*(driver_name|assigned_member_id|assigned_driver_id)/;

  const offenders = [];
  for (const file of walk(SRC)) {
    const rel = relative(SRC, file).replace(/\\/g, '/');
    if (ALLOWED.includes(rel)) continue;
    readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
      // `// driver-def-ok` muafiyeti: bu alanları meşru olarak yan yana kullanan
      // (ama "şoförü var mı" sormayan) bir satır çıkarsa işaretlenebilir.
      if (SHAPE.test(line) && !line.includes('driver-def-ok')) offenders.push(`${rel}:${i + 1}`);
    });
  }
  check('şoför tanımı yalnız lib/transfer.js\'te', offenders.length === 0,
    offenders.length ? `satır-içi kopya: ${offenders.join(', ')} — hasDriver(r) kullanın` : '');
}

console.log('\n[7] Baş harfler (kart rozeti)');
check('iki kelimeli ad → ilk + son', initials('Kübra Gümüş') === 'KG', initials('Kübra Gümüş'));
check('tek kelime → tek harf', initials('Anna') === 'A', initials('Anna'));
check('üç kelimede ORTA atlanır', initials('Ayşe Nur Yıldız') === 'AY', initials('Ayşe Nur Yıldız'));
// Türkçe yerel ŞART: düz toUpperCase 'i'yi 'I' yapar ve "İbrahim" yanlış
// baş harfle çıkar. Plakadaki kuralın TERSİ — ikisi karıştırılmamalı.
check('İ/ı Türkçe yerelde doğru', initials('ibrahim yıldız') === 'İY', initials('ibrahim yıldız'));
check('fazla boşluk kırpılıyor', initials('  Anna   Schmidt  ') === 'AS', initials('  Anna   Schmidt  '));
// Kart adsız kalabilir (uçuşsuz olmayan, yolcu adı henüz yazılmamış kayıt).
for (const v of ['', null, undefined, '   ']) check(`"${v}" → tire`, initials(v) === '–');

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
