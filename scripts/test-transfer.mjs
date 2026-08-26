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
import { FLIGHT, POINT_TO_POINT, isFlightTransfer, transferLabel, cardTitle, showFlightLine, looksLikeFlightNumber } from '../src/lib/transfer.js';

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

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
