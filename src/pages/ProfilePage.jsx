import { FOCUS } from '../lib/focus';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { User, Phone, Save, CheckCircle, Monitor, Sun, Moon } from 'lucide-react';
import { TEMA_DEGERLERI, temaOku, temaUygula, temaYaz } from '../lib/theme';

// Etiket ve ikon — seçeneklerin KENDİSİ `TEMA_DEGERLERI`den gelir (tek
// kaynak, mobil ikiziyle aynı üç değer). Bilinmeyen bir değer ham hâliyle
// basılır, yani EKRANDA görünür; sessizce listeden düşmez.
const TEMA_ETIKET = { system: 'Sistem', light: 'Açık', dark: 'Koyu' };
const TEMA_IKON   = { system: Monitor, light: Sun, dark: Moon };

export default function ProfilePage() {
  const { user } = useAuth();
  const [form,    setForm]    = useState({ full_name: '', phone: '', company_name: '' });
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);
  const [saved,   setSaved]   = useState(false);
  const [error,   setError]   = useState('');
  // TERCİH DEPODAN OKUNUR (tembel başlatıcı), modül sabitinden değil: bu
  // sayfa rota geçişlerinde yeniden mount oluyor ve bayat bir değer yanlış
  // seçeneği işaretler — kullanıcı da üstüne dokunup kendi tercihini
  // farkında olmadan siler.
  const [tema,    setTema]    = useState(temaOku);
  const [temaHata, setTemaHata] = useState('');
  const [loadError, setLoadError] = useState('');
  // Profil GERÇEKTEN okunabildi mi? Okunamadıysa kaydetmeye izin verilmez:
  // ekrandaki boş alanlar kullanıcının sildiği değerler değil, HİÇ
  // OKUNAMAMIŞ değerlerdir — üzerine yazmak telefonu (bildirim alıcısı) ve
  // firma adını sessizce siler. Mobil ikizinde aynı kapı var.
  const [loaded, setLoaded] = useState(false);

  // AYRI FONKSİYON, çünkü TEKRAR DENENEBİLMELİ: geçici bir ağ hatası
  // kaydetmeyi kalıcı olarak kilitlememeli.
  //
  // `.single()` KULLANILMAZ, `limit(1)` kullanılır: PostgREST sıfır satırda
  // 406 döner, yani "profil satırı henüz yok" ile "okuyamadım" aynı hâle
  // düşerdi ve profili hiç olmayan YENİ kullanıcı profilini asla
  // kaydedemezdi (mobil ikizinde birebir bu yaşandı).
  function loadProfile() {
    return supabase.from('profiles').select('*').eq('id', user.id).limit(1)
      .then(({ data, error }) => {
        // HATAYI GÖRMEK YETMEZ, EKRANA BASMAK GEREKİR. Yutulduğunda
        // dispatcher BOŞ BİR FORM görüyor, "doldurmamışım" deyip Kaydet'e
        // basıyor ve telefonu boş dizeyle üzerine yazılıyor — o hesabın
        // SMS/WhatsApp bildirimleri sessizce ölüyor ve sebebi günler sonra
        // bulunamıyor.
        if (error) { setLoadError(error.message || String(error)); return; }
        setLoadError('');
        const row = Array.isArray(data) ? data[0] : data;
        if (row) setForm({ full_name: row.full_name || '', phone: row.phone || '', company_name: row.company_name || '' });
        // Boş sonuç MEŞRU bir hâldir (profil henüz yok) — okuma başarılı.
        setLoaded(true);
      })
      // REDDEDİLEN İSTEK DE YAKALANIR: supabase-js çoğu hatayı {data, error}
      // ile RESOLVE ediyor ama ağ katmanının kendisi reddedebilir.
      .catch(e => setLoadError(e?.message || String(e)))
      // Yükleme göstergesi HER İKİ dalda da kapanmalı, yoksa
      // reddedilen istekte sayfa sonsuza kadar "Yükleniyor..."da donar.
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadProfile(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [user.id]);

  async function handleSave(e) {
    e.preventDefault();
    setError('');
    // İKİNCİ KAPI: profil hiç okunamadıysa kaydetme.
    if (!loaded) { setError(`Profil okunamadı, bu yüzden kaydedilemez. ${loadError}`.trim()); return; }
    setSaving(true);
    const { error } = await supabase.from('profiles').upsert({
      id:           user.id,
      full_name:    form.full_name.trim(),
      phone:        form.phone.trim(),
      company_name: form.company_name.trim(),
    });
    setSaving(false);
    if (error) setError(error.message);
    else { setSaved(true); setTimeout(() => setSaved(false), 2500); }
  }

  function secTema(v) {
    // YAZMA ÖNCE, işaretleme SONRA. Tersi sırada kaydedilemeyen bir tercih
    // ekranda seçili görünür ve sayfa yenilenince sessizce eskisine döner.
    if (!temaYaz(v)) { setTemaHata('Görünüm tercihi bu tarayıcıya kaydedilemedi.'); return; }
    setTemaHata('');
    setTema(v);
    // WEBDE ANINDA UYGULANIR — mobildeki "uygulamayı yeniden açın" kısıtı
    // burada YOK, çünkü palet CSS değişkeninde duruyor. Cevabın kendisi
    // sayfanın dönmesi: en iyi keşfedilebilirlik geri bildirimi bu.
    temaUygula(v);
  }

  if (loading) return <div className="p-8 text-sm text-ink-muted">Yükleniyor...</div>;

  return (
    <div className="p-8 max-w-lg">
      <h1 className="text-2xl font-bold text-ink mb-1">Profil</h1>
      <p className="text-sm text-ink-muted mb-8">Bildirimler buradaki telefon numarasına gider.</p>

      {error && (
        <div className="mb-4 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">{error}</div>
      )}

      {/* OKUMA HATASI KAPANMAZ ve yanında ÇIKIŞ taşır: kapatılabilseydi boş
          form "profilim boşmuş" gibi okunur, tekrar deneme yolu olmasaydı
          geçici bir hata kaydetmeyi kalıcı olarak kilitlerdi. */}
      {loadError && (
        <div className="mb-4 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">
          <p>Profil yüklenemedi: {loadError}</p>
          <button type="button" onClick={() => { setLoading(true); loadProfile(); }} className="mt-1 font-semibold underline">
            Tekrar dene
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-5">
        <div className="bg-surface border border-surface-border rounded-card p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1">Ad Soyad</label>
            <input
              value={form.full_name}
              onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))}
              className={`w-full border border-surface-inputborder rounded-card px-4 py-2.5 text-sm ${FOCUS}`}
              placeholder="Mehmet Demir"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1">Firma Adı</label>
            <input
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              className={`w-full border border-surface-inputborder rounded-card px-4 py-2.5 text-sm ${FOCUS}`}
              placeholder="Transfer Co."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-ink-soft mb-1 flex items-center gap-1.5">
              <Phone size={13} className="text-brand-600" />
              Telefon Numarası
              <span className="text-brand-600 font-normal text-xs">(SMS/WhatsApp bildirimleri buraya gelir)</span>
            </label>
            <input
              value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              type="tel"
              className={`w-full border border-surface-inputborder rounded-card px-4 py-2.5 text-sm ${FOCUS}`}
              placeholder="0532 000 00 00"
              required
            />
          </div>
        </div>

        <div className="bg-surface border border-surface-border rounded-card p-6">
          <p className="text-sm font-semibold text-ink-soft mb-1">E-posta</p>
          <p className="text-sm text-ink-muted">{user.email}</p>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-onfill rounded-card px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          {saved
            ? <><CheckCircle size={15} /> Kaydedildi</>
            : <><Save size={15} /> {saving ? 'Kaydediliyor...' : 'Kaydet'}</>}
        </button>
      </form>

      {/* AYARLAR — mobil ikizinin webdeki karşılığı (A6). Gece modu canlıya
          çıktı ve kullanıcı İKİ TUR boyunca bulamadı: açmanın tek yolu
          işletim sisteminin ayarıydı ve uygulamanın içinde ondan bahseden
          hiçbir şey yoktu. Keşfedilemeyen özellik yapılmamış sayılır.

          FORMUN DIŞINDA: içine konsaydı seçenekler `type="submit"` sayılıp
          profil kaydını tetiklerdi. `type="button"` ayrıca yazılı. */}
      <div className="mt-5 bg-surface border border-surface-border rounded-card p-6">
        <p className="text-sm font-semibold text-ink-soft mb-1">Ayarlar</p>
        <p className="text-xs text-ink-muted mb-4">Bu tercih yalnız bu tarayıcıda geçerlidir.</p>

        <div className="flex items-center gap-1.5 mb-2">
          <Sun size={13} className="text-ink-muted" />
          <span className="text-sm font-semibold text-ink-soft">Görünüm</span>
        </div>
        {/* SEÇENEKLER `TEMA_DEGERLERI`DEN ÜRETİLİR, elle yazılmaz — üç değerin
            tek kaynağı orası ve mobil ikiziyle aynı olmak zorunda. */}
        <div className="flex gap-2">
          {TEMA_DEGERLERI.map((v) => {
            const Ikon = TEMA_IKON[v] || Monitor;
            const secili = tema === v;
            return (
              <button
                key={v}
                type="button"
                onClick={() => secTema(v)}
                aria-pressed={secili}
                className={`flex-1 flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-card border text-sm font-semibold transition-colors ${FOCUS} ${
                  secili
                    ? 'border-brand-600 bg-brand-50 text-brand-600'
                    : 'border-surface-borderstrong text-ink-soft hover:bg-surface-alt'
                }`}
              >
                <Ikon size={14} />
                {TEMA_ETIKET[v] || v}
              </button>
            );
          })}
        </div>

        {/* YAZMA HATASI EKRANDA. Sessizce yutulsaydı seçim işaretlenir,
            kullanıcı sayfayı yenilediğinde eski paleti bulurdu. */}
        {temaHata && (
          <p className="mt-3 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800">{temaHata}</p>
        )}
      </div>
    </div>
  );
}
