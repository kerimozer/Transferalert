import Card from './Card';

// Özet istatistik kartı (Dashboard/Raporlar). Tasarım kuralı: BÜYÜK SAYI her
// zaman mürekkep renginde — renk ikon kutusunda kalır (renk anlamı ikonda taşınır,
// sayıyı boyamak ekranı bağırtır).
const TONES = {
  brand:  'bg-brand-50 text-brand-600',
  ok:     'bg-ok-50 text-ok-600',
  bad:    'bg-bad-50 text-bad-600',
  warn:   'bg-warn-50 text-warn-600',
  accent: 'bg-accent-50 text-accent-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'brand' }) {
  return (
    <Card padding="sm" className="p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-ink-muted">{label}</span>
        {Icon && (
          <div className={`p-2 rounded-control ${TONES[tone] || TONES.brand}`}>
            <Icon size={15} aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="text-3xl font-bold text-ink tabular-nums">{value}</div>
    </Card>
  );
}
