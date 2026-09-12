import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import App from './App';
import { temaIzle, temaOku, temaUygula } from './lib/theme';
import './index.css';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
});

// TEMA. Damgayı `index.html`teki satır içi betik zaten bastı (ilk boyadan
// önce); buradaki çağrı iki işi yapar: betik herhangi bir sebeple koşmadıysa
// (CSP, eski önbellekteki HTML) uygulamayı yine de doğru temaya oturtur, ve
// "Sistem" seçiliyken işletim sistemi teması değişince sayfayı ANINDA
// döndürür. Abonelik olmadan kullanıcı sistem temasını değiştirir, sekmeye
// döner ve hiçbir şey olmaz — mobil tarafta aynı boşluk denetimde yakalandı.
temaUygula(temaOku());
temaIzle();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
