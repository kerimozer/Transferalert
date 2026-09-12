/** @type {import('tailwindcss').Config} */
// TransferAlert tasarım token'ları (bkz. design/yon-secimi/KARAR.md)
//
// DEĞERLER ARTIK BURADA DEĞİL, `src/index.css`TE (2026-09-12, A1 gece modu).
// Bu dosya yalnız ADI değişkene bağlar; gündüz/gece değerleri CSS'te duruyor
// ve `prefers-color-scheme` ile dönüyor. Böylece hiçbir sayfanın sınıfına
// dokunulmadı — `bg-surface` aynı kaldı, altındaki değişken değişiyor.
//
// `rgb(var(--x) / <alpha-value>)` BİÇİMİ ZORUNLU: bu kod tabanında opaklık
// son eki 99 yerde kullanılıyor (`ring-brand-600/30`, `bg-bad-50/70`…) ve
// `var(--x)` düz yazılsaydı Tailwind'in `/30` sözdizimi SESSİZCE çalışmazdı —
// hata vermeden, sadece opaklık uygulanmadan.
//
// MOBİLLE İKİZ: `mobile/src/theme.js`. Bir token değiştirirken DÖRDÜNÜ birden
// güncelle: `src/index.css`, iki depodaki `scripts/test-tokens.mjs`, KARAR.md.
const t = (ad) => `rgb(var(--c-${ad}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // TEK marka rengi. Başka her renk semantiktir (durum). İkinci bir
        // birincil renk EKLEME — iki güçlü hue göze "bir renk = bir anlam"
        // kuralını öğretmez.
        //
        // GECEDE MARKA AÇIKTIR ve bu zorunluluk: gündüzde bu ton hem dolu
        // buton zemini hem ikon rengi (koyu-üstüne-açık ikisini de karşılar).
        // Gecede aynı ton hem beyaz metni taşıyacak kadar koyu hem koyu
        // sayfada okunacak kadar açık olamaz — dolu kontrol açık bir yamaya
        // döner ve üstüne `onfill` ile koyu mürekkep basılır.
        brand: { 50: t('brand-50'), 600: t('brand-600'), 700: t('brand-700') },
        // Sıcak vurgu — yalnız marka anlatımında (landing, PDF), durum DEĞİL.
        accent: { 50: t('accent-50'), 600: t('accent-600'), 800: t('accent-800') },
        surface: {
          DEFAULT: t('surface'), bg: t('surface-bg'), alt: t('surface-alt'),
          border: t('surface-border'), borderstrong: t('surface-borderstrong'),
          // GİRDİ SINIRI AYRI (2026-09-11, denetçi B11). WCAG 1.4.11 bir
          // bileşeni tanımlayan sınırdan ≥3:1 ister; `borderstrong` beyaz
          // kartta 1.52 veriyordu ve girdinin zemini de beyaz olduğu için
          // alanı gösteren başka işaret yoktu. `borderstrong` KOYULAŞTIRILMADI
          // çünkü ikincil butonlarda da kullanılıyor ve "sert border yok"
          // ilkesini bozardı.
          inputborder: t('surface-inputborder'),
          // Tür şeridi (canlı uçuş verisi gelmeden önce) — durum rengi DEĞİL.
          // İki tür de bu tonu kullanır ("canlı veri yok"), ayrımı ikon taşır.
          neutral: t('surface-neutral'),
          // "Planlandı" şeridi — canlı veri VAR ama olay yok.
          quiet: t('surface-quiet'),
          // Alarm satırının kenarlığı.
          dangerborder: t('surface-dangerborder'),
        },
        // ŞERİT ZEMİNLERİ — `ok`/`bad`/`warn` ailelerinin `50` tonlarının
        // YERİNE GEÇMEZ, AYRI bir ailedir. Rozet küçük bir çiptir; şerit
        // kartın tam genişliğinde bir banttır ve listede alt alta ONLARCA kez
        // tekrarlanır. Aynı tonun iki ölçekte aynı ağırlıkta okunacağını
        // varsaymak 2026-09-09 turunun kök nedeniydi.
        //
        // Gündüz: en yakın çift ΔE 14.4. Gece: 18.5 — ve gecede ölçüm zemini
        // SAYFA DEĞİL KART, çünkü şerit hep bir kartın içinde basılıyor.
        strip: {
          air: t('strip-air'), landed: t('strip-landed'),
          cancelled: t('strip-cancelled'), diverted: t('strip-diverted'),
          oliveink: t('strip-oliveink'), amberink: t('strip-amberink'),
          sandink: t('strip-sandink'),
        },
        // BİTEN işin şeridi — kendi renginin SAKİN hâli, tek gri DEĞİL.
        // Tek griye çökmek, listesi tamamen tamamlanmış bir firmada her
        // şeridi aynı yapıyor ve "hangi iş iptal olmuştu" sorusunu cevapsız
        // bırakıyordu. Gündüz en yakın çift ΔE 10.1, gece 15.7.
        done: {
          scheduled: t('done-scheduled'),
          air: t('done-air'), airink: t('done-airink'),
          landed: t('done-landed'), landedink: t('done-landedink'),
          cancelled: t('done-cancelled'), cancelledink: t('done-cancelledink'),
          diverted: t('done-diverted'), divertedink: t('done-divertedink'),
        },
        // DİKKAT: `muted` daha AÇIK bir tona çekilemez. #A8A29E beyaz üstünde
        // 2.7:1, #7C756C ise uygulamanın kendi zemininde 4.29 — ikisi de AA
        // altı. Şu anki değer her zeminde geçer (iki palette de).
        ink: { DEFAULT: t('ink'), soft: t('ink-soft'), muted: t('ink-muted') },
        // Bildirim KANALLARI — marka işaretleri, durum rengi DEĞİL.
        // `wa-700` WhatsApp'ın kendi yeşili DEĞİL ve olamaz: o renk açık
        // zeminde 1.77 kontrast veriyor, yani görünmüyor. Marka yeşili dolu
        // butonda kalır; bu ise ikon/metin için okunur aile tonu.
        wa:   { 50: t('wa-50'), 700: t('wa-700') },
        sms:  { 50: t('sms-50'), 700: t('sms-700') },
        ok:   { 50: t('ok-50'), 600: t('ok-600'), 800: t('ok-800') },
        warn: { 50: t('warn-50'), 600: t('warn-600'), 800: t('warn-800') },
        bad:  { 50: t('bad-50'), 600: t('bad-600'), 800: t('bad-800') },
        // DOLU BİR KONTROLÜN ÜSTÜNDEKİ MÜREKKEP. `text-white` bunun yerine
        // geçmez: o "saf beyaz" demek ve gecede dolgu açık bir yama olduğu
        // için okunmaz hâle gelir. Aynı şekilde `bg-white` kart zemini olarak
        // kullanılamaz — gece koyu sayfada bembeyaz kartlar bırakır.
        onfill: t('onfill'),
        // Seçili segment rayından AÇIK olmalı ("yükseltilmiş" işareti budur).
        // Gecede `surface` raydan KOYU, yani onu kullanmak sekmeyi çukura
        // çeviriyordu.
        segmentactive: t('segmentactive'),
      },
      // Manrope — Plus Jakarta Sans'ın yerini aldı. Türkçe diakritikleri temiz,
      // rakamları tabular. Inter/Roboto bilinçli olarak elendi.
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px', control: '12px' },
      // Gölge rengi de temaya bağlı: gündüz sıcak kahve, gece siyah.
      boxShadow: {
        card: '0 1px 2px rgb(var(--c-shadow) / .04), 0 6px 16px rgb(var(--c-shadow) / .05)',
      },
    },
  },
  plugins: [],
};
