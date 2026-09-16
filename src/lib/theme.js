// TEMA TERCİHİ (WEB) — DÖRT değer, tek kaynak:
// 'auto' (saate göre) | 'system' | 'light' | 'dark'.
//
// NEDEN VAR (A6, 2026-09-12): gece modu canlıya çıktı ve kullanıcı onu İKİ TUR
// boyunca bulamadı — uygulamanın içinde ondan bahseden tek bir şey yoktu,
// çünkü karar tamamen işletim sisteminin `prefers-color-scheme` ayarına
// yaslanıyordu. Keşfedilemeyen özellik yapılmamış sayılır.
//
// A8 (2026-09-16): `'auto'` eklendi ve VARSAYILAN oldu — tema artık işletim
// sisteminin ayarına değil SAATE göre dönüyor. Eski kayıt göçü GEREKMİYOR:
// depoya yalnız kullanıcı seçeneğe dokunduğunda yazılıyor, yani `'system'`
// yazan bir tarayıcıda bu bir TERCİHTİR; hiç dokunmamış tarayıcının deposu
// boş ve varsayılan değişince kendiliğinden `'auto'`ya geçiyor.
//
// MOBİL İKİZİ: `mobile/src/lib/themePref.js`. Dört değer, gece penceresi ve
// `temaSemasi()`nin davranışı BİREBİR aynı olmak zorunda (iki depoda da
// `test-tokens` kapısı bunu ölçüyor) — yoksa aynı kullanıcı telefonunda
// "Otomatik", tarayıcısında başka bir şey anlamına gelen bir ayar bulur.
//
// WEBDE MOBİLDEKİ "YENİDEN AÇIN" KISITI YOK: mobilde palet modül yüklenirken
// seçiliyor (602 stil referansı `StyleSheet.create` içinde), burada CSS
// değişkeni değişince sayfa ANINDA dönüyor — saat sınırı sayfa açıkken
// geçilse bile (bkz. `temaIzle`).

export const TEMA_DEGERLERI = ['auto', 'system', 'light', 'dark'];

const ANAHTAR = 'app_theme';   // mobille AYNI ad — tek bir kavram, iki istemci

// GECE PENCERESİ — 21:00 dahil, 07:00 hariç; TARAYICININ YEREL saati.
// Mobil ikiziyle aynı sayılar olmak zorunda (kapı ikisinde de sabit yazılı,
// `test-transfer.mjs` deseninin aynısı: iki depo CI'da yan yana duramaz).
// Ekrandaki ipucu metni bu sayılardan TÜRETİLİR, elle yazılmaz.
//
// DİKKAT: `index.html`teki satır içi betik aynı kararı İLK BOYADAN ÖNCE
// tekrar veriyor (modül yüklenene kadar beklenirse koyu temadaki kullanıcı
// bir kare beyaz görür). O kopya kapıda GERÇEKTEN KOŞTURULUP buradaki
// sonuçla karşılaştırılıyor — iki kopya sessizce ayrışmasın diye.
export const GECE_BASI = 21;
export const GECE_SONU = 7;

// SAF — verilen an gece penceresinde mi. Saat DIŞARIDAN alınır; içeride
// `new Date()` okunsaydı kapı sınır davranışını hiçbir şekilde ölçemezdi.
export function saatGece(simdi) {
  const s = (simdi instanceof Date ? simdi : new Date()).getHours();
  // Gece yarısını AŞAN pencere: `s >= 21 && s < 7` hiçbir saatte doğru
  // olmaz ve özellik sessizce hiç çalışmazdı.
  return GECE_BASI > GECE_SONU ? (s >= GECE_BASI || s < GECE_SONU)
                               : (s >= GECE_BASI && s < GECE_SONU);
}

// SAF — hangi şemanın geçerli olduğunu söyler, hiçbir yere dokunmaz.
// Kapı bunun DAVRANIŞINI ölçer, varlığını değil.
export function temaSemasi(tercih, cihaz, simdi) {
  if (tercih === 'light' || tercih === 'dark') return tercih;
  // 'system' AÇIK BİR SEÇİM: varsayılan olmaktan çıktı ama listede kaldı.
  if (tercih === 'system') return cihaz || null;
  // 'auto' VE tanınmayan değer → SAAT. Bozuk bir kayıt ile hiç kayıt
  // olmaması aynı temayı üretmeli; ayrı yerlere düşseler aradaki farkı
  // ekranda hiçbir şey açıklamazdı.
  return saatGece(simdi) ? 'dark' : 'light';
}

export function cihazSemasi() {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  } catch (_) {
    return null;
  }
}

// DEPO DIŞARIDAN VERİLEBİLİR ve bu kapının var olma şartı: tercihin yazılıp
// geri okunabildiği sahte bir depoyla ölçülebilsin. Yalnız saf çözücüyü
// ölçmek yetmez — o bozulamaz; bozulabilen kalıcılığın iki ucu.
function varsayilanDepo() {
  return {
    oku: () => localStorage.getItem(ANAHTAR),
    yaz: (v) => localStorage.setItem(ANAHTAR, v),
  };
}

export function temaOku(depo) {
  try {
    const v = (depo || varsayilanDepo()).oku();
    return TEMA_DEGERLERI.includes(v) ? v : 'auto';
  } catch (_) {
    return 'auto';
  }
}

// YAZMA BAŞARIYI DÖNER ve çağıran onu EKRANA BASMAK ZORUNDA.
export function temaYaz(tercih, depo) {
  if (!TEMA_DEGERLERI.includes(tercih)) return false;
  try {
    const d = depo || varsayilanDepo();
    d.yaz(tercih);
    // GERİ OKU: `localStorage.setItem` Safari'nin özel penceresinde ve kota
    // dolu olduğunda atar, ama bazı gömülü tarayıcılarda SESSİZCE hiçbir şey
    // yapmaz. Geri okunmasaydı ekran "seçildi" der, kullanıcı sayfayı
    // yenilediğinde eski paleti bulurdu.
    return d.oku() === tercih;
  } catch (_) {
    return false;
  }
}

// DAMGA — CSS'in tek anahtarı. `index.css` gece paletini
// `:root[data-theme="dark"]` altında tanımlıyor; `index.html`teki satır içi
// betik aynı damgayı İLK BOYADAN ÖNCE basıyor (yoksa koyu temadaki kullanıcı
// bir kare beyaz görürdü).
export function temaUygula(tercih, simdi) {
  const sema = temaSemasi(tercih, cihazSemasi(), simdi) === 'dark' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', sema);
  // TARAYICI ÇUBUĞU DA DÖNER. Değer PALETTEN okunur, buraya hex
  // kopyalanmaz: kopyalanan her tanım bu projede er geç ayrıştı ve
  // ayrıştığını kimse görmedi.
  // try/catch YOK: bu satırların atabileceği tek ortam DOM'suz bir ortam,
  // orada da yukarıdaki `documentElement` erişimi zaten atardı. Boş bir
  // catch eklemek gerçek bir hatayı yutan yeni bir sessiz yol açardı.
  const meta = document.querySelector('meta[name="theme-color"]');
  const kok = getComputedStyle(document.documentElement);
  const ton = kok.getPropertyValue(sema === 'dark' ? '--c-surface-bg' : '--c-brand-600').trim();
  if (meta && ton) meta.setAttribute('content', `rgb(${ton})`);
  return sema;
}

// İKİ ABONELİK, İKİ AYRI SEBEP — ve ikisi de olmazsa aynı sessizlik doğar:
// kullanıcı bir şeyin değişmesini bekler, sekmeye bakar, hiçbir şey olmaz.
//
// (1) SİSTEM TEMASI: `'system'` seçiliyken işletim sistemi teması değişirse
//     sayfa anında dönsün. Mobil tarafta aynı boşluk denetimde yakalandı.
// (2) SAAT (A8): `'auto'` seçiliyken sayfa açıkken 21:00 geçilirse sayfa
//     anında dönsün. Abonelik olmadan gece nöbetindeki dispatcher ekranı
//     akşam 20:50'de açar ve sabaha kadar gündüz paletinde kalır — yani
//     özelliğin tam da var olma sebebi sessizce karşılanmaz.
//
// DAKİKADA BİR TİK, sınıra kurulan tek bir zamanlayıcı DEĞİL: hedef anı
// hesaplayan bir `setTimeout` yaz saati geçişinde, cihaz saati elle
// değiştirildiğinde ve sekme uyutulup uyandırıldığında yanlış ana kurulu
// kalır. Periyodik tik kendi kendini düzeltir ve `temaUygula` zaten
// değişiklik yoksa aynı damgayı basar (idempotent).
export function temaIzle() {
  const el = () => temaUygula(temaOku());
  // AYRI TRY: `matchMedia` yoksa (çok eski webview) SAAT aboneliği yine de
  // kurulmalı. Tek bir try içinde olsalardı biri patladığında diğeri de
  // kurulmazdı ve otomatik mod o tarayıcıda sessizce ölürdü.
  let sok = () => {};
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', el);
    sok = () => mq.removeEventListener('change', el);
  } catch (e) {
    // BOŞ `catch` YOK: basılacak bir ekran olmasa da iz bırakılır. Sessizce
    // yutulsaydı "Sistem" seçeneği o tarayıcıda hiç çalışmaz ve sebebi
    // hiçbir yerde görünmezdi.
    console.warn('[tema] sistem teması aboneliği kurulamadı:', e?.message || e);
  }
  // `setInterval` try'a SARILMIYOR: tarayıcıda atmaz, ve atarsa bu gerçekten
  // duyulması gereken bir arızadır — yutmak yeni bir sessiz yol açardı.
  const zaman = setInterval(el, 60000);
  return () => { sok(); clearInterval(zaman); };
}
