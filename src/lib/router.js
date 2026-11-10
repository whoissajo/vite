import { useEffect, useState } from 'react';

/** Tiny hash router: works on any static host, file:// and chrome-extension:// URLs. */
export function parseHash(hash = window.location.hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path] = raw.split('?');
  return { path: '/' + path, parts: path.split('/').filter(Boolean).map(decodeURIComponent) };
}

export function useRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return route;
}

export const navigate = (path) => { window.location.hash = '#' + path; };
export const toolHref = (id) => `#/tool/${id}`;

/** Go home and scroll to a landing section. */
export function goSection(id) {
  const scroll = () => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  if (parseHash().parts.length === 0) scroll();
  else { navigate('/'); setTimeout(scroll, 120); }
}
