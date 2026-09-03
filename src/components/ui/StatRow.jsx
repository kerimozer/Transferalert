import { Fragment } from 'react';
import { Link } from 'react-router-dom';

// TEK BÖLÜNMÜŞ SATIR — dört sayı yan yana, ~76px. Eski dört ayrı `StatCard`
// ızgarası dar ekranda iki satıra kırılıyor ve asıl işi (yaklaşan transferler)
// katlamanın altına itiyordu. Sayı bir duruma BAKMAKTIR; bakmak için ekranın
// yarısı gerekmez. Bkz. design/yon-secimi/KARAR.md → "Ana Sayfa".
//
// İKON YOK: dört ikon bu yükseklikte sayıyla yarışıyor ve hiçbiri etiketin
// söylemediği bir şey söylemiyor.
//
// items: [{ label, value, to, tone? }] — `to` ZORUNLU: sayıya bakan kişinin
// bir sonraki adımı hep "hangileri?" olur, satır orada bitmemeli.
export default function StatRow({ items }) {
  return (
    <div className="flex bg-white border border-surface-border rounded-card overflow-hidden">
      {items.map((it, i) => (
        <Fragment key={it.label}>
          {/* Ayraç kartın üst/alt kenarına DEĞMEZ: değdiğinde satır dört ayrı
              kutuya bölünmüş gibi okunur, oysa bu tek bir özet. */}
          {i > 0 && <div className="w-px my-[11px] bg-surface-border shrink-0" aria-hidden="true" />}
          <Link
            to={it.to}
            className="flex-1 min-w-0 px-1 py-[13px] text-center hover:bg-surface-alt focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-600/40"
            // Sayı ve etiket ayrı iki düğüm: ekran okuyucu ikisini kopuk okur.
            // Tek etikette birleştir.
            aria-label={`${it.label}: ${it.value}`}
          >
            <div
              className={`text-[22px] leading-7 font-bold tabular-nums tracking-[-0.7px] ${
                // Sıfır bir DURUM değil, boşluktur — mürekkep tonunda basılınca
                // "0 iptal" ile "9 tamamlandı" aynı ağırlıkta görünüyor.
                it.value === 0 ? 'text-ink-muted' : it.tone === 'brand' ? 'text-brand-600' : 'text-ink'
              }`}
              aria-hidden="true"
            >
              {it.value}
            </div>
            <div className="text-[11px] font-semibold text-ink-muted mt-0.5 truncate" aria-hidden="true">
              {it.label}
            </div>
          </Link>
        </Fragment>
      ))}
    </div>
  );
}
