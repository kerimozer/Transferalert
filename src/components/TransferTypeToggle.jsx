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

const OPTIONS = [
  { key: FLIGHT,         label: 'Uçuşlu',  hint: 'Havalimanı karşılama',   Icon: Plane },
  { key: POINT_TO_POINT, label: 'Uçuşsuz', hint: 'Otel, şehir içi, servis', Icon: Car },
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
                active ? 'bg-white text-brand-700 shadow-card' : 'text-ink-soft hover:text-ink'
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
