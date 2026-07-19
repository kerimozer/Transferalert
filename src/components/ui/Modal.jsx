import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { IconButton } from './Button';

// Erişilebilir modal — bağımlılıksız.
// Sözleşme: role=dialog + aria-modal, başlık aria-labelledby ile bağlı,
// Escape ve zemin tıklaması kapatır, açılışta odak panele taşınır (arka plan
// odağı klavyeden kaybolmasın), kapanışta çağıran taraf odağı yönetir.
export default function Modal({ title, onClose, children, maxWidth = 'max-w-lg' }) {
  const panelRef = useRef(null);

  useEffect(() => {
    panelRef.current?.focus();
    function onKey(e) { if (e.key === 'Escape') onClose?.(); }
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // arka plan kaymasın
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={`bg-white rounded-card shadow-xl w-full ${maxWidth} outline-none max-h-[90vh] overflow-y-auto`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 id="modal-title" className="font-semibold text-ink">{title}</h2>
          <IconButton label="Kapat" icon={X} onClick={onClose} />
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
