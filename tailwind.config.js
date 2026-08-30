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
          neutral: '#EFF1EF',
          // Alarm satırının kenarlığı.
          dangerborder: '#F1D9D3',
        },
        // DİKKAT: `muted` daha AÇIK bir tona çekilemez. #A8A29E beyaz üstünde
        // 2.7:1, #7C756C ise uygulamanın kendi zemininde (#FAF8F5) 4.29 —
        // ikisi de AA altı. Bu değer her zeminde geçer (bg 5.26).
        ink: { DEFAULT: '#211E1B', soft: '#5B554E', muted: '#6E675E' },
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
