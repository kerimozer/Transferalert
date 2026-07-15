// Durum → rozet etiket/renk eşlemesi — tek kaynak.
// Yeni bir rezervasyon/uçuş durumu eklerken SADECE burayı güncelle;
// sayfalar bu haritaları import eder (sayfaya özel etiket gerekiyorsa
// spread ile üzerine yazılır, ReservationsPage'deki "Takipte" gibi).

export const RES_STATUS_BADGE = {
  active:    { label: 'Aktif',      cls: 'bg-brand-50 text-brand-700' },
  completed: { label: 'Tamamlandı', cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',      cls: 'bg-bad-50 text-bad-800' },
};

export const FLIGHT_BADGE = {
  landed:    { label: 'İndi',          cls: 'bg-ok-50 text-ok-800' },
  cancelled: { label: 'İptal',         cls: 'bg-bad-50 text-bad-800' },
  active:    { label: 'Havada',        cls: 'bg-brand-50 text-brand-700' },
  scheduled: { label: 'Planlandı',     cls: 'bg-surface-alt text-ink-soft' },
  diverted:  { label: 'Yönlendirildi', cls: 'bg-warn-50 text-warn-800' },
};
