// Dispatcher'ın bir transferi kadrolu şoföre atadığı yer.
//
// KAPSAM: hesabı OLAN da OLMAYAN da listelenir. Şoförün kimliği üyelik
// satırıdır, hesap değil — hesap yalnız push bildirimi ve mobil uygulama
// ekleyen bir yükseltmedir. Hesapsız şoför işi kartındaki 'şoför linki' ile
// görür ve durumu oradan ilerletir.
import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { X, UserCheck, AlertCircle, Shield, Headset, Truck } from 'lucide-react';

const ROLE_LABEL = { admin: 'Yönetici', dispatcher: 'Operasyon', driver: 'Sürücü' };
const ROLE_ICON  = { admin: Shield, dispatcher: Headset, driver: Truck };

export default function AssignDriverModal({ reservation, onClose, onAssigned }) {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState('');
  const [error, setError]     = useState('');
  // Firması olmayan (bireysel) kullanıcıda üye listesi 403/404 döner. Bu bir
  // arıza değil, desteklenen bir durum — kırmızı hata yerine ne yapacağını
  // söyleyen bir boş durum gösterilir, yoksa kullanıcı bir şey bozduğunu sanır.
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    api.listOrgMembers()
      // Bekleyen (hesapsız) üyeler de atanabilir — mesele tam olarak bu.
      .then((all) => setMembers((all || []).filter((m) => m.status === 'active' || m.status === 'pending')))
      .catch(() => setNoOrg(true))
      .finally(() => setLoading(false));
  }, []);

  async function assign(memberId) {
    setSaving(memberId || 'clear');
    setError('');
    try {
      await api.updateReservation(reservation.id, { assigned_member_id: memberId });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err.message || 'Atama yapılamadı.');
    } finally {
      setSaving('');
    }
  }

  // Sürücüler üstte: dispatcher'ın aradığı kişi %90 onlardan biri.
  const sorted = [...members].sort((a, b) => (a.role === 'driver' ? -1 : 1) - (b.role === 'driver' ? -1 : 1));
  const current = reservation.assigned_member_id;

  return (
    <div className="fixed inset-0 bg-ink/40 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-card shadow-card w-full max-w-sm max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <div>
            <h2 className="font-semibold text-ink">Şoför Ata</h2>
            <p className="text-xs text-ink-muted mt-0.5">{reservation.flight_number} · {reservation.passenger_name}</p>
          </div>
          <button onClick={onClose} aria-label="Kapat" className="p-1.5 text-ink-muted hover:text-ink rounded-control">
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

          {!loading && !members.length && !error && (
            <div className="text-center py-8 px-4">
              <p className="text-ink-soft font-semibold mb-1">
                {noOrg ? 'Henüz bir firmanız yok' : 'Atanabilecek ekip üyesi yok'}
              </p>
              <p className="text-sm text-ink-muted">
                {noOrg
                  ? 'Kadrolu şoför atamak için önce Firma Yönetimi\'nden firmanızı kurun.'
                  : 'Önce Firma Yönetimi\'nden şoför davet edin.'}
                {' '}Uygulama kurmayacak şoför için karttaki "şoför linki" butonunu kullanabilirsiniz.
              </p>
            </div>
          )}

          {sorted.map((m) => {
            const Icon = ROLE_ICON[m.role] || Truck;
            const isCurrent = current === m.id;
            return (
              <button
                key={m.id}
                onClick={() => assign(m.id)}
                disabled={!!saving}
                className={`w-full flex items-center gap-3 p-3 rounded-control text-left transition-colors disabled:opacity-60 ${
                  isCurrent ? 'bg-brand-50' : 'hover:bg-surface-alt'
                }`}
              >
                <div className="w-9 h-9 rounded-control bg-surface-alt flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-ink-soft" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink truncate">{m.profiles?.full_name || m.invited_name || m.invited_phone || 'İsimsiz üye'}</p>
                  <p className="text-xs text-ink-muted">
                    {ROLE_LABEL[m.role] || m.role}
                    {!m.user_id && <span className="text-warn-800"> · uygulama yok, link gönderin</span>}
                  </p>
                </div>
                {isCurrent && <UserCheck size={16} className="text-brand-600 shrink-0" />}
              </button>
            );
          })}
        </div>

        {current && (
          <div className="px-3 pb-3 pt-2 border-t border-surface-border">
            <button
              onClick={() => assign(null)}
              disabled={!!saving}
              className="w-full py-2.5 rounded-control text-sm font-semibold text-bad-800 bg-bad-50 hover:bg-bad-50/70 transition-colors disabled:opacity-60"
            >
              {saving === 'clear' ? 'Kaldırılıyor...' : 'Atamayı kaldır'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
