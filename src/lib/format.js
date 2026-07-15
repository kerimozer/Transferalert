// Tarih/saat biçimlendirme yardımcıları — tek kaynak.
// Listelerdeki alış tarihi her yerde aynı kısa biçimde görünür: "GG.AA SS:DD".

export function formatPickup(d) {
  return new Date(d).toLocaleString('tr-TR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}
