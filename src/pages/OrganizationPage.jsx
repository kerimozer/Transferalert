import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Building2, UserPlus, Trash2, Phone, Mail, Copy, CheckCircle, X, AlertCircle, Clock, Shield, Truck, Headset, ArrowUpCircle, Moon, Pencil } from 'lucide-react';

// PostgREST `time` kolonunu "22:00:00" olarak döndürür; <input type="time"> "22:00" ister.
const hhmm = (v) => (typeof v === 'string' ? v.slice(0, 5) : '');

const ROLE_LABELS = { admin: 'Admin', dispatcher: 'Operasyon', driver: 'Sürücü' };
const ROLE_ICONS  = { admin: Shield, dispatcher: Headset, driver: Truck };

export default function OrganizationPage() {
  const [org,      setOrg]      = useState(null);
  const [role,     setRole]     = useState(null);
  const [members,  setMembers]  = useState([]);
  const [plans,    setPlans]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [notFound, setNotFound] = useState(false);

  const plansByKey = Object.fromEntries(plans.map(p => [p.key, p]));

  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', plan: 'starter' });

  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState({ name: '', phone: '', email: '', role: 'driver' });
  const [inviteLink, setInviteLink] = useState('');
  const [copied,     setCopied]     = useState(false);

  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [upgrading, setUpgrading] = useState(null);

  const [editingName, setEditingName] = useState(false);
  const [nameDraft,   setNameDraft]   = useState('');
  const [nameSaving,  setNameSaving]  = useState(false);
  // AYRI hata state'i: ortak `error` yalnız "Plan Yükseltme" bloğunda render
  // ediliyor ve o blok yükseltilecek plan yoksa (enterprise admin, ya da
  // plans listesi çekilemediyse) HİÇ çizilmiyor — yeniden adlandırma hatası
  // ekranda görünmeden kaybolurdu.
  const [nameError,   setNameError]   = useState('');

  const [nw,       setNw]       = useState({ enabled: false, user_id: '', start: '22:00', end: '08:00' });
  const [nwSaving, setNwSaving] = useState(false);
  const [nwMsg,    setNwMsg]    = useState('');
  const [nwError,  setNwError]  = useState('');

  async function load() {
    setLoading(true);
    try {
      const res = await api.getMyOrg();
      setOrg(res.org);
      setRole(res.role);
      setNw({
        enabled: !!res.org?.night_watch_enabled,
        user_id: res.org?.night_watch_user_id || '',
        start:   hhmm(res.org?.night_watch_start) || '22:00',
        end:     hhmm(res.org?.night_watch_end)   || '08:00',
      });
      setNotFound(false);
      const m = await api.listOrgMembers();
      setMembers(m || []);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    api.listPlans().then(setPlans).catch(() => setPlans([]));
  }, []);

  async function handleNightWatch(e) {
    e.preventDefault();
    setNwError(''); setNwMsg('');
    setNwSaving(true);
    try {
      const saved = await api.setNightWatch({
        enabled: nw.enabled,
        user_id: nw.user_id || null,
        start:   nw.start || null,
        end:     nw.end || null,
      });
      setOrg(o => ({ ...o, ...saved }));
      setNwMsg('Gece nöbeti ayarı kaydedildi.');
    } catch (err) {
      setNwError(err.message || 'Kaydedilemedi.');
    } finally {
      setNwSaving(false);
    }
  }

  async function handleRename(e) {
    e.preventDefault();
    setNameError('');
    setNameSaving(true);
    try {
      const saved = await api.renameOrg(nameDraft.trim());
      setOrg((o) => ({ ...o, name: saved.name }));
      setEditingName(false);
    } catch (err) {
      setNameError(err.message || 'Firma adı değiştirilemedi.');
    } finally {
      setNameSaving(false);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createOrg(createForm);
      setShowCreate(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleInvite(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const res = await api.inviteMember(inviteForm);
      setInviteLink(res.invite_link || '');
      setInviteForm({ name: '', phone: '', email: '', role: 'driver' });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id) {
    if (!confirm('Bu üyeyi firmadan çıkarmak istiyor musunuz?')) return;
    await api.removeMember(id);
    load();
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function closeInviteModal() {
    setShowInvite(false);
    setInviteLink('');
    setError('');
  }

  async function handleUpgrade(plan) {
    setUpgrading(plan);
    setError('');
    try {
      const res = await api.createCheckout(plan);
      window.location.href = res.paymentPageUrl;
    } catch (err) {
      setError(err.message);
      setUpgrading(null);
    }
  }

  if (loading) return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;

  if (notFound) {
    return (
      <div className="p-8 max-w-3xl">
        <h1 className="text-2xl font-bold text-ink mb-1">Firma Yönetimi</h1>
        <p className="text-sm text-ink-muted mb-8">Ekip üyelerinizi ve rollerini yönetmek için önce bir firma oluşturun.</p>

        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-surface-border rounded-card">
          <div className="w-16 h-16 bg-brand-50 rounded-card flex items-center justify-center mb-4">
            <Building2 size={28} className="text-brand-600" />
          </div>
          <p className="text-ink-soft font-semibold mb-1">Henüz firmanız yok</p>
          <p className="text-sm text-ink-muted mb-5">Firma oluşturup ekip üyelerinizi davet edin.</p>
          <button onClick={() => { setShowCreate(true); setError(''); }} className="bg-brand-600 text-white rounded-card px-5 py-2.5 text-sm font-semibold hover:bg-brand-700">
            Firma Oluştur
          </button>
        </div>

        {showCreate && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-card shadow-xl w-full max-w-sm">
              <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
                <h2 className="font-semibold text-ink">Firma Oluştur</h2>
                <button onClick={() => setShowCreate(false)} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
              </div>
              {error && (
                <div className="mx-6 mt-4 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
                </div>
              )}
              <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Firma Adı <span className="text-bad-600">*</span></label>
                  <input
                    value={createForm.name}
                    onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Örnek Transfer Ltd."
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    required autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Plan</label>
                  <select
                    value={createForm.plan}
                    onChange={e => setCreateForm(f => ({ ...f, plan: e.target.value }))}
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  >
                    {plans.map(p => (
                      <option key={p.key} value={p.key}>{p.label} ({p.driver_limit} kişi)</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowCreate(false)} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
                    {saving ? 'Oluşturuluyor...' : 'Oluştur'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  const limit = org.driver_limit ?? plansByKey[org.plan]?.driver_limit ?? 3;
  const activeCount = members.filter(m => m.status === 'active').length;
  const canManage = role === 'admin' || role === 'dispatcher';

  return (
    <div className="p-8 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-ink">Firma Yönetimi</h1>
          <p className="text-sm text-ink-muted mt-0.5">Ekip üyelerinizi ve rollerini yönetin.</p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowInvite(true); setError(''); }}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-card px-4 py-2.5 text-sm font-semibold transition-colors"
          >
            <UserPlus size={16} /> Üye Davet Et
          </button>
        )}
      </div>

      {/* Firma Bilgi Kartı */}
      <div className="bg-white border border-surface-border rounded-card p-5 mb-6 flex items-center gap-4">
        <div className="w-12 h-12 bg-brand-50 rounded-card flex items-center justify-center shrink-0">
          <Building2 size={22} className="text-brand-600" />
        </div>
        <div className="flex-1 min-w-0">
          {/* Yeniden adlandırma: bir kullanıcı tek firmaya bağlı olduğu için
              (uniq_organizations_owner) yanlış isimle kuran biri onu başka
              türlü düzeltemez — silip yeniden kuramaz. */}
          {editingName ? (
            <form onSubmit={handleRename} className="flex items-center gap-2">
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                className="flex-1 min-w-0 border border-surface-borderstrong rounded-control px-3 py-1.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                maxLength={100}
                required autoFocus
              />
              <button type="submit" disabled={nameSaving}
                className="shrink-0 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-control px-3 py-1.5 text-xs font-semibold">
                {nameSaving ? '...' : 'Kaydet'}
              </button>
              <button type="button" onClick={() => { setEditingName(false); setNameError(''); }}
                className="shrink-0 text-ink-muted hover:text-ink px-1.5" aria-label="Vazgeç">
                <X size={16} />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-2 min-w-0">
              <p className="font-semibold text-ink truncate">{org.name}</p>
              {role === 'admin' && (
                <button
                  onClick={() => { setNameDraft(org.name); setEditingName(true); setNameError(''); }}
                  title="Firma adını düzenle" aria-label="Firma adını düzenle"
                  className="shrink-0 p-1 text-ink-muted hover:text-brand-600 hover:bg-brand-50 rounded-control transition-colors">
                  <Pencil size={13} />
                </button>
              )}
            </div>
          )}
          {nameError ? (
            <p className="flex items-center gap-1.5 text-sm text-bad-800 mt-1">
              <AlertCircle size={13} className="shrink-0" />{nameError}
            </p>
          ) : (
            <p className="text-sm text-ink-muted">{plansByKey[org.plan]?.label || org.plan} plan · {activeCount}/{limit} kişi</p>
          )}
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-brand-50 text-brand-700 rounded-full shrink-0">
          {ROLE_LABELS[role] || role}
        </span>
      </div>

      {/* Plan Yükseltme */}
      {role === 'admin' && plans.some(p => p.is_purchasable && p.sort_order > (plansByKey[org.plan]?.sort_order ?? -1)) && (
        <div className="mb-6">
          {error && (
            <div className="mb-3 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plans
              .filter(p => p.is_purchasable && p.sort_order > (plansByKey[org.plan]?.sort_order ?? -1))
              .map(p => (
                <div key={p.key} className="bg-white border border-surface-border rounded-card p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-ink">{p.label}</p>
                    <p className="text-sm text-ink-muted">{p.driver_limit} kişi · {p.price}₺/ay</p>
                  </div>
                  <button
                    onClick={() => handleUpgrade(p.key)}
                    disabled={upgrading === p.key}
                    className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-3.5 py-2 text-sm font-semibold transition-colors shrink-0"
                  >
                    <ArrowUpCircle size={15} /> {upgrading === p.key ? 'Yönlendiriliyor...' : 'Yükselt'}
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Gece Nöbeti */}
      {role === 'admin' && (
        <form onSubmit={handleNightWatch} className="bg-white border border-surface-border rounded-card shadow-card p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-brand-50 rounded-card flex items-center justify-center shrink-0">
              <Moon size={22} className="text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-ink">Gece Nöbeti</p>
              <p className="text-sm text-ink-muted mt-0.5">
                Bu saatler arasında uçuş ve yolcu uyarıları operasyon sorumlusu yerine nöbetçiye gider.
                Saatler Türkiye saatiyle girilir.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 shrink-0 cursor-pointer">
              <input
                type="checkbox"
                checked={nw.enabled}
                onChange={(e) => setNw({ ...nw, enabled: e.target.checked })}
                className="w-4 h-4 rounded border-surface-borderstrong text-brand-600 focus:ring-2 focus:ring-brand-600/30"
              />
              <span className="text-sm font-semibold text-ink-soft">{nw.enabled ? 'Açık' : 'Kapalı'}</span>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
            <div>
              <label htmlFor="nw-user" className="block text-sm font-semibold text-ink-soft mb-1.5">Nöbetçi</label>
              <select
                id="nw-user"
                value={nw.user_id}
                onChange={(e) => setNw({ ...nw, user_id: e.target.value })}
                className="w-full rounded-control border border-surface-borderstrong bg-surface px-4 py-2.5 text-ink focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
              >
                <option value="">Seçiniz</option>
                {members.filter(m => m.status === 'active' && m.user_id).map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.profiles?.full_name || m.invited_name || m.profiles?.phone || ROLE_LABELS[m.role] || 'Üye'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nw-start" className="block text-sm font-semibold text-ink-soft mb-1.5">Başlangıç</label>
              <input
                id="nw-start" type="time" value={nw.start}
                onChange={(e) => setNw({ ...nw, start: e.target.value })}
                className="w-full rounded-control border border-surface-borderstrong bg-surface px-4 py-2.5 text-ink focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="nw-end" className="block text-sm font-semibold text-ink-soft mb-1.5">Bitiş</label>
              <input
                id="nw-end" type="time" value={nw.end}
                onChange={(e) => setNw({ ...nw, end: e.target.value })}
                className="w-full rounded-control border border-surface-borderstrong bg-surface px-4 py-2.5 text-ink focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20 focus:outline-none"
              />
            </div>
          </div>

          {nwError && (
            <div className="mt-3 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />{nwError}
            </div>
          )}
          {nwMsg && (
            <div className="mt-3 flex gap-2 px-3 py-2.5 bg-ok-50 border border-ok-600/20 rounded-control text-sm text-ok-800">
              <CheckCircle size={15} className="mt-0.5 shrink-0" />{nwMsg}
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button
              type="submit"
              disabled={nwSaving}
              className="bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold rounded-control px-5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-brand-600/30"
            >
              {nwSaving ? 'Kaydediliyor...' : 'Kaydet'}
            </button>
          </div>
        </form>
      )}

      {/* Üye Listesi */}
      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-surface-border rounded-card">
          <p className="text-ink-soft font-semibold mb-1">Henüz ekip üyesi yok</p>
          <p className="text-sm text-ink-muted">Ekip üyelerinizi davet edin.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {members.map(m => {
            const RoleIcon = ROLE_ICONS[m.role] || Truck;
            const displayName = m.profiles?.full_name || m.invited_name || m.invited_phone || m.invited_email || 'Davet bekleniyor';
            const displayPhone = m.profiles?.phone || m.invited_phone;
            return (
              <div key={m.id} className="bg-white border border-surface-border rounded-card p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-50 rounded-card flex items-center justify-center shrink-0">
                  <RoleIcon size={18} className="text-brand-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-ink">{displayName}</p>
                  <div className="flex items-center gap-3 text-sm text-ink-muted">
                    {displayPhone && <span className="flex items-center gap-1"><Phone size={11} /> {displayPhone}</span>}
                    {m.status === 'pending' && <span className="flex items-center gap-1 text-warn-600"><Clock size={11} /> Beklemede</span>}
                  </div>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 bg-surface-alt text-ink-soft rounded-full shrink-0">
                  {ROLE_LABELS[m.role] || m.role}
                </span>
                {role === 'admin' && (
                  <button onClick={() => handleRemove(m.id)} className="p-1.5 text-ink-muted hover:text-bad-600 hover:bg-bad-50 rounded-control transition-colors shrink-0">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Davet Modalı */}
      {showInvite && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-card shadow-xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
              <h2 className="font-semibold text-ink">Üye Davet Et</h2>
              <button onClick={closeInviteModal} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
            </div>

            {error && (
              <div className="mx-6 mt-4 flex gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
                <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
              </div>
            )}

            {inviteLink ? (
              <div className="px-6 py-5 space-y-4">
                <div className="flex gap-2 px-3 py-2.5 bg-ok-50 border border-ok-600/20 rounded-control text-sm text-ok-800">
                  <CheckCircle size={15} className="mt-0.5 shrink-0" /> Davet oluşturuldu. Linki paylaşın:
                </div>
                <div className="flex items-center gap-2">
                  <input readOnly value={inviteLink} className="flex-1 border border-surface-borderstrong rounded-card px-3 py-2.5 text-xs text-ink-muted bg-surface-bg" />
                  <button onClick={copyLink} className="shrink-0 flex items-center gap-1.5 text-xs px-3 py-2.5 bg-surface-alt hover:bg-surface-alt text-ink-soft rounded-control transition-colors">
                    {copied ? <><CheckCircle size={12} className="text-ok-600" /> Kopyalandı</> : <><Copy size={12} /> Kopyala</>}
                  </button>
                </div>
                <button onClick={closeInviteModal} className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
                  Tamam
                </button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="px-6 py-5 space-y-4">
                {/* Ad, hesabı OLMAYAN şoförün tek kimlik kaynağı: panoda ve
                    yolcuya giden bilgide bu görünür. Hesap açarsa profildeki
                    ad devralır. */}
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Ad Soyad <span className="text-bad-600">*</span></label>
                  <input
                    value={inviteForm.name}
                    onChange={e => setInviteForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ali Kaya"
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    required autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Telefon <span className="text-bad-600">*</span></label>
                  <input
                    value={inviteForm.phone}
                    onChange={e => setInviteForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="0532 000 00 00"
                    type="tel"
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">E-posta <span className="text-ink-muted font-normal">(opsiyonel)</span></label>
                  <input
                    value={inviteForm.email}
                    onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="ornek@sirket.com"
                    type="email"
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-ink-soft mb-1">Rol</label>
                  <select
                    value={inviteForm.role}
                    onChange={e => setInviteForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-surface-borderstrong rounded-card px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                  >
                    <option value="driver">Sürücü</option>
                    <option value="dispatcher">Operasyon</option>
                  </select>
                </div>
                <p className="text-xs text-ink-muted">Davet linki oluşturulacak, WhatsApp ile gönderebilirsiniz. Üye mobil uygulamadan katılır.</p>
                <div className="flex gap-3">
                  <button type="button" onClick={closeInviteModal} className="flex-1 px-4 py-2.5 text-sm text-ink-soft hover:bg-surface-alt rounded-card transition-colors">İptal</button>
                  <button type="submit" disabled={saving} className="flex-1 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white rounded-card px-4 py-2.5 text-sm font-semibold">
                    {saving ? 'Gönderiliyor...' : 'Davet Gönder'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
