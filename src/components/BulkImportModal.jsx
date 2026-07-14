import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../lib/api';
import { X, Upload, Download, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';

// Excel/CSV başlıklarını iç alanlarımıza eşleştir (yaygın varyantları tanır)
const HEADER_MAP = {
  scheduled_pickup: ['tarih', 'date', 'tarih saat', 'tarih/saat', 'datetime', 'varış', 'varis'],
  flight_number:    ['uçuş no', 'ucus no', 'uçuş', 'ucus', 'flight', 'flight no', 'flight number', 'uçuş numarası', 'ucus numarasi'],
  passenger_name:   ['yolcu', 'yolcu adı', 'yolcu adi', 'ad', 'isim', 'ad soyad', 'name', 'passenger', 'passenger name'],
  passenger_phone:  ['telefon', 'tel', 'phone', 'gsm', 'cep', 'numara'],
  vehicle_plate:    ['plaka', 'plate', 'araç plakası', 'arac plakasi'],
  passenger_lang:   ['dil', 'lang', 'language'],
  pnr:              ['pnr'],
  notes:            ['not', 'notlar', 'note', 'notes', 'açıklama', 'aciklama'],
};

const norm = (s) => (s || '').toString().trim().toLowerCase();

function detectLang(name) {
  const s = name || '';
  if (/[؀-ۿ]/.test(s)) return 'ar';
  if (/[Ѐ-ӿ]/.test(s)) return 'ru';
  return null;
}

// "GG.AA.YYYY SS:DD" / "GG.AA.YYYY" / Date / native-parse
function parseDate(v) {
  if (v instanceof Date && !isNaN(v.getTime())) return v;
  const s = (v || '').toString().trim();
  if (!s) return null;
  const m = s.match(/^(\d{1,2})[.\/-](\d{1,2})[.\/-](\d{2,4})(?:[ T](\d{1,2}):(\d{2}))?/);
  if (m) {
    const [, dd, mm, yy, hh = '0', min = '0'] = m;
    const year = yy.length === 2 ? 2000 + +yy : +yy;
    const d = new Date(year, +mm - 1, +dd, +hh, +min);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function mapRow(raw) {
  // raw: { başlık: değer } — başlıkları eşleştir
  const keys = Object.keys(raw);
  const find = (field) => {
    const aliases = HEADER_MAP[field];
    const k = keys.find((key) => aliases.includes(norm(key)));
    return k ? raw[k] : '';
  };
  const name = (find('passenger_name') || '').toString().trim();
  const langRaw = norm(find('passenger_lang'));
  const lang = ['tr', 'en', 'de', 'ru', 'ar'].includes(langRaw) ? langRaw : detectLang(name);
  const dateVal = parseDate(find('scheduled_pickup'));
  const flight = (find('flight_number') || '').toString().toUpperCase().replace(/\s+/g, '');

  const errors = [];
  if (!flight) errors.push('Uçuş no');
  if (!dateVal) errors.push('Tarih');

  return {
    flight_number:   flight,
    scheduled_pickup: dateVal,
    passenger_name:  name,
    passenger_phone: (find('passenger_phone') || '').toString().trim(),
    vehicle_plate:   (find('vehicle_plate') || '').toString().trim().toUpperCase(),
    passenger_lang:  lang,
    pnr:             (find('pnr') || '').toString().trim(),
    notes:           (find('notes') || '').toString().trim(),
    _errors:         errors,
  };
}

export default function BulkImportModal({ onClose, onDone }) {
  const [rows, setRows]       = useState([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const inputRef = useRef();

  function handleFile(file) {
    if (!file) return;
    setError(''); setResult(null); setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array', cellDates: true });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const raw = XLSX.utils.sheet_to_json(sheet, { defval: '' });
        if (!raw.length) { setError('Dosyada satır bulunamadı.'); return; }
        setRows(raw.map(mapRow));
      } catch (err) {
        setError('Dosya okunamadı: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  function downloadTemplate() {
    const aoa = [
      ['Tarih', 'Uçuş No', 'Yolcu Adı', 'Telefon', 'Plaka', 'Dil', 'PNR', 'Not'],
      ['10.07.2026 14:30', 'TK8', 'Hans Müller', '+491512345678', '34 ABC 123', 'de', 'ABC123', 'VIP, tabela'],
      ['10.07.2026 15:00', 'PC1250', 'Иван Петров', '+79161234567', '', 'ru', '', 'Otel X'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 18 }, { wch: 10 }, { wch: 18 }, { wch: 16 }, { wch: 12 }, { wch: 6 }, { wch: 10 }, { wch: 20 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Transferler');
    XLSX.writeFile(wb, 'TransferAlert_sablon.xlsx');
  }

  const validRows = rows.filter(r => r._errors.length === 0);
  const invalidCount = rows.length - validRows.length;

  async function handleImport() {
    if (!validRows.length) return;
    setImporting(true); setError('');
    try {
      const payload = validRows.map(r => ({
        flight_number:   r.flight_number,
        scheduled_pickup: r.scheduled_pickup.toISOString(),
        passenger_name:  r.passenger_name || null,
        passenger_phone: r.passenger_phone || null,
        vehicle_plate:   r.vehicle_plate || null,
        passenger_lang:  r.passenger_lang || null,
        pnr:             r.pnr || null,
        notes:           r.notes || null,
      }));
      const res = await api.bulkCreateReservations(payload);
      setResult(res);
      onDone?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-card shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-ink flex items-center gap-2"><FileSpreadsheet size={18} className="text-ok-600" /> Toplu İçe Aktar (Excel / CSV)</h2>
          <button onClick={onClose} className="text-ink-muted hover:text-ink-soft"><X size={18} /></button>
        </div>

        <div className="px-6 py-5 overflow-y-auto">
          {result ? (
            <div className="text-center py-8">
              <CheckCircle size={48} className="text-ok-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-ink">{result.inserted} transfer eklendi</p>
              {result.skipped > 0 && <p className="text-sm text-warn-600 mt-1">{result.skipped} satır atlandı (eksik/hatalı)</p>}
              <button onClick={onClose} className="mt-6 bg-brand-600 hover:bg-brand-700 text-white rounded-card px-6 py-2.5 text-sm font-semibold">Kapat</button>
            </div>
          ) : (
            <>
              {/* Adım 1: yükleme + şablon */}
              <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <button
                  onClick={() => inputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 border-2 border-dashed border-surface-borderstrong hover:border-brand-600 hover:bg-brand-50 rounded-card px-4 py-6 text-sm text-ink-soft transition-colors"
                >
                  <Upload size={18} /> {fileName || 'Dosya seç (.xlsx / .csv)'}
                </button>
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center gap-2 border border-surface-border hover:bg-surface-bg rounded-card px-4 py-3 text-sm text-ink-soft transition-colors sm:w-44"
                >
                  <Download size={16} /> Şablonu indir
                </button>
                <input ref={inputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={e => handleFile(e.target.files[0])} />
              </div>

              <p className="text-xs text-ink-muted mb-4">
                Şablonu indirip doldurun ya da otelinizden gelen listeyi yükleyin. Sütun başlıkları: Tarih, Uçuş No, Yolcu Adı, Telefon, Plaka, Dil, PNR, Not. Yolcu dili boşsa isimden otomatik algılanır.
              </p>

              {error && (
                <div className="flex items-start gap-2 px-3 py-2.5 bg-bad-50 border border-bad-600/20 rounded-control text-sm text-bad-800 mb-4">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />{error}
                </div>
              )}

              {/* Adım 2: önizleme */}
              {rows.length > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-2 text-sm">
                    <span className="font-semibold text-ink-soft">{rows.length} satır</span>
                    <span className="text-ok-600">{validRows.length} geçerli</span>
                    {invalidCount > 0 && <span className="text-bad-600">{invalidCount} hatalı</span>}
                  </div>
                  <div className="border border-surface-border rounded-card overflow-auto max-h-72">
                    <table className="w-full text-xs">
                      <thead className="bg-surface-bg text-ink-muted sticky top-0">
                        <tr>
                          <th className="px-2 py-2 text-left">Uçuş</th>
                          <th className="px-2 py-2 text-left">Tarih</th>
                          <th className="px-2 py-2 text-left">Yolcu</th>
                          <th className="px-2 py-2 text-left">Telefon</th>
                          <th className="px-2 py-2 text-left">Dil</th>
                          <th className="px-2 py-2 text-left">Durum</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 100).map((r, i) => (
                          <tr key={i} className={r._errors.length ? 'bg-bad-50' : 'border-t border-surface-border'}>
                            <td className="px-2 py-1.5 font-mono font-semibold">{r.flight_number || '—'}</td>
                            <td className="px-2 py-1.5">{r.scheduled_pickup ? r.scheduled_pickup.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—'}</td>
                            <td className="px-2 py-1.5">{r.passenger_name || '—'}</td>
                            <td className="px-2 py-1.5">{r.passenger_phone || '—'}</td>
                            <td className="px-2 py-1.5 uppercase">{r.passenger_lang || '—'}</td>
                            <td className="px-2 py-1.5">
                              {r._errors.length
                                ? <span className="text-bad-800">Eksik: {r._errors.join(', ')}</span>
                                : <span className="text-ok-600">✓</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {rows.length > 100 && <p className="text-xs text-ink-muted mt-1">İlk 100 satır gösteriliyor ({rows.length} toplam).</p>}

                  <button
                    onClick={handleImport}
                    disabled={importing || !validRows.length}
                    className="w-full mt-4 bg-ok-600 hover:bg-ok-800 disabled:opacity-50 text-white rounded-card px-4 py-3 text-sm font-semibold transition-colors"
                  >
                    {importing ? 'İçe aktarılıyor...' : `${validRows.length} transferi içe aktar`}
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
