// Boş durum — davet eder, özür dilemez. Başlık alanı adlandırır, tek satır
// açıklama, varsa eylem. size="sm" kart içi küçük boşluklar için
// (Raporlar'daki "Henüz veri yok" gibi), varsayılan tam alan boşlukları için.
export default function EmptyState({ icon: Icon, title, description, action, size = 'md' }) {
  if (size === 'sm') {
    return <p className="text-sm text-ink-muted text-center py-4">{title}</p>;
  }
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-6">
      {Icon && <Icon size={40} className="text-ink-muted mb-3" aria-hidden="true" />}
      <p className="font-semibold text-ink">{title}</p>
      {description && <p className="text-sm text-ink-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
