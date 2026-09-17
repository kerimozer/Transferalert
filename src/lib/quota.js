// AYLIK TRANSFER KOTASI UYARISI — İKİZ DOSYA (S1, 2026-09-16).
//
// ⚠️ `mobile/src/lib/quota.js` ile BİREBİR AYNI olmak zorunda. İki depo CI'da
// yan yana duramadığı için korumanın yolu, beklenen çıktının HER İKİ depodaki
// `scripts/test-quota.mjs` kapısında SABİT yazılı olması (`lib/transfer.js`
// deseninin aynısı). Metin burada değişirse iki kapıdan biri kırılır.
//
// NEDEN BURADA: backend `/api/organizations/usage` sayıları veriyor ama
// CÜMLEYİ vermiyor. Cümle iki istemcide ayrı ayrı kurulsaydı aynı kullanıcı
// telefonunda ve tarayıcısında aynı kotayı farklı ifadelerle görürdü — bu
// projede defalarca yaşanan "iki kopya sessizce ayrışır" sınıfı.

// BİN AYIRACI ELDE YAZILIYOR, `toLocaleString` İLE DEĞİL: React Native'in
// Hermes motorunda Intl desteği sürüme göre değişiyor ve eksik olduğunda
// sessizce ayraçsız sayı basıyor. O zaman aynı tutar webde "1.680 TL",
// telefonda "1680 TL" görünürdü. Elde yazılan biçim iki platformda da aynı
// ve kapıda ölçülebilir.
export function tl(n) {
  const tam = Math.round(Number(n) || 0);
  return String(tam).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' TL';
}

// NEYİN KOTADAN DÜŞTÜĞÜ — müşteriye söylenen TEK cümle (D8, 2026-09-17).
//
// Kota artık silinemez bir defterden (`usage_events`, migration 033) türüyor:
// kaydı silmek sayacı düşürmüyor. Bu, faturayı doğru yapan bir değişiklik ama
// aynı zamanda kullanıcının GÖREMEDİĞİ bir değişiklik — ve bu projede
// "keşfedilemeyen özellik yapılmamış sayılır". Sayaç neden düşmediğini
// anlamayan bir dispatcher, üründe hata olduğunu düşünür.
//
// Cümle İKİ tarafı birden söylüyor. Yalnız "silmek düşürmez" denseydi ceza
// gibi okunurdu; yalnız "iptal iade edilir" denseydi eksik olurdu. İkisi
// birlikte kuralın gerekçesini de taşıyor: gerçekleşmemiş transfer için para
// alınmaz, gerçekleşmiş transfer kaydı silinerek geri alınmaz.
export const KOTA_KURALI =
  'Kota, transfer kaydı açıldığında düşer. Alış saatinden önce iptal ettiğiniz ' +
  'ya da sildiğiniz transferler kotanıza geri eklenir; alış saati geçmiş bir ' +
  'kaydı silmek kotayı geri getirmez.';

// `/api/organizations/usage` cevabından kullanıcıya gösterilecek uyarı.
// `null` = gösterilecek bir şey yok.
//
// SESSİZ HÂL BİLİNÇLİ: kota rahatken hiçbir şerit basılmaz. Kalıcı bir
// "84/100 transfer" göstergesi her gün görülür ve görüldükçe okunmaz olur;
// o zaman gerçekten önemli olduğu gün de okunmaz. Şerit yalnız DURUM
// değiştiğinde konuşur.
export function kotaUyarisi(k) {
  if (!k || !k.limit) return null;                 // sınırsız ya da veri yok
  if (k.durum !== 'yaklasiyor' && k.durum !== 'asildi') return null;

  const sayac = `${k.kullanim} / ${k.limit} transfer`;

  // KOTA TAM DOLDUĞU AN AYRI BİR CÜMLE İSTER (denetim bulgusu D7).
  //
  // Bu hâl sunucudaki `durum` alanında YOK: backend eşiğe göre hâlâ
  // `'yaklasiyor'` diyor ve bu DOĞRU — `durum` bir eşik ölçüsü, cümle ise
  // kullanıcıya söylenen şey. Yeni bir `durum` değeri eklemek backend
  // sözleşmesini değiştirirdi; hâl `kalan`/`asim`den TÜRETİLİYOR (projenin
  // "anahtar değişmez, metin türe göre seçilir" deseni).
  //
  // Düzeltilen çelişki: 100/100'de ekran hem "sonuna YAKLAŞTINIZ" diyordu
  // hem "100 / 100" gösteriyordu, üstelik "kota DOLDUĞUNDA" diye gelecek
  // zaman kullanıyordu — kota zaten doluydu. Kullanıcının şeridi en dikkatli
  // okuyacağı an tam olarak bu andır.
  if (k.kalan === 0 && k.asim === 0) {
    const ucret = k.asimFiyat > 0
      ? `bundan sonraki her transfer ${tl(k.asimFiyat)} olarak faturaya eklenir.`
      : 'bundan sonraki transferler için ek ücret alınmaz.';
    return {
      tone: 'warn',
      baslik: 'Aylık kotanız doldu',
      detay: `Bu ay ${sayac} kullandınız. Transferleriniz DURMAZ; ${ucret}`,
    };
  }

  if (k.durum === 'asildi') {
    // AŞIM METNİ ÖNCE "DEVAM EDİYOR" DER. Kullanıcının ilk düşüncesi
    // "transferlerim durdu mu?" olur; cevabı cümlenin başında vermek,
    // paniği ortadan kaldırır. Kota ENGELLEMEZ, UYARIR (migration 032).
    const ucret = k.asimTutari > 0
      ? `${k.asim} aşım transferi ${tl(k.asimTutari)} olarak faturalanacak.`
      : `${k.asim} transfer kotanızın üzerinde — bu ay için ek ücret yok.`;
    return {
      tone: 'warn',
      baslik: 'Aylık kotanızı aştınız',
      detay: `Bu ay ${sayac} kullandınız. Transferleriniz devam ediyor; ${ucret}`,
    };
  }

  // "DURMAZ" burada da açıkça yazılı: kotaya yaklaştığını gören kullanıcının
  // ilk korkusu işinin kesileceğidir. Söylenmezse dispatcher ayın sonunda
  // transfer kaydetmekten çekinir — ürünün işe yaramaz hâle geldiği an.
  return {
    tone: 'notice',
    baslik: 'Aylık kotanızın sonuna yaklaştınız',
    detay: `Bu ay ${sayac} kullandınız. Kota dolduğunda transferleriniz DURMAZ; aşan transferler faturaya eklenir.`,
  };
}
