import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Bell, MessageSquare, MessageCircle, CheckCircle, XCircle } from 'lucide-react';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.listNotifications()
      .then(data => setNotifications(data || []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Bildirim Geçmişi</h1>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {notifications.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={36} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-400">Henüz bildirim gönderilmedi.</p>
            <p className="text-xs text-gray-300 mt-1">Uçuş durumu değiştiğinde SMS otomatik gönderilir.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map(n => (
              <div key={n.id} className="px-5 py-4 flex items-start gap-3">
                {/* İkon */}
                <div className={`mt-0.5 p-1.5 rounded-lg shrink-0 ${
                  n.status === 'sent'
                    ? n.type === 'whatsapp' ? 'bg-green-50 text-green-600' : 'bg-blue-50 text-blue-600'
                    : 'bg-red-50 text-red-500'
                }`}>
                  {n.type === 'whatsapp' ? <MessageCircle size={14} /> : <MessageSquare size={14} />}
                </div>

                {/* İçerik */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="font-medium text-sm text-gray-800">
                      {n.reservations?.flight_number}
                    </span>
                    <span className="text-xs text-gray-400">
                      {n.reservations?.passenger_name}
                    </span>
                    <span className={`ml-auto text-xs font-medium px-1.5 py-0.5 rounded-full flex items-center gap-1 ${
                      n.status === 'sent'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}>
                      {n.status === 'sent'
                        ? <><CheckCircle size={10} /> Gönderildi</>
                        : <><XCircle size={10} /> Başarısız</>}
                    </span>
                  </div>

                  <p className="text-sm text-gray-700 mb-1">{n.message}</p>

                  <p className="text-xs text-gray-400">
                    {n.type === 'whatsapp' ? 'WhatsApp' : 'SMS'} → {n.recipient} &bull;{' '}
                    {new Date(n.created_at).toLocaleString('tr-TR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
