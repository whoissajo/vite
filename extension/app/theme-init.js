// Applies the saved theme before first paint (external file: MV3 extension CSP forbids inline scripts).
try {
  var t = localStorage.getItem('offkit-theme');
  if (!t) t = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', t);
} catch (e) {}
