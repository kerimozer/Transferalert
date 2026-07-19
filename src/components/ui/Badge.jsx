// Durum rozeti — renk anlam taşır, süs değildir.
// İki kullanım şekli:
//   1) Semantik: <Badge tone="ok">Tamamlandı</Badge>
//   2) lib/status haritalarıyla: <Badge cls={RES_STATUS_BADGE[r.status].cls}>...</Badge>
//      (harita zaten tam sınıf üretir; tone yok sayılır)
const TONES = {
  brand:   'bg-brand-50 text-brand-700',
  ok:      'bg-ok-50 text-ok-800',
  warn:    'bg-warn-50 text-warn-800',
  bad:     'bg-bad-50 text-bad-800',
  neutral: 'bg-surface-alt text-ink-soft',
};

export default function Badge({ tone = 'neutral', cls, icon: Icon, className = '', children }) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap',
        cls || TONES[tone] || TONES.neutral,
        className,
      ].join(' ')}
    >
      {Icon && <Icon size={11} aria-hidden="true" />}
      {children}
    </span>
  );
}
