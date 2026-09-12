// KLAVYE ODAK GÖSTERGESİ — TEK KAYNAK (2026-09-12, A7).
//
// NEDEN VAR: aynı reçete `src/` altında 48 yerde ELLE kopyalanmıştı ve
// hepsi AYNI kusuru taşıyordu: marka tonunun %30 saydam hâli, 2px.
// Ölçüldü — %30 opaklıkta marka tonu kart zeminine karşı GÜNDÜZ 1.64,
// GECE 1.81 kontrast veriyor; WCAG 2.4.11 / 1.4.11 eşiği 3.0. Üstelik
// yanındaki `focus:outline-none` tarayıcının KENDİ göstergesini de
// kaldırıyordu, yani klavyeyle gezen kullanıcıya hiçbir işaret kalmıyordu.
// (Dört yerde daha zayıf bir opaklık vardı: 1.36–1.46.)
//
// B11 turunda girdi kenarlığı 1.52 → 3.57'ye çıkarılırken bu çift hiç
// ölçülmedi ve hiçbir kapı odak halkasına bakmıyordu.
//
// ÜÇ KARAR VE GEREKÇELERİ ─────────────────────────────────────────────────
//
// 1) HALKA OPAK. Opaklığı yükseltmek de bir seçenekti ama ÖLÇÜM ELEDİ:
//    3.0 eşiğini geçmek için gündüz %70, gecede %60 gerekiyor — yani zaten
//    neredeyse opak, ve karşılığında Tailwind'in alpha sarmalayıcısına
//    bağımlı kalıyoruz. O sarmalayıcı bu projede SESSİZ bir kırılma
//    noktası: bozulduğu gün 23 opaklık kuralının 16'sı üretilen CSS'ten
//    yok oldu (A1 denetimi) ve "her odak halkası" o 16'nın içindeydi.
//    Bedavaya alınmış bir kırılganlık olurdu.
//
// 2) AYRI BİR ODAK TOKENI AÇILMADI, halka `brand-600`in kendisi.
//    `inputborder` gibi ayrı bir token, iki işin ÇELİŞEN kısıtları olduğunda
//    gerekir (`borderstrong` ikincil butonlarda da kullanıldığı için
//    koyulaştırılamıyordu). Burada çelişki YOK: marka tonunun dolu kontrol
//    zemini olma şartı ("gündüz koyu, gece açık") ile halkanın her zeminde
//    en az 3:1 olma şartı AYNI yöne bakıyor, ve ikisi de 3.9+ paylı geçiyor.
//    Ayrıca mobilde odak halkası KAVRAMI yok; token'ı oraya da kopyalamak
//    iki depoda "tanımlı ama kullanılmayan" bir renk bırakırdı, yani bu
//    projenin tekrarlayan hatası.
//    Kapı bunu DEĞERİYLE ölçüyor: marka tonu bir gün açılırsa halka kapısı
//    kırılır ve sebebini söyler (test-tokens.mjs [3c]).
//
// 3) `focus` DEĞİL `focus-visible`. Halka artık opak ve boşlukla basıldığı
//    için GÖRÜNÜR — dolayısıyla her FARE TIKLAMASINDA da patlardı. Eski
//    reçetenin yumuşaklığı tam olarak bunu idare etmek içindi.
//    Kod tabanında zaten yerleşikti (`StatRow`, `DashboardPage` alarm satırı).
//
//    KAZANÇ YALNIZ BUTON/SELECT/CHECKBOX'TA. Tarayıcı sezgiselinde METİN
//    GİRDİLERİ (`input type=text|email|password|tel|number|time|
//    datetime-local`, `textarea`) odaklandıkları HER durumda
//    `:focus-visible` ile eşleşir — fareyle tıklansalar bile. Çağrı
//    yerlerinin çoğu tam olarak o tür, yani o alanlarda halka fareyle de
//    görünür. Bu BİLİNÇLİ kabul: alan zaten yazmaya açılıyor, halka
//    "buradasın" diyor ve kapı onu her zemine karşı ölçüyor. Yorumun ilk
//    hâli "fare kullanıcısı görmez" diyordu ve bu, okuyanı yanıltıyordu.
//
// `focus:outline-none` KALDI ve bu bilinçli: Tailwind 3'te o sınıf
// `outline: 2px solid transparent` üretiyor — yani Windows Yüksek Kontrast
// (`forced-colors`) modunda saydam kenar sistem rengine boyanır ve gösterge
// KAYBOLMAZ. Düz CSS ile göstergeyi kapatmak ya da Tailwind'in sıfır
// genişlikli karşılığını kullanmak bu emniyeti yok eder; kapı ikisini de
// yasaklıyor — ADLARINI BURAYA YAZMADAN, çünkü Tailwind içerik taramasını
// YORUMLARA DA uyguluyor: ilk hâlde bu iki sınıf, hiçbir yerde
// kullanılmadıkları hâlde üretilen CSS'e girdi (denetçi canlı pakette
// buldu) ve kapı kendi yasakladığı sınıfı pakete sokan taraf oldu.
//
// BOŞLUK NEDEN ZORUNLU: dolu marka butonunda halka ile dolgu AYNI renk
// (kontrast 1.00) — halka görünmez, buton yalnız 2px şişmiş gibi durur.
// Boşluk yığını ayırıyor: dolgu → 2px kart rengi → 2px halka. Ölçüm:
// boşluk/dolgu 7.50 (gece 6.67), halka/boşluk 7.50 (gece 6.67). Boşluk
// rengi `surface`e çivili; kontrol `surface-bg` ya da `surface-alt` üstünde
// durduğunda sapma gündüz 1.06–1.15, gecede 1.11–1.15, yani gözle fark
// edilmiyor — halkanın kendi kontrastı zaten HER zemine karşı ölçülüyor.
// Boşluk ayrıca halkayı girdi kenarlığından da ayırıyor (değseler 2.10).
export const FOCUS =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 ' +
  'focus-visible:ring-offset-2 focus-visible:ring-offset-surface';

// İÇE ÇİZİLEN VARYANT — yalnız `overflow-hidden` bir kabın KENARINA DAYALI
// kontroller için. Dışa çizilen halka orada kırpılır (özet satırı kartın
// içinde `flex-1`, şoför panosunun başlık düğmesi `w-full` ve kart
// `overflow-hidden`), segment rayında ise 4px'lik oluğa sığmayıp komşu
// düğmenin üstüne taşar. Boşluk YOK, çünkü içe çizilen halkanın komşusu
// kontrolün kendi zemini ve orada ölçüm zaten geçiyor.
export const FOCUS_INSET =
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600';
