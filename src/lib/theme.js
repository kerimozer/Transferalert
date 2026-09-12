// TEMA TERCİHİ (WEB) — üç değer, tek kaynak: 'system' | 'light' | 'dark'.
//
// NEDEN VAR (A6, 2026-09-12): gece modu canlıya çıktı ve kullanıcı onu İKİ TUR
// boyunca bulamadı — uygulamanın içinde ondan bahseden tek bir şey yoktu,
// çünkü karar tamamen işletim sisteminin `prefers-color-scheme` ayarına
// yaslanıyordu. Keşfedilemeyen özellik yapılmamış sayılır.
//
// MOBİL İKİZİ: `mobile/src/lib/themePref.js`. Üç değer ve `temaSemasi()`nin
// davranışı BİREBİR aynı olmak zorunda (iki depoda da `test-tokens` kapısı
// bunu ölçüyor) — yoksa aynı kullanıcı telefonunda "Sistem", tarayıcısında
// başka bir şey anlamına gelen bir ayar bulur.
//
// WEBDE MOBİLDEKİ "YENİDEN AÇIN" KISITI YOK: mobilde palet modül yüklenirken
// seçiliyor (602 stil referansı `StyleSheet.create` içinde), burada CSS
// değişkeni değişince sayfa ANINDA dönüyor.

export const TEMA_DEGERLERI = ['system', 'light', 'dark'];

const ANAHTAR = 'app_theme';   // mobille AYNI ad — tek bir kavram, iki istemci

// SAF — hangi şemanın geçerli olduğunu söyler, hiçbir yere dokunmaz.
// Kapı bunun DAVRANIŞINI ölçer, varlığını değil.
export function temaSemasi(tercih, cihaz) {
  if (tercih === 'light' || tercih === 'dark') return tercih;
  // 'system' VE tanınmayan değer → cihaz. Bozuk/eski bir kayıt kullanıcıyı
  // sabit bir palete çivilememeli.
  return cihaz || null;
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
    return TEMA_DEGERLERI.includes(v) ? v : 'system';
  } catch (_) {
    return 'system';
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
export function temaUygula(tercih) {
  const sema = temaSemasi(tercih, cihazSemasi()) === 'dark' ? 'dark' : 'light';
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

// 'system' seçiliyken işletim sistemi teması değişirse sayfa ANINDA dönsün.
// Abonelik olmadan kullanıcı sistem temasını değiştirir, sekmeye döner ve
// hiçbir şey olmaz — mobil tarafta aynı boşluk denetimde yakalandı.
export function temaIzle() {
  try {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const el = () => temaUygula(temaOku());
    mq.addEventListener('change', el);
    return () => mq.removeEventListener('change', el);
  } catch (_) {
    return () => {};
  }
}
