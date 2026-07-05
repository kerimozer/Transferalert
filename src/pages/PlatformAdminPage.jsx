import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Building2, Users, Layers } from 'lucide-react';

const PLAN_LABELS = { individual: 'Bireysel', starter: 'Starter', professional: 'Professional', enterprise: 'Enterprise' };

export default function PlatformAdminPage() {
  const [orgs, setOrgs]       = useState([]);
  const [stats, setStats]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [orgList, s] = await Promise.all([api.listAdminOrgs(), api.getAdminStats()]);
      setOrgs(orgList || []);
      setStats(s);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="p-8 text-sm text-gray-400">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Platform Yönetimi</h1>
      <p className="text-sm text-gray-400 mb-6">Tüm kayıtlı firmaların özeti (salt-okunur).</p>

      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Building2 size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.organization_count}</p>
              <p className="text-xs text-gray-400">Firma</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Users size={18} className="text-blue-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stats.active_member_count}</p>
              <p className="text-xs text-gray-400">Aktif Üye</p>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
              <Layers size={18} className="text-blue-600" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-900 font-medium truncate">
                {Object.entries(stats.plan_breakdown).map(([p, c]) => `${PLAN_LABELS[p] || p}: ${c}`).join(' · ') || '-'}
              </p>
              <p className="text-xs text-gray-400">Plan Dağılımı</p>
            </div>
          </div>
        </div>
      )}

      {orgs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-gray-200 rounded-2xl">
          <p className="text-gray-700 font-medium mb-1">Henüz kayıtlı firma yok</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-gray-400">
                <th className="px-4 py-3 font-medium">Firma</th>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Üye</th>
                <th className="px-4 py-3 font-medium">Son Ödeme</th>
                <th className="px-4 py-3 font-medium">Kayıt Tarihi</th>
                <th className="px-4 py-3 font-medium">Durum</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map(org => (
                <tr key={org.id} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-3 font-medium text-gray-900">{org.name}</td>
                  <td className="px-4 py-3 text-gray-600">{PLAN_LABELS[org.plan] || org.plan}</td>
                  <td className="px-4 py-3 text-gray-600">{org.member_count}/{org.driver_limit}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {org.last_payment_at ? new Date(org.last_payment_at).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{new Date(org.created_at).toLocaleDateString('tr-TR')}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${org.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {org.is_active ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
