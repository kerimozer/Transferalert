// Transfer türü seçimi — ORTAK bileşen.
//
// Üç ayrı formda görünüyor (panel içindeki transfer ekleme, otel talep
// sayfası, iş ortağı portalı). Her birine ayrı yazılsaydı kaçınılmaz olarak
// ayrışırlardı: birinde uçuşsuz seçeneği olup diğerinde olmaması, aynı firmaya
// bağlı iki kanalın farklı iş kabul etmesi demektir.
//
// NEDEN SEGMENTED CONTROL, AÇILIR LİSTE DEĞİL: iki seçenek var ve ikisi de tek
// bakışta görünmeli. Anlam yalnız renkle taşınmaz — her seçenek ikon + metin +
// kısa açıklama ile gelir; seçili olan `aria-checked` ile de bildirilir.
import { Plane, Car } from 'lucide-react';
import { FLIGHT, POINT_TO_POINT } from '../lib/transfer';

// Etiketler kaydı YOKLUĞUYLA tanımlamaz: eski çift "Uçuşlu / Uçuşsuz" idi ve
// ikincisi "bu bir eksik" gibi okunuyordu. Firmanın kendi kelimeleri kullanılır
// (bkz. lib/transfer.js → typeKey).
const OPTIONS = [
  { key: FLIGHT,         label: 'Havalimanı', hint: 'Uçuş takipli karşılama',  Icon: Plane },
  { key: POINT_TO_POINT, label: 'Transfer',   hint: 'Otel, şehir içi, servis', Icon: Car },
];

export default function TransferTypeToggle({ value, onChange, label = 'Transfer Türü' }) {
  return (
    <div>
      <label className="block text-sm font-semibold text-ink-soft mb-1.5">{label}</label>
      <div role="radiogroup" aria-label={label} className="grid grid-cols-2 gap-1 p-1 bg-surface-alt rounded-card">
        {OPTIONS.map(({ key, label: optLabel, hint, Icon }) => {
          const active = value === key;
          return (
            <button
              key={key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(key)}
              className={`flex flex-col items-center gap-0.5 rounded-control px-3 py-2.5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/30 ${
                // SEÇİLİ SEKME `segmentactive` KULLANIR, `surface` DEĞİL.
                // Gündüzde ikisi de beyaz, yani fark görünmüyordu; gecede
                // `surface` (#1E262B) raydan (#252E33) DAHA KOYU, yani
                // "yükseltilmiş" işareti tersine dönüp sekmeyi ÇUKUR
                // gösteriyordu. `shadow-card` da gecede siyah gölge olduğu
                // için koyu kartta hiçbir şey çizmiyor — kenarlık o yüzden
                // eklendi, yükseklik iddiası tek başına gölgeye dayanamaz.
                active
                  ? 'bg-segmentactive text-brand-700 border border-surface-borderstrong'
                  : 'border border-transparent text-ink-soft hover:text-ink'
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-semibold">
                <Icon size={16} aria-hidden="true" /> {optLabel}
              </span>
              <span className="text-[11px] text-ink-muted leading-tight text-center">{hint}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
