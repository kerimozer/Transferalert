import { X, Printer, Plane } from 'lucide-react';

export default function WelcomeSignModal({ reservation, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg print:shadow-none print:rounded-none print:max-w-none">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <h2 className="font-semibold text-gray-900">Karşılama Tabelası</h2>
          <div className="flex items-center gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1.5">
              <Printer size={14} /> Yazdır
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-16 px-8 text-center print:py-24">
          <div className="flex items-center gap-2 text-blue-600 mb-8">
            <Plane size={24} />
            <span className="font-bold text-lg">TransferAlert</span>
          </div>
          <p className="text-6xl font-black text-gray-900 leading-tight break-words">
            {reservation.passenger_name || reservation.notes || 'Yolcu'}
          </p>
          <p className="mt-8 font-mono text-3xl font-bold text-gray-400 tracking-wider">
            {reservation.flight_number}
          </p>
        </div>
      </div>
    </div>
  );
}
