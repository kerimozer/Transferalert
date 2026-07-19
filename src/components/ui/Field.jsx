import { useId } from 'react';

// Form alanı — etiket/girdi/hata/ipucu kablolaması TEK yerde.
// Erişilebilirlik sözleşmesi: label htmlFor ile girdiye bağlanır (useId),
// hata varsa aria-invalid + aria-describedby otomatik kurulur; hata metni
// aria-live ile ekran okuyucuya anons edilir.
//
//   <Field label="Uçuş No" required error={err} hint="Örn: TK123">
//     {(props) => <Input {...props} value={v} onChange={...} />}
//   </Field>
// veya kısa yol: <Field label="..." input={{ value, onChange, placeholder }} />

export const inputCls =
  'w-full rounded-control border border-surface-borderstrong bg-white px-4 py-2.5 text-sm text-ink ' +
  'placeholder:text-ink-muted focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none ' +
  'disabled:bg-surface-alt disabled:text-ink-muted';

export function Input({ className = '', ...rest }) {
  return <input className={[inputCls, className].join(' ')} {...rest} />;
}

export default function Field({ label, required = false, error, hint, input, children }) {
  const id = useId();
  const descId = `${id}-desc`;
  const a11y = {
    id,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error || hint ? descId : undefined,
  };

  return (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-ink-soft mb-1.5">
        {label} {required && <span className="text-bad-600" aria-hidden="true">*</span>}
      </label>
      {typeof children === 'function' ? children(a11y) : <Input {...a11y} {...input} />}
      {(error || hint) && (
        <p id={descId} aria-live={error ? 'polite' : undefined}
           className={`mt-1 text-xs ${error ? 'text-bad-600' : 'text-ink-muted'}`}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
