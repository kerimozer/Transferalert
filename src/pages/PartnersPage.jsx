import { useEffect, useState } from 'react';
import { Building2, Copy, Check, Plus, Power, Trash2, ExternalLink } from 'lucide-react';
import { api } from '../lib/api';
import { Button, IconButton, Card, Badge, Field, Input, EmptyState, LoadingBlock, Modal } from '../components/ui';

const PORTAL_BASE = `${window.location.origin}/portal`;

export default function PartnersPage() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showAdd, setShowAdd]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [saving, setSaving]     = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  async function load() {
    try {
      setPartners(await api.listPartners());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const created = await api.createPartner(newName.trim());
      setPartners((p) => [created, ...p]);
      setNewName('');
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(p) {
    try {
      const updated = await api.updatePartner(p.id, { is_active: !p.is_active });
      setPartners((list) => list.map((x) => (x.id === p.id ? { ...x, ...updated } : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm(`"${p.name}" silinsin mi? Gönderdiği talepler kalır, portal linki çalışmaz olur.`)) return;
    try {
      await api.deletePartner(p.id);
      setPartners((list) => list.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function copyLink(p) {
    const url = `${PORTAL_BASE}/${p.token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(p.id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      window.prompt('Linki kopyalayın:', url);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <div className="flex items-start justify-between gap-4 mb-2">
        <div>
          <h1 className="text-xl font-bold text-ink">İş Ortakları</h1>
          <p className="text-sm text-ink-muted mt-1">
            Çalıştığınız otel ve acentalara özel portal linki verin. Uygulama indirmeden
            transfer talebi gönderir, taleplerinin durumunu kendileri takip eder.
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="shrink-0">
          <Plus size={16} /> Yeni Ortak
        </Button>
      </div>

      {error && (
        <div className="mt-4 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <LoadingBlock />
        ) : partners.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Henüz iş ortağı eklemediniz"
            description="Otel veya acenta ekleyin, size özel linkini paylaşın."
            action={<Button onClick={() => setShowAdd(true)}><Plus size={16} /> İlk ortağı ekle</Button>}
          />
        ) : (
          <div className="space-y-3">
            {partners.map((p) => (
              <Card key={p.id} className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-semibold text-ink">{p.name}</h2>
                      {!p.is_active && <Badge tone="neutral">Devre dışı</Badge>}
                      {p.pending > 0 && <Badge tone="warn">{p.pending} onay bekliyor</Badge>}
                    </div>
                    <p className="text-xs text-ink-muted mt-0.5">
                      Toplam {p.total} talep
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button variant="secondary" onClick={() => copyLink(p)}>
                      {copiedId === p.id ? <><Check size={15} /> Kopyalandı</> : <><Copy size={15} /> Linki Kopyala</>}
                    </Button>
                    <IconButton
                      label={p.is_active ? 'Devre dışı bırak' : 'Yeniden etkinleştir'}
                      onClick={() => handleToggle(p)}
                    >
                      <Power size={16} />
                    </IconButton>
                    <IconButton label="Sil" onClick={() => handleDelete(p)}>
                      <Trash2 size={16} />
                    </IconButton>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-surface-border flex items-center justify-between gap-3 flex-wrap">
                  <code className="text-xs text-ink-muted break-all">{PORTAL_BASE}/{p.token}</code>
                  <a href={`/portal/${p.token}`} target="_blank" rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline shrink-0">
                    <ExternalLink size={12} /> Portalı aç
                  </a>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {showAdd && (
      <Modal onClose={() => setShowAdd(false)} title="Yeni iş ortağı">
        <form onSubmit={handleAdd} className="space-y-4">
          <Field label="Otel / Acenta adı" required>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Kaya Palazzo Otel"
              autoFocus
            />
          </Field>
          <p className="text-xs text-ink-muted">
            Eklediğinizde bu ortağa özel bir portal linki oluşur. Linki paylaştığınız kişi
            yalnızca kendi taleplerini görebilir.
          </p>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" onClick={() => setShowAdd(false)}>Vazgeç</Button>
            <Button type="submit" loading={saving}>Ekle ve link oluştur</Button>
          </div>
        </form>
      </Modal>
      )}
    </div>
  );
}
