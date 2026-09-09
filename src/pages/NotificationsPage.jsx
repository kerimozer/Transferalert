import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, MessageSquare, MessageCircle, CheckCircle, XCircle, MinusCircle, AlertTriangle } from 'lucide-react';
import { Card, Badge, EmptyState, LoadingBlock } from '../components/ui';
import { cardTitle, showFlightLine } from '../lib/transfer';
import { notifyKey, notifyTone, notifyReason } from '../lib/notify';

// Hâl → ikon/etiket. Anlam yalnız RENKLE verilmez (erişilebilirlik): üç hâlin
// üçünün de kendi ikonu ve kendi kelimesi var. `skipped` için çarpı DEĞİL eksi
// ikonu — çarpı "denendi ve olmadı" der, oysa hiç denenmedi.
const NOTIFY_ICON  = { sent: CheckCircle, failed: XCircle, skipped: MinusCircle };
const NOTIFY_LABEL = { sent: 'Gönderildi', failed: 'Başarısız', skipped: 'Denenmedi' };

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // HATA YUTULMAZ. Burada `.catch` YOKTU — jetonu düşmüş / RLS reddetmiş /
  // 429 yemiş kullanıcı "Henüz bildirim gönderilmedi" görüyordu. Yani bir ağ
  // hatası "her şey yolunda, hiç bildirim yok" diye raporlanıyordu: ekrana yeni
  // taşıdığımız üç hâl ayrımının görünmez DÖRDÜNCÜ hâli, "okuyamadım".
  useEffect(() => {
    api.listNotifications()
      .then(data => { setNotifications(data || []); setLoadError(null); })
      .catch(e => setLoadError(e?.message || String(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Bildirim Geçmişi</h1>

      {/* HATA ŞERİDİ boş durumun YERİNE değil, ÜSTÜNDE durur ve sunucunun
          kendi cümlesini taşır: "Bir hata oluştu" 401'i, 429'u ve 500'ü aynı
          torbaya atar ve hangi kapının kapandığını söylemez. */}
      {loadError && (
        <div className="mb-4 flex items-start gap-2 rounded-card bg-bad-50 px-4 py-3">
          <AlertTriangle size={16} className="text-bad-800 shrink-0 mt-0.5" aria-hidden="true" />
          <p className="text-sm text-bad-800">
            <span className="font-semibold">Bildirimler yüklenemedi.</span>{' '}
            <span className="break-words">{loadError}</span>
          </p>
        </div>
      )}

      <Card padding="none" className="overflow-hidden">
        {/* Hata varken BOŞ DURUM BASILMAZ: "hiç bildirim yok" ile "okuyamadım"
            ekranda birebir aynı görünüyordu ve teşhisi tahmine çeviriyordu. */}
        {notifications.length === 0 ? (loadError ? null : (
          <EmptyState icon={Bell} title="Henüz bildirim gönderilmedi"
            description="Uçuş durumu değiştiğinde bildirimler otomatik gönderilir ve burada listelenir." />
        )) : (
          <div className="divide-y divide-surface-border">
            {notifications.map(n => (
              <div key={n.id} className="px-5 py-4 flex items-start gap-3">
                {/* İKON HER ZAMAN KANALIN MARKASINI TAŞIR — durumdan bağımsız.
                    Eskiden durum da buradaydı: başarısızsa ikon kırmızıya
                    düşüyor ve kanal rengi kayboluyordu. Canlıda bildirimlerin
                    TAMAMI başarısız olduğu için ekran tek renk bir duvara
                    dönüşmüştü. Kural: BİR ELEMAN, BİR ANLAM — kanal ikonda,
                    durum rozette. Mobille (NotificationsScreen) aynı karar. */}
                <div className={`mt-0.5 p-1.5 rounded-control shrink-0 ${
                  n.type === 'whatsapp' ? 'bg-wa-50 text-wa-700' : 'bg-sms-50 text-sms-700'
                }`}>
                  {n.type === 'whatsapp' ? <MessageCircle size={14} /> : <MessageSquare size={14} />}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    {/* Uçuşsuz transferde flight_number NULL — başlık boş
                        kalıp bildirim kime aitmiş belli olmuyordu. */}
                    <span className="font-semibold text-sm text-ink">
                      {n.reservations ? cardTitle(n.reservations) : ''}
                    </span>
                    {showFlightLine(n.reservations) && (
                      <span className="text-xs text-ink-muted font-mono">
                        {n.reservations.flight_number}
                      </span>
                    )}
                    {/* ÜÇ HÂL (migration 031). `skipped` NÖTR ton alır: kimse
                        başarısız olmadı, kanal hiç kurulmadı. Kırmızıya
                        boyamak dispatcher'ı olmayan bir arızayı kovalamaya
                        yollar. Ölçüt lib/notify.js'te, iki platformda ortak. */}
                    <Badge
                      className="ml-auto"
                      tone={notifyTone(n.status)}
                      icon={NOTIFY_ICON[notifyKey(n.status)]}
                    >
                      {NOTIFY_LABEL[notifyKey(n.status)]}
                    </Badge>
                  </div>

                  <p className="text-sm text-ink-soft mb-1">{n.message}</p>

                  {/* GEREKÇE (migration 031). Gerekçesiz bir "Başarısız"
                      rozeti X1'i başlatan şikâyetin ta kendisidir: "gitmiyor
                      ama neden bilmiyorum". Sağlayıcının cümlesi artık
                      veritabanında; basılmazsa kimse göremez. */}
                  {notifyReason(n) && (
                    <p className="text-xs text-ink-muted mb-1 break-words">{notifyReason(n)}</p>
                  )}

                  <p className="text-xs text-ink-muted">
                    {/* Kanal adı da ikonla AYNI rengi taşır — 14px'lik bir ikon
                        tek başına hangi kanal olduğunu ancak yakından söylüyor. */}
                    <span className={`font-bold ${n.type === 'whatsapp' ? 'text-wa-700' : 'text-sms-700'}`}>
                      {n.type === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                    </span>
                    {' → '}{n.recipient} &bull;{' '}
                    {new Date(n.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
