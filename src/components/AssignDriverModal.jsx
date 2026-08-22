// Dispatcher'ın bir transferi şoföre atadığı yer.
//
// KAPSAM: hesabı OLAN da OLMAYAN da listelenir. Şoförün kimliği üyelik
// satırıdır, hesap değil — hesap yalnız push bildirimi ve mobil uygulama
// ekleyen bir yükseltmedir. Hesapsız şoför işini kalıcı pano linkinden
// (/sofor/:token) görür ve durumu oradan ilerletir.
//
// NEDEN SADECE İSİM LİSTESİ DEĞİL: dispatcher seçim yaparken iki şeyi bilmeden
// karar veremez — o şoförün BUGÜNKÜ yükü ve BU SAATTE başka bir işte olup
// olmadığı. İkisi de /driver-options ucundan gelir. Çakışmayı göstermemek,
// aynı şoförü iki transfere yazmayı sessizce mümkün kılıyordu; bedeli
// havalimanında bekleyen yolcudur.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { X, UserCheck, AlertCircle, AlertTriangle, Shield, Headset, Truck, Send } from 'lucide-react';

const ROLE_LABEL = { admin: 'Yönetici', dispatcher: 'Operasyon', driver: 'Sürücü' };
const ROLE_ICON  = { admin: Shield, dispatcher: Headset, driver: Truck };

function saat(iso) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

// Şoföre linki göndermenin en kısa yolu. wa.me ülke kodlu numara ister;
// yabancı numaraya körü körüne 90 eklemek ölü link üretir.
function waLink(phone, text) {
  const raw = String(phone || '').trim();
  const digits = raw.replace(/\D/g, '');
  if (!digits) return null;
  let intl;
  if (raw.startsWith('+')) intl = digits;
  else if (digits.startsWith('00')) intl = digits.slice(2);
  else if (digits.startsWith('0')) intl = `90${digits.slice(1)}`;
  else if (digits.length <= 10) intl = `90${digits}`;
  else intl = digits;
  return `https://wa.me/${intl}?text=${encodeURIComponent(text)}`;
}

export default function AssignDriverModal({ reservation, onClose, onAssigned }) {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState('');
  const [error, setError]     = useState('');
  const [picked, setPicked]   = useState(null);
  // Firması olmayan (bireysel) kullanıcıda atama anlamsızdır. Bu bir arıza
  // değil, desteklenen bir durum — kırmızı hata yerine ne yapacağını söyleyen
  // bir boş durum gösterilir, yoksa kullanıcı bir şey bozduğunu sanır.
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    api.driverOptions(reservation.id)
      .then((res) => {
        setDrivers(res?.drivers || []);
        setNoOrg(res?.org === false);
        setPicked((res?.drivers || []).find((d) => d.current)?.member_id || null);
      })
      .catch((e) => setError(e.message || 'Şoför listesi alınamadı.'))
      .finally(() => setLoading(false));
  }, [reservation.id]);

  // Atama bitti, sıra linki göndermede. AYRI BİR ADIM olması şart:
  // `window.open`'ı `await`ten sonra çağırmak iOS/Safari'de HER ZAMAN,
  // Chrome'da da yavaş ağda engellenir. Engellendiğinde modal kapanıyor ve
  // geriye hiçbir iz kalmıyordu — dispatcher linki gönderdiğini sanıyor,
  // şoförün eline hiçbir şey geçmiyordu. Butona kullanıcı basınca (gerçek
  // etkileşim) tarayıcı asla engellemez.
  const [sendStep, setSendStep] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  async function assign(memberId, alsoSend) {
    setSaving(memberId || 'clear');
    setError('');
    try {
      await api.updateReservation(reservation.id, { assigned_member_id: memberId });
      onAssigned();
      if (alsoSend) {
        const d = drivers.find((x) => x.member_id === memberId);
        if (d?.driver_link) { setSendStep(d); return; }
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Atama yapılamadı.');
    } finally {
      setSaving('');
    }
  }

  const current = drivers.find((d) => d.current)?.member_id || null;
  const pickedDriver = drivers.find((d) => d.member_id === picked) || null;

  if (sendStep) {
    const msg = `Merhaba${sendStep.name ? ' ' + sendStep.name : ''}, size bir transfer atandı. İşleriniz bu linkte: ${sendStep.driver_link}`;
    const wa = waLink(sendStep.phone, msg);
    return (
      <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-card shadow-card w-full max-w-md p-6">
          <div className="flex items-center gap-2 text-ok-800 font-semibold mb-1">
            <UserCheck size={18} /> {sendStep.name || 'Şoför'} atandı
          </div>
          <p className="text-sm text-ink-soft mb-4">
            Şimdi çalışma linkini gönderin — şoför bu linke dokunduğunda işini görür, hesap açması gerekmez.
          </p>
          <div className="flex items-center gap-2 mb-3">
            <input readOnly value={sendStep.driver_link} className="flex-1 min-w-0 border border-surface-borderstrong rounded-card px-3 py-2.5 text-xs text-ink-muted bg-surface-bg" />
            <button
              onClick={() => { navigator.clipboard.writeText(sendStep.driver_link); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
              className="shrink-0 text-xs font-semibold px-3 py-2.5 bg-surface-alt text-ink-soft rounded-control"
            >
              {linkCopied ? 'Kopyalandı' : 'Kopyala'}
            </button>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noreferrer"
               className="w-full flex items-center justify-center gap-2 py-3 rounded-control font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors mb-2">
              <Send size={16} /> WhatsApp ile gönder
            </a>
          )}
          <button onClick={onClose} className="w-full py-2.5 rounded-control text-sm font-semibold text-ink-soft border border-surface-borderstrong hover:bg-surface-alt transition-colors">
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-card w-full max-w-md max-h-[85vh] flex flex-col">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-surface-border">
          <div className="min-w-0">
            <h2 className="font-semibold text-ink">Şoför ata</h2>
            <p className="text-xs text-ink-muted mt-0.5 truncate">
              {reservation.passenger_name} · {reservation.flight_number} · {saat(reservation.scheduled_pickup)}
            </p>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="p-1.5 text-ink-muted hover:text-ink rounded-control shrink-0">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto p-3 flex-1">
          {loading && <p className="text-sm text-ink-muted p-3">Yükleniyor...</p>}

          {error && (
            <div className="mb-3 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}

          {!loading && !drivers.length && (
            <div className="text-center py-8 px-4">
              <p className="text-ink-soft font-semibold mb-1">
                {noOrg ? 'Bu transfer bir firmaya bağlı değil' : 'Atanabilecek ekip üyesi yok'}
              </p>
              <p className="text-sm text-ink-muted">
                {noOrg
                  ? 'Şoför ataması için önce Firma Yönetimi\'nden firmanızı kurun.'
                  : 'Firma Yönetimi\'nden şoför ekleyin — ad ve telefon yeter, çalışma linki anında çıkar.'}
              </p>
            </div>
          )}

          <div className="flex flex-col gap-2">
            {drivers.map((d) => {
              const Icon = ROLE_ICON[d.role] || Truck;
              const isPicked = picked === d.member_id;
              return (
                <button
                  key={d.member_id}
                  onClick={() => setPicked(d.member_id)}
                  disabled={!!saving}
                  className={`w-full flex items-center gap-3 p-3 rounded-control text-left transition-colors disabled:opacity-60 border-2 ${
                    isPicked ? 'border-brand-600 bg-white' : 'border-transparent hover:bg-surface-alt'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${isPicked ? 'bg-brand-50' : 'bg-surface-alt'}`}>
                    <Icon size={16} className={isPicked ? 'text-brand-600' : 'text-ink-soft'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-ink truncate">{d.name || d.phone || 'İsimsiz üye'}</p>
                      <span className={`shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${d.has_account ? 'bg-brand-50 text-brand-700' : 'bg-surface-alt text-ink-soft'}`}>
                        {d.has_account ? 'Uygulamada' : 'Linkle çalışıyor'}
                      </span>
                    </div>
                    {/* Çakışma varsa yükü DEĞİL onu göster: ikisi birden
                        gösterilirse asıl uyarı satırlar arasında kaybolur. */}
                    {d.conflict ? (
                      <p className="flex items-center gap-1.5 text-xs font-semibold text-warn-800 mt-1">
                        <AlertTriangle size={12} className="shrink-0" />
                        Saat çakışıyor — {saat(d.conflict.scheduled_pickup)} {d.conflict.flight_number} transferi
                      </p>
                    ) : (
                      <p className="text-xs text-ink-muted mt-0.5">
                        {d.phone ? `${d.phone} · ` : ''}
                        {d.today_count > 0 ? `o gün ${d.today_count} transfer` : 'o gün boş'}
                      </p>
                    )}
                  </div>
                  {d.current && <UserCheck size={16} className="text-brand-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {drivers.length > 0 && (
          <div className="px-3 pb-3 pt-3 border-t border-surface-border flex flex-col gap-2">
            {pickedDriver?.conflict && (
              <p className="flex items-start gap-2 px-3 py-2.5 bg-warn-50 rounded-control text-xs text-warn-800 font-semibold">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                {pickedDriver.name || 'Bu şoför'} o saatte başka bir transferde. Yine de atayabilirsiniz.
              </p>
            )}
            <button
              onClick={() => assign(picked, false)}
              disabled={!!saving || !picked || picked === current}
              className="w-full py-3 rounded-control font-semibold text-white bg-brand-600 hover:bg-brand-700 transition-colors disabled:opacity-50"
            >
              {saving === picked ? 'Atanıyor...' : picked === current ? 'Zaten atanmış' : `${pickedDriver?.name || 'Şoföre'} ata`}
            </button>
            {/* Hesapsız şoför için ASIL akış: ata ve çalışma linkini gönder.
                Linki olmayan üyede gizlenir — çalışmayan bir buton göstermek,
                dispatcher'ın gönderdiğini sanmasına yol açar. */}
            {pickedDriver?.driver_link && pickedDriver?.phone && (
              <button
                onClick={() => assign(picked, true)}
                disabled={!!saving || !picked}
                className="w-full py-2.5 rounded-control font-semibold text-ink border border-surface-borderstrong hover:bg-surface-alt transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send size={15} /> Ata ve linki gönder
              </button>
            )}
            {current && (
              <button
                onClick={() => assign(null, false)}
                disabled={!!saving}
                className="w-full py-2.5 rounded-control text-sm font-semibold text-bad-800 bg-bad-50 hover:bg-bad-50/70 transition-colors disabled:opacity-60"
              >
                {saving === 'clear' ? 'Kaldırılıyor...' : 'Atamayı kaldır'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
