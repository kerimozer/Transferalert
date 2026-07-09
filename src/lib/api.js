import { supabase } from './supabase';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function req(method, path, body) {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return null;

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Hata ${res.status}`);
  return json;
}

export const api = {
  // Rezervasyonlar
  listReservations:  ()         => req('GET',    '/api/reservations'),
  createReservation: (data)     => req('POST',   '/api/reservations', data),
  bulkCreateReservations: (rows) => req('POST',  '/api/reservations/bulk', { rows }),
  getBookingLink:    ()          => req('GET',    '/api/reservations/booking-link'),
  getRequestInfo:    (token)     => req('GET',    `/api/public/request-info/${token}`),
  submitRequest:     (token, d)  => req('POST',   `/api/public/request/${token}`, d),
  updateReservation: (id, data) => req('PATCH',  `/api/reservations/${id}`, data),
  deleteReservation: (id)       => req('DELETE', `/api/reservations/${id}`),

  // Uçuş arama (form doğrulama için)
  searchFlight: (flight) => req('GET', `/api/flights/search?flight=${encodeURIComponent(flight)}`),

  // Bildirimler
  listNotifications: () => req('GET', '/api/notifications'),

  // Sürücüler
  listDrivers:  ()         => req('GET',    '/api/drivers'),
  addDriver:    (data)     => req('POST',   '/api/drivers', data),
  deleteDriver: (id)       => req('DELETE', `/api/drivers/${id}`),

  // Firma (Organization)
  getMyOrg:      ()     => req('GET',    '/api/organizations/my'),
  createOrg:     (data) => req('POST',   '/api/organizations', data),
  listOrgMembers: ()    => req('GET',    '/api/organizations/members'),
  inviteMember:  (data) => req('POST',   '/api/organizations/invite', data),
  removeMember:  (id)   => req('DELETE', `/api/organizations/members/${id}`),

  // Ödeme (iyzico)
  createCheckout: (plan) => req('POST', '/api/billing/checkout', { plan }),
  createReservationCheckout: (reservation_id, amount) => req('POST', '/api/billing/checkout-reservation', { reservation_id, amount }),

  // Platform admin (sadece is_platform_admin=true kullanıcılar erişebilir)
  listAdminOrgs:  () => req('GET', '/api/admin/organizations'),
  getAdminStats:  () => req('GET', '/api/admin/stats'),
  updatePlan:     (key, data) => req('PUT', `/api/admin/plans/${key}`, data),

  // Planlar (herhangi bir giriş yapmış kullanıcı görebilir)
  listPlans: () => req('GET', '/api/plans'),
};
