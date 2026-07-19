import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, MessageSquare, MessageCircle, CheckCircle, XCircle } from 'lucide-react';
import { Card, Badge, EmptyState, LoadingBlock } from '../components/ui';

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
                {/* İkon */}
                <div className={`mt-0.5 p-1.5 rounded-control shrink-0 ${
                  n.status === 'sent'
                    ? n.type === 'whatsapp' ? 'bg-ok-50 text-ok-600' : 'bg-brand-50 text-brand-600'
                    : 'bg-bad-50 text-bad-600'
                }`}>
                  {n.type === 'whatsapp' ? <MessageCircle size={14} /> : <MessageSquare size={14} />}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-semibold text-sm text-ink">
                      {n.reservations?.flight_number}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {n.reservations?.passenger_name}
                    </span>
                    <Badge className="ml-auto" tone={n.status === 'sent' ? 'ok' : 'bad'} icon={n.status === 'sent' ? CheckCircle : XCircle}>
                      {n.status === 'sent' ? 'Gönderildi' : 'Başarısız'}
                    </Badge>
                  </div>

                  <p className="text-sm text-ink-soft mb-1">{n.message}</p>

                  <p className="text-xs text-ink-muted">
                    {n.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} → {n.recipient} &bull;{' '}
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
