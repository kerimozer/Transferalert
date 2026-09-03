import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, MessageSquare, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge, EmptyState, LoadingBlock } from '../components/ui';
import { cardTitle, showFlightLine } from '../lib/transfer';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listNotifications()
      .then(data => setNotifications(data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8"><LoadingBlock /></div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-ink mb-6">Bildirim Geçmişi</h1>

      <Card padding="none" className="overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState icon={Bell} title="Henüz bildirim gönderilmedi"
            description="Uçuş durumu değiştiğinde bildirimler otomatik gönderilir ve burada listelenir." />
        ) : (
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
                    <Badge className="ml-auto" tone={n.status === 'sent' ? 'ok' : 'bad'} icon={n.status === 'sent' ? CheckCircle : XCircle}>
                      {n.status === 'sent' ? 'Gönderildi' : 'Başarısız'}
                    </Badge>
                  </div>

                  <p className="text-sm text-ink-soft mb-1">{n.message}</p>

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
