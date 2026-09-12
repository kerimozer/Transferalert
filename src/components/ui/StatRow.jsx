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
// `tone: 'lead'` satırın TEK baş sayısıdır (büyük + marka rengi). Eski adı
// `brand`'di; artık yalnız rengi değil BOYUTU da belirlediği için bir renk
// adı taşıması yanıltıcıydı. Satırda birden fazla `lead` olmamalı — iki baş
// sayı hiyerarşiyi yeniden eşitler.
export default function StatRow({ items }) {
  return (
    <div className="flex bg-surface border border-surface-border rounded-card overflow-hidden">
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
            {/* SAYILAR EŞİT AĞIRLIKTA DEĞİL (2026-09-09) — mobil ikizinde aynı
                karar. Dördü de 22/700/ink iken satır "dört eşit sayı" diye
                okunuyordu ve kullanıcı "anlaşılır değil" dedi; eksik olan RENK
                değil HİYERARŞİYDİ. Sabah bakarken tek soru "kaç aktif işim
                var", diğer üçü geçmiş.

                Ayrı bir renk noktası EKLENMEDİ (kullanıcının önerisiydi):
                ikonlar bu satırdan tam bu sebeple çıkarılmıştı, sayıyla
                yarışıyorlardı. Semantik rengi sayının KENDİSİ taşır.

                SABİT YÜKSEKLİK + alta hizalama ŞART: iki farklı punto doğal
                satır yüksekliğiyle bırakılırsa dört etiket kayık durur ve
                satır tek bir özet olmaktan çıkar. */}
            <div className="h-[34px] flex items-end justify-center" aria-hidden="true">
              <span
                className={`font-bold tabular-nums ${
                  it.tone === 'lead'
                    ? 'text-[28px] leading-8 tracking-[-0.8px]'
                    : 'text-base leading-5 tracking-[-0.3px]'
                } ${
                  // Sıfır bir DURUM değil, boşluktur — mürekkep tonunda basılınca
                  // "0 iptal" ile "9 tamamlandı" aynı ağırlıkta görünüyor.
                  it.value === 0 ? 'text-ink-muted' : it.tone === 'lead' ? 'text-brand-600' : 'text-ink-soft'
                }`}
              >
                {it.value}
              </span>
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
