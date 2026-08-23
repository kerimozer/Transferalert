// Transfer arama testi — asıl hedefi TÜRKÇE I/İ tuzağı.
//
// NEDEN VAR: arama ekranın içine gömülüyken test edilemiyordu ve ilk sürümde
// `toLocaleLowerCase('tr')` yüzünden "Ibrahim" sorgusu "İbrahim Yılmaz"
// kaydını BULMUYORDU. Hata sessizdi: boş liste, hata mesajı yok, dispatcher
// kaydın silindiğini sanıyordu. Tek satırlık bu test onu yakalar.
import { matchesQuery, fold } from '../src/lib/search.js';

let passed = 0, failed = 0;
const check = (name, cond, extra = '') => {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
};

const r = (o) => ({ passenger_name: null, flight_number: null, pnr: null, driver_name: null, meeting_point: null, dropoff_point: null, ...o });

console.log('\n[1] Türkçe büyük/küçük harf');
check('İbrahim ← "Ibrahim" (İngilizce klavye)', matchesQuery(r({ passenger_name: 'İbrahim Yılmaz' }), 'Ibrahim'));
check('İbrahim ← "ibrahim"',                    matchesQuery(r({ passenger_name: 'İbrahim Yılmaz' }), 'ibrahim'));
check('ISTANBUL ← "ist"',                       matchesQuery(r({ meeting_point: 'ISTANBUL Havalimanı' }), 'ist'));
check('Işıl ← "Isil"',                          matchesQuery(r({ passenger_name: 'Işıl Demir' }), 'Isil'));
check('Işıl ← "isil"',                          matchesQuery(r({ passenger_name: 'Işıl Demir' }), 'isil'));
check('fold I ve İ aynı harfe iniyor', fold('İI') === 'ii', fold('İI'));

console.log('\n[2] Alanlar');
check('uçuş numarası',  matchesQuery(r({ flight_number: 'TK2412' }), 'tk24'));
check('PNR',            matchesQuery(r({ pnr: 'ABC123' }), 'abc'));
check('şoför adı',      matchesQuery(r({ driver_name: 'Ali Kaya' }), 'kaya'));
check('buluşma noktası', matchesQuery(r({ meeting_point: 'Dış Hatlar Çıkış' }), 'hatlar'));
check('varış noktası',   matchesQuery(r({ dropoff_point: 'Rixos Downtown' }), 'rixos'));
check('alakasız sorgu eşleşmiyor', !matchesQuery(r({ passenger_name: 'Anna Schmidt' }), 'petrov'));

console.log('\n[3] Sınır durumları');
check('boş sorgu her şeyi geçirir',      matchesQuery(r({ passenger_name: 'Anna' }), ''));
check('yalnız boşluk her şeyi geçirir',  matchesQuery(r({ passenger_name: 'Anna' }), '   '));
check('undefined sorgu her şeyi geçirir', matchesQuery(r({ passenger_name: 'Anna' }), undefined));
check('null alanlar çökmüyor',           !matchesQuery(r({}), 'anna'));
check('kayıt yoksa false',               !matchesQuery(null, 'anna'));
check('sorgu boşlukla çevriliyse trimleniyor', matchesQuery(r({ passenger_name: 'Anna Schmidt' }), '  anna  '));

console.log(`\nSONUÇ: ${passed} geçti, ${failed} kaldı`);
process.exit(failed ? 1 : 0);
