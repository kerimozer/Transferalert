import { useNavigate } from 'react-router-dom';
import { Plane, ArrowLeft } from 'lucide-react';

const CONTROLLER_NAME = 'Kerim Özer';
const CONTACT_EMAIL   = 'onbironbir.bomonti@gmail.com';
const LAST_UPDATED    = '8 Ağustos 2026';

export default function PrivacyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface-bg">
      <nav className="border-b border-surface-border px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 text-sm text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Ana sayfa
        </button>
        <div className="flex items-center gap-2">
          <div className="bg-brand-600 text-white p-1 rounded-md">
            <Plane size={14} />
          </div>
          <span className="font-semibold text-ink-soft text-sm">TransferAlert</span>
        </div>
      </nav>

      <article className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-ink mb-1">Gizlilik Politikası ve KVKK Aydınlatma Metni</h1>
        <p className="text-sm text-ink-muted mb-10">Son güncelleme: {LAST_UPDATED}</p>

        <Section title="1. Veri Sorumlusu">
          <p>
            6698 sayılı Kişisel Verilerin Korunması Kanunu (&ldquo;KVKK&rdquo;) uyarınca, TransferAlert platformu
            (web paneli, mobil uygulama ve herkese açık transfer takip/talep sayfaları) kapsamında işlenen
            kişisel verileriniz bakımından veri sorumlusu <strong>{CONTROLLER_NAME}</strong>&rsquo;dür. Platform
            şu an tüzel kişilik (şirket) çatısı altında değil, şahıs faaliyeti olarak yürütülmektedir; bir şirket
            kurulduğunda bu bölüm güncellenecektir.
          </p>
          <p>İletişim: <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 hover:underline">{CONTACT_EMAIL}</a></p>
        </Section>

        <Section title="2. Hangi Kişisel Verileri İşliyoruz?">
          <p>Platformu kimin kullandığına göre işlenen veri kategorileri farklılaşır:</p>
          <ul>
            <li><strong>Platform kullanıcıları (transfer firması yetkilileri):</strong> ad soyad, e-posta, telefon, firma adı — hesap oluştururken doğrudan sizden alınır.</li>
            <li><strong>Yolcu bilgileri:</strong> yolcu adı, telefon numarası, PNR, uçuş numarası, alış saati, notlar, tercih edilen dil — platformu kullanan transfer firması tarafından sisteme girilir veya otel/acenta tarafından herkese açık transfer talep formuyla iletilir.</li>
            <li><strong>Şoför bilgileri:</strong> şoför adı, telefonu, araç plakası — transfer firması tarafından sisteme girilir.</li>
            <li><strong>Teknik veriler:</strong> mobil bildirim gönderebilmek için cihaz push bildirim tokenı; sunucu günlüklerinde IP adresi; hata ve performans kayıtları (Sentry aracılığıyla, kimliğinizi doğrudan ifşa etmeyecek şekilde).</li>
            <li><strong>Ödeme bilgileri:</strong> üyelik veya transfer ücreti ödemelerinde kart bilgileriniz doğrudan iyzico&rsquo;nun güvenli ödeme sayfası üzerinden işlenir; kart numarası, son kullanma tarihi veya CVV bilgisi TransferAlert sunucularına hiçbir zaman ulaşmaz veya saklanmaz.</li>
          </ul>
        </Section>

        <Section title="3. Kişisel Verileri Hangi Amaçla İşliyoruz?">
          <ul>
            <li>Uçuş durumunun takip edilmesi ve durum değişikliklerinde otomatik bildirim gönderilmesi</li>
            <li>Yolcu ile şoför/transfer firması arasındaki koordinasyonun sağlanması</li>
            <li>Hesabınızın oluşturulması, kimlik doğrulaması ve yönetimi</li>
            <li>Müşteri desteğinin sağlanması</li>
            <li>Hizmetin güvenliğinin ve kalitesinin izlenmesi, hata tespiti ve giderilmesi</li>
            <li>Ödeme işlemlerinin gerçekleştirilmesi</li>
            <li>Yasal yükümlülüklerin yerine getirilmesi</li>
          </ul>
        </Section>

        <Section title="4. Hukuki Sebep">
          <p>Kişisel verileriniz, KVKK madde 5 kapsamında aşağıdaki hukuki sebeplere dayanarak işlenir:</p>
          <ul>
            <li>Bir sözleşmenin kurulması veya ifasıyla doğrudan ilgili olması (transfer/uçuş takip hizmetinin sunulabilmesi için)</li>
            <li>Veri sorumlusunun meşru menfaatinin bulunması (hizmet kalitesi, güvenlik, dolandırıcılığın önlenmesi)</li>
            <li>Kanunlarda açıkça öngörülmesi (örn. vergi ve ticaret mevzuatı gereği belge saklama yükümlülüğü)</li>
            <li>Bazı bildirim tercihleri için açık rızanızın alınması</li>
          </ul>
        </Section>

        <Section title="5. Kişisel Verileri Kimlerle Paylaşıyoruz?">
          <p>Hizmeti sunabilmek için aşağıdaki hizmet sağlayıcılarla sınırlı ve amaçla bağlantılı şekilde veri paylaşılır:</p>
          <ul>
            <li><strong>Supabase</strong> — veritabanı barındırma ve kimlik doğrulama altyapısı</li>
            <li><strong>Railway</strong> — sunucu barındırma</li>
            <li><strong>Google/Expo push bildirim altyapısı</strong> — mobil bildirim gönderimi</li>
            <li><strong>Uçuş veri sağlayıcıları</strong> (AviationStack, AeroDataBox, AirLabs) — bu sağlayıcılara yalnızca uçuş numarası iletilir, herhangi bir kişisel veri paylaşılmaz</li>
            <li><strong>Sentry</strong> — teknik hata izleme</li>
            <li><strong>iyzico</strong> — ödeme işlemlerinin PCI-DSS uyumlu şekilde gerçekleştirilmesi</li>
            <li>Yetkili kamu kurum ve kuruluşları — yalnızca yasal bir talep halinde</li>
          </ul>
          <p>
            Bu hizmet sağlayıcılardan bir kısmının sunucuları yurt dışında bulunabilir. Bu durumda aktarım,
            KVKK&rsquo;nın yurt dışına veri aktarımına ilişkin hükümleri (madde 9) çerçevesinde gerçekleştirilir.
          </p>
        </Section>

        <Section title="6. Saklama Süresi">
          <p>
            Kişisel verileriniz, hesabınız aktif olduğu sürece ve ilgili mevzuatın öngördüğü yasal saklama
            süreleri boyunca saklanır. Hesabınızın kapatılmasını talep etmeniz halinde verileriniz, yasal
            zorunluluk bulunmadığı ölçüde makul bir süre içinde silinir veya anonim hale getirilir.
          </p>
        </Section>

        <Section title="7. Haklarınız">
          <p>KVKK madde 11 uyarınca aşağıdaki haklara sahipsiniz:</p>
          <ul>
            <li>Kişisel verinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse buna ilişkin bilgi talep etme</li>
            <li>İşlenme amacını ve amacına uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde/yurt dışında aktarıldığı üçüncü kişileri bilme</li>
            <li>Eksik veya yanlış işlenmişse düzeltilmesini isteme</li>
            <li>Kanuni şartlar çerçevesinde silinmesini veya yok edilmesini isteme</li>
            <li>Yapılan işlemlerin, verilerin aktarıldığı üçüncü kişilere bildirilmesini isteme</li>
            <li>Otomatik sistemlerle analiz edilmesi sonucu aleyhinize bir sonuç ortaya çıkmasına itiraz etme</li>
            <li>Kanuna aykırı işlenme nedeniyle zarara uğramanız halinde zararın giderilmesini talep etme</li>
          </ul>
        </Section>

        <Section title="8. Başvuru Yöntemi">
          <p>
            Yukarıdaki haklarınızı kullanmak için kimliğinizi tevsik edici belgelerle birlikte
            <a href={`mailto:${CONTACT_EMAIL}`} className="text-brand-600 hover:underline"> {CONTACT_EMAIL}</a> adresine
            yazılı olarak başvurabilirsiniz. Talebiniz, niteliğine göre en kısa sürede ve en geç KVKK&rsquo;da
            öngörülen süre içinde (otuz gün) sonuçlandırılır.
          </p>
        </Section>

        <Section title="9. Çerezler">
          <p>
            Platform şu an pazarlama amaçlı üçüncü taraf çerez veya izleyici kullanmamaktadır. Oturumunuzu
            açık tutabilmek için teknik olarak zorunlu bir kimlik doğrulama bilgisi tarayıcınızda/cihazınızda
            saklanır.
          </p>
        </Section>

        <Section title="10. Değişiklikler">
          <p>
            Bu metin, hizmetin gelişmesi veya mevzuat değişiklikleri doğrultusunda güncellenebilir. Güncel
            sürüm her zaman bu sayfada, güncelleme tarihiyle birlikte yayınlanır.
          </p>
        </Section>
      </article>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-base font-semibold text-ink mb-2">{title}</h2>
      <div className="text-sm text-ink-soft leading-relaxed space-y-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_li]:text-sm">
        {children}
      </div>
    </section>
  );
}
