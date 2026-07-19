# UI Kütüphanesi — `components/ui`

Tasarım sisteminin (petrol + kehribar + stone; bkz. `.claude/skills/tasarimci`) React karşılığı.
**Kural: sayfada çıplak buton/rozet/kart sınıfı yazma — buradan import et.** Sınıf sürüklenmesinin
(6 farklı el yazımı primary buton, 3 farklı radius) panzehiri bu klasördür.

```jsx
import { Button, IconButton, Badge, Card, StatCard, Field, Input, EmptyState, LoadingBlock, Modal } from '../components/ui';
```

## Bileşen API'leri

| Bileşen | Props | Not |
|---|---|---|
| `Button` | `variant` primary·secondary·danger·ghost · `size` sm·md · `loading` · `icon` (lucide) · `fullWidth` · `type` | `loading` → disabled + aria-busy + spinner; sayfada EN FAZLA BİR primary |
| `IconButton` | `label` (ZORUNLU, a11y) · `icon` · `tone` muted·danger·brand | Satır içi sil/paylaş/kopyala; label hem aria-label hem title |
| `Badge` | `tone` brand·ok·warn·bad·neutral **veya** `cls` (lib/status haritasından) · `icon` | Renk anlam taşır; `lib/status.js` haritalarıyla birlikte kullan |
| `Card` | `padding` none·sm·md | Liste kartlarında `none` + satırlar kendi padding'i |
| `StatCard` | `label` · `value` · `icon` · `tone` | Sayı HER ZAMAN mürekkep; renk ikonda |
| `Field` | `label` · `required` · `error` · `hint` · `input` (Input props) veya render-prop | id/aria-describedby/aria-invalid otomatik; hata aria-live anons edilir |
| `EmptyState` | `icon` · `title` · `description` · `action` · `size` sm·md | Davet eder, özür dilemez; `sm` kart içi tek satır |
| `LoadingBlock` | `label` | role=status; sayfa/bölüm yüklemesi |
| `Modal` | `title` · `onClose` · `maxWidth` | Escape + zemin tıklaması kapatır, odak panele taşınır, scroll kilidi |

## Kullanım örnekleri

```jsx
// Yükleme → boş → veri üçlüsü (her liste sayfasının iskeleti)
if (loading) return <LoadingBlock />;
if (!items.length) return (
  <EmptyState icon={Plane} title="Henüz uçuş yok"
    description="İlk uçuşu ekleyin, yaklaştığında otomatik bildirim alın."
    action={<Button icon={Plus} onClick={openForm}>Uçuş Ekle</Button>} />
);

// Gönderim butonu — çift tıklama koruması loading'le bedava gelir
<Button type="submit" loading={submitting} fullWidth>Kaydet</Button>

// Durum rozeti — tek kaynak haritayla
<Badge cls={RES_STATUS_BADGE[r.status]?.cls}>{RES_STATUS_BADGE[r.status]?.label}</Badge>

// Erişilebilir form alanı
<Field label="Uçuş No" required error={errors.flight} hint="Örn: TK123"
  input={{ value: flight, onChange: e => setFlight(e.target.value), placeholder: 'TK123' }} />
```

## En iyi pratikler

1. **Önce kütüphaneye bak** — yeni bir görsel desen gerekiyorsa önce buraya bileşen ekle, sonra sayfada kullan. İki sayfada aynı sınıf dizisini kopyaladıysan bileşen çıkarma zamanı gelmiş demektir.
2. **Her liste ekranı üç durumu ele alır**: yükleniyor (`LoadingBlock`), boş (`EmptyState`), veri. "Boş beyaz alan" bir hata sayılır.
3. **İkon-tek etkileşim = `IconButton`** — `label`'sız ikon butonu ekran okuyucuda isimsiz düğmedir; bileşen bunu zorunlu prop yaparak unutulmaz kılar.
4. **Görsel değişiklik = token değişikliği**: renk/radius değişecekse `tailwind.config.js` token'ı değişir, bileşen sınıfı değişmez. Sayfaya özel `className` yalnız YERLEŞİM için (margin/genişlik), görünüm için değil.
5. **Responsive**: geniş içerik (tablo/kod) kendi `overflow-x-auto` kabında kaydırılır; sayfa gövdesi asla yatay kaymaz. Grid'lerde `minmax(0, 1fr)`.
