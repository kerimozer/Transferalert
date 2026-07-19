import { Loader2 } from 'lucide-react';

// Yükleme göstergeleri. LoadingBlock sayfa/bölüm yüklemesi içindir ve durumu
// ekran okuyucuya role="status" ile bildirir; Spinner satır içi küçük gösterge.
export function Spinner({ size = 16, className = '' }) {
  return <Loader2 size={size} className={`animate-spin ${className}`} aria-hidden="true" />;
}

export default function LoadingBlock({ label = 'Yükleniyor...' }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-ink-muted text-sm">
      <Spinner size={18} />
      {label}
    </div>
  );
}
