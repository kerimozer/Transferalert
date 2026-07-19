// Yüzey kartı — beyaz zemin + soluk kenarlık + yumuşak gölge (tasarım token'ları).
// padding="none" liste kartları için (satırlar kendi padding'ini yönetir).
const PADDINGS = { none: '', sm: 'p-4', md: 'p-6' };

export default function Card({ padding = 'md', className = '', children, ...rest }) {
  return (
    <div
      className={[
        'bg-white border border-surface-border rounded-card shadow-card',
        PADDINGS[padding] ?? PADDINGS.md,
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
}
