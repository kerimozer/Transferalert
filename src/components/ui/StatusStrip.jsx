import { Plane, Car } from 'lucide-react';
import { FLIGHT_BADGE, stripTone } from '../../lib/status';
import { typeKey, TYPE_AIRPORT } from '../../lib/transfer';

// "Kart C" DURUM ŞERİDİ — kartın üstündeki tonlu bant.
// Bkz. design/yon-secimi/KARAR.md → "Kart anatomisi".
//
// ÜÇ SAYFA bunu kullanır: Transferlerim (dispatcher), şoför panosu
// (/sofor/:token) ve taşeron iş linki (/job/:token). Üçünde ayrı ayrı
// yazılmıştı ve wording bile ayrışmıştı — biri "İndi" derken diğeri
// "Uçak indi" diyordu. Aynı transferin iki ekranda farklı görünmesi, bu
// projenin tekrar tekrar yandığı sınıf.
//
// NE SÖYLER: canlı uçuş verisi varsa DURUMU (Havada / İndi / İptal), yoksa
// TÜRÜ (Havalimanı / Transfer). Tür kararı lib/transfer.js'ten gelir —
// ikinci bir cevap üretmiyoruz.
export default function StatusStrip({ r, children }) {
  const fs = r?.latest_status?.flight_status;
  const badge = fs ? (FLIGHT_BADGE[fs] || FLIGHT_BADGE.scheduled) : null;
  const tk = typeKey(r);
  const Icon = tk === TYPE_AIRPORT ? Plane : Car;

  // TON KARARI BURADA DEĞİL, `lib/status.js` → `stripTone()`de: kural mobil
  // ikizinde de var ve satır-içi bırakıldığında hiçbir kapı onu görmüyordu.
  // Yalnız TON düşer, İÇERİK düşmez: biten işte de etiket ("İndi") ve nokta
  // yerinde kalır — bilgi yanlış değil, sadece artık öncelikli değil.
  const tone = stripTone(r);

  const pickup = r?.scheduled_pickup ? new Date(r.scheduled_pickup) : null;
  const valid = pickup && !Number.isNaN(pickup.getTime());

  // BUGÜNSE TARİH BASILMAZ — mobil TransferCard ile aynı kural (orada zaten
  // yazılıydı, web ondan ayrışmıştı). Transferlerim listesi zaten "Bugün" /
  // "Yarın" başlıklarıyla gruplu; başlığın altında "03.09" basmak, tarihin
  // VAR OLMASINI anlamlı kılan şeyi (bu iş bugün değil) gürültüye çevirir.
  const now = new Date();
  const isToday = valid
    && pickup.getFullYear() === now.getFullYear()
    && pickup.getMonth() === now.getMonth()
    && pickup.getDate() === now.getDate();

  return (
    <div className={`flex items-center gap-2 px-4 py-2 ${tone}`}>
      {/* Canlı veri varken NOKTA, yokken TÜR İKONU: nokta "bu bir durum"
          demektir, ikon "bu bir kategori". İkisi aynı işareti kullanırsa
          şerit, bilmediği bir şeyi biliyormuş gibi görünür. */}
      {badge
        ? <span className="w-[7px] h-[7px] rounded-full bg-current shrink-0" aria-hidden="true" />
        : <Icon size={13} className="shrink-0" aria-hidden="true" />}
      <span className="text-xs font-bold truncate">
        {badge ? badge.label : (tk === TYPE_AIRPORT ? 'Havalimanı' : 'Transfer')}
      </span>
      {children}
      <span className="grow" />
      {/* TARİH, bugün olmasa da BASILIR. Yalnız saat gösterilince bugünkü iş
          ile üç gün sonraki iş birebir aynı görünüyordu; şoför panosu ve
          arama geçmişi ikisini yan yana listeliyor.
          Saat SABİT GENİŞLİKLİ SÜTUNDA DEĞİL, şeritte ve `nowrap`: 54px'lik
          sütunda "13:00" ikiye bölünüyordu ("13:0 / 0"). */}
      {valid ? (
        <>
          {/* OPACITY YOK — hiyerarşi BOYUT ve AĞIRLIKLA kurulur. `opacity-70`
              ile basılıyordu ve kapı bunu göremiyordu: kapı tam tonu ölçüyor,
              ekranda basılan ise solmuş hâliydi — altı şerit tonunun beşinde
              gerçek oran 3.13–3.88, yani AA altı. Üstelik tarih yalnız "bu iş
              bugün DEĞİL" iken çıkıyor, yani en çok işe yaradığı anda en zor
              okunan metindi. Mobil ikizde de aynı düzeltme (ikisi 0.75/0.70 ile
              AYRIŞMIŞTI da — ikiz dosyalarda sayı da token gibi eşit olmalı). */}
          {!isToday && (
            <span className="text-[11px] font-medium tabular-nums whitespace-nowrap shrink-0">
              {pickup.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' })}
            </span>
          )}
          <span className="text-sm font-bold tabular-nums whitespace-nowrap shrink-0">
            {pickup.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </>
      ) : (
        /* BOZUK TARİHTE SESSİZ KALMA — mobil TransferCard ile aynı kural.
           Hiçbir şey basmamak, saati olmayan bir kartı "saati henüz
           girilmemiş" gibi değil, NORMAL gibi gösterir. Üstelik Ana Sayfa'nın
           alt sınırı (`NaN > x` → false) bozuk tarihli kaydı listeden sessizce
           düşürüyor; "—" o sessiz düşmeyi teşhis edilebilir kılan tek iz. */
        /* RENGİ TONDAN MİRAS ALIR, sabit değil: `text-ink-muted` ile
           sabitlenmişti ve yeni açık şerit zeminlerinin BEŞİNDE AA altına
           düşüyordu (4.15–4.42). Mobil ikizi zaten `tone.color` kullanıyordu —
           yani aynı işaret iki platformda farklı okunurluktaydı. Şeridin
           bütün metinleri tonun mürekkebini alır; bu da almalı. */
        <span className="text-sm font-bold shrink-0">—</span>
      )}
    </div>
  );
}
