import { useEffect } from 'react';
import Header from './components/layout/Header.jsx';
import Footer from './components/layout/Footer.jsx';
import CommandPalette, { useCommandPalette } from './components/layout/CommandPalette.jsx';
import { ToastHost } from './components/ui/index.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Landing from './pages/Landing.jsx';
import ToolsPage from './pages/ToolsPage.jsx';
import ToolPage from './pages/ToolPage.jsx';
import { useRoute } from './lib/router.js';

export default function App() {
  const route = useRoute();
  const [paletteOpen, setPaletteOpen] = useCommandPalette();
  const [first, second] = route.parts;

  useEffect(() => {
    if (!window.location.hash.includes('#section')) window.scrollTo({ top: 0 });
  }, [route.path]);

  let page;
  if (!first) page = <Landing onSearch={() => setPaletteOpen(true)} />;
  else if (first === 'tools') page = <ToolsPage group={second} />;
  else if (first === 'tool') page = <ToolPage id={second} key={second} />;
  else page = <div className="container page-pad"><div className="empty"><b>Page not found.</b><a className="btn btn-sm" href="#/">Go home</a></div></div>;

  return (
    <>
      <a href="#main" className="skip-link" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus(); }}>Skip to content</a>
      <Header onSearch={() => setPaletteOpen(true)} />
      <main id="main" tabIndex={-1}><ErrorBoundary resetKey={route.path}>{page}</ErrorBoundary></main>
      <Footer />
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <ToastHost />
    </>
  );
}
