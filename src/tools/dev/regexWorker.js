// Runs user regexes off the main thread so catastrophic backtracking can be terminated.
self.onmessage = (e) => {
  const { pattern, flags, text, replace } = e.data;
  try {
    const re = new RegExp(pattern, flags.includes('g') || flags.includes('y') ? flags : flags + 'g');
    const matches = []; let m; let guard = 0;
    while ((m = re.exec(text)) && guard++ < 5000) {
      matches.push({ index: m.index, end: m.index + m[0].length, text: m[0], groups: [...m].slice(1), named: m.groups ? { ...m.groups } : null, indices: m.indices ? m.indices.slice(1) : null });
      if (m[0] === '') re.lastIndex++;
    }
    let replaced = null;
    if (replace != null) replaced = text.replace(new RegExp(pattern, flags.includes('g') ? flags : flags), replace);
    self.postMessage({ ok: true, matches, replaced });
  } catch (err) { self.postMessage({ ok: false, error: err.message }); }
};
