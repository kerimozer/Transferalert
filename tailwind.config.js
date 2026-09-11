/** @type {import('tailwindcss').Config} */
// TransferAlert tasarım token'ları — tek kaynak (bkz. design/yon-secimi/KARAR.md)
// Bu değerler mobil `mobile/src/theme.js` ile BİREBİR aynı olmalı; ayrışırlarsa
// aynı transfer iki platformda farklı görünür.
//
// GÖRSEL DİL: "Yön 5 — Sentez" (2026-08-28 onaylandı).
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // TEK marka rengi. Başka her renk semantiktir (durum). İkinci bir
        // birincil renk EKLEME — iki güçlü hue göze "bir renk = bir anlam"
        // kuralını öğretmez.
        brand: {
          50: '#E3EFF1',
          600: '#0F5D6B',
          700: '#0A424D',
        },
        // Sıcak vurgu — yalnız marka anlatımında (landing, PDF), durum DEĞİL.
        accent: {
          50: '#F7EBE1', 600: '#AC5B34', 800: '#8F4E24',
        },
        surface: {
          DEFAULT: '#FFFFFF', bg: '#FAF8F5', alt: '#F3EFE9',
          border: '#E9E4DC', borderstrong: '#D8D1C6',
          // Tür şeridi (canlı uçuş verisi gelmeden önce) — durum rengi DEĞİL.
          // #EFF1EF idi ve `alt` ile arası ΔE 3.0'dı: "Havalimanı" ile
          // "Transfer" gözle ayrılmıyordu. Artık İKİ TÜR DE bu tonu kullanıyor
          // (ikisi de "canlı veri yok" demek), ayrımı ikon taşıyor.
          neutral: '#F1EEE9',
          // "Planlandı" şeridi — canlı veri VAR ama olay yok.
          quiet: '#F7E6BC',
          // Alarm satırının kenarlığı.
          dangerborder: '#F1D9D3',
        },
        // ŞERİT ZEMİNLERİ (2026-09-09) — `ok`/`bad`/`warn` ailelerinin `50`
        // tonlarının YERİNE GEÇMEZ, AYRI bir ailedir. Rozet küçük bir çiptir;
        // şerit kartın tam genişliğinde bir banttır ve listede alt alta
        // ONLARCA kez tekrarlanır. Aynı tonun iki ölçekte aynı ağırlıkta
        // okunacağını varsaymak bu turun kök nedeniydi.
        //
        // BİR TUR ÖNCE DOLUYDU (bg-ok-600 + beyaz metin) ve geri alındı: dolu
        // bant tek kartta harika, on kartta dayanılmaz. Ama eski `*-50`
        // tonlarına DÖNÜLMEDİ — ölçüldü ve elendi (Havada ↔ İndi ΔE 4.1,
        // yani doldurmadan önceki şikâyetin ta kendisi). Bu palet ikisini
        // birden tutar: sayfa ağırlığı ~5 kat düşer, en yakın çift ΔE 7.8.
        //
        // `oliveink`/`amberink` ödünç ALINMADI (ok-800 / warn-800 kullanılmadı):
        // onlar bu zeminlerde hiç ölçülmedi. Mobil ikizi: theme.js `strip*`.
        // 2026-09-11 — İKİNCİ AYAR. 09-09'da bant doygunluktan pastele
        // çekilmişti ve kullanıcı sonucu yine "renkler birbirine çok yakın"
        // buldu. ÖLÇÜM ONU DOĞRULADI: sakinlik AYRIMLA satın alınmış, en
        // yakın çift ΔE 27.2 → 7.8'e düşmüştü. Kroma + DEĞİŞKEN AÇIKLIK ile
        // ayrım 14.4'e çıktı, en ağır şerit 1.46 (tavan 1.6).
        strip: {
          air: '#C2DFE6', landed: '#C9E2B2',
          cancelled: '#F7CCBB', diverted: '#F5C88F',
          oliveink: '#31521A', amberink: '#6B3E08', sandink: '#6B4A08',
        },
        // BİTEN işin şeridi — kendi renginin SAKİN hâli, tek gri DEĞİL.
        // Tek griye çökmek, listesi tamamen tamamlanmış bir firmada her
        // şeridi aynı yapıyor ve "hangi iş iptal olmuştu" sorusunu
        // cevapsız bırakıyordu. Canlı hâlinden ΔE 8.8–27.1 uzak.
        done: {
          scheduled: '#EAE0C6',
          air: '#DCEAEF', airink: '#33525C',
          landed: '#D4E5C1', landedink: '#3F5530',
          cancelled: '#F3D6CA', cancelledink: '#7E4A40',
          diverted: '#F5DAAB', divertedink: '#6B5026',
        },
        // DİKKAT: `muted` daha AÇIK bir tona çekilemez. #A8A29E beyaz üstünde
        // 2.7:1, #7C756C ise uygulamanın kendi zemininde (#FAF8F5) 4.29 —
        // ikisi de AA altı. Bu değer her zeminde geçer (bg 5.26).
        ink: { DEFAULT: '#211E1B', soft: '#5B554E', muted: '#6E675E' },
        // Bildirim KANALLARI — marka işaretleri, durum rengi DEĞİL.
        // `wa-700` WhatsApp'ın kendi yeşili (#25D366) DEĞİL ve olamaz: o renk
        // açık zeminde 1.77 kontrast veriyor, yani görünmüyor. Marka yeşili
        // dolu butonda (beyaz metinle) kalır; bu ise ikon/metin için okunur
        // aile tonu. SMS mavisi marka petrolünden ΔE 49 uzak — karışmıyor.
        wa:   { 50: '#E6F6EC', 700: '#0F7A42' },
        sms:  { 50: '#E4EEFB', 700: '#1B5FB8' },
        ok:   { 50: '#E5F0EA', 600: '#2E6F52', 800: '#1E523C' },
        warn: { 50: '#FAEEDB', 600: '#96580F', 800: '#7A460A' },
        bad:  { 50: '#F8E7E3', 600: '#A93B29', 800: '#8A2E20' },
      },
      // Manrope — Plus Jakarta Sans'ın yerini aldı. Türkçe diakritikleri temiz,
      // rakamları tabular. Inter/Roboto bilinçli olarak elendi.
      fontFamily: { sans: ['Manrope', 'system-ui', 'sans-serif'] },
      borderRadius: { card: '16px', control: '12px' },
      boxShadow: { card: '0 1px 2px rgba(90,80,70,.04), 0 6px 16px rgba(90,80,70,.05)' },
    },
  },
  plugins: [],
};
