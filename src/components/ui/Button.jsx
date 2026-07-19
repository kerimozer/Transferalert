import { Loader2 } from 'lucide-react';

// Tasarım sisteminin TEK buton kaynağı. Sayfalarda çıplak buton sınıfı yazmak
// yerine bunu kullan — 6 farklı el yazımı varyant (radius/padding sürüklenmesi
// dahil) bu bileşene indirildi.
//
// Erişilebilirlik sözleşmesi:
// - loading: buton devre dışı kalır, aria-busy işaretlenir, metin korunur
//   (genişlik zıplamasın diye spinner metnin YANINA gelir).
// - İkon-tek buton kullanacaksan children yerine aria-label ZORUNLU.
const VARIANTS = {
  primary:   'bg-brand-600 hover:bg-brand-700 text-white',
  secondary: 'bg-white border border-surface-borderstrong text-ink hover:bg-surface-alt',
  // Dolu kırmızı yalnız onay diyaloglarında — sayfa içi tehlikeli eylem soft'tur
  danger:    'bg-bad-50 text-bad-800 hover:bg-bad-50/70 border border-bad-600/20',
  ghost:     'text-ink-soft hover:bg-surface-alt',
};

const SIZES = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  type = 'button',
  className = '',
  children,
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold rounded-control transition-colors',
        'focus:outline-none focus:ring-2 focus:ring-brand-600/30',
        'disabled:opacity-60 disabled:cursor-not-allowed',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        fullWidth ? 'w-full' : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {loading ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : Icon ? <Icon size={16} aria-hidden="true" /> : null}
      {children}
    </button>
  );
}

// İkon-tek eylem butonu (satır içi sil/paylaş/kopyala). aria-label zorunlu —
// ekran okuyucu için tek kimlik o.
export function IconButton({ label, icon: Icon, tone = 'muted', className = '', ...rest }) {
  const tones = {
    muted:  'text-ink-muted hover:text-ink-soft hover:bg-surface-alt',
    danger: 'text-ink-muted hover:text-bad-600 hover:bg-bad-50',
    brand:  'text-ink-muted hover:text-brand-600 hover:bg-brand-50',
  };
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={[
        'p-1.5 rounded-control transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/30',
        tones[tone] || tones.muted,
        className,
      ].join(' ')}
      {...rest}
    >
      <Icon size={16} aria-hidden="true" />
    </button>
  );
}
