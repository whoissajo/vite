import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles/fonts.css';
import './styles/tokens.css';
import './styles/base.css';
import './styles/ui.css';
import './styles/layout.css';
import './styles/tool.css';
import './styles/landing.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(<StrictMode><App /></StrictMode>);

// Offline support for the website build. (The extension bundles everything, so it skips this.)
if (!__EXTENSION__ && 'serviceWorker' in navigator && location.protocol.startsWith('http') && import.meta.env.PROD) {
  import('virtual:pwa-register').then((m) => m.registerSW({ immediate: true })).catch(() => {});
}
